
import * as THREE from "three";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
// import { log } from "three/tsl";

/**
 * Manages HTML annotations in 3D space and static 2D annotations on the viewer.
 */
export class AnnotationManager {
  /**
   * Creates an AnnotationManager.
   * @param {THREE.Scene} scene - The THREE.js scene.
   * @param {THREE.Camera} camera - The THREE.js camera.
   * @param {HTMLElement} viewerContainer - The main DOM container for the viewer, for static annotations.
   * @param {Object} options - Configuration options.
   * @param {boolean} [options.hideAnnotationsBehindModel=true] - Hide 3D annotations when behind the model.
   * @param {number} [options.visibilityCheckInterval=100] - Interval in ms for 3D annotation visibility checks.
   */
  constructor(scene, camera, viewerContainer, options = {}) {
    this.scene = scene;
    this.camera = camera;
    this.viewerContainer = viewerContainer; // Store the main viewer container
    this.options = {
      hideAnnotationsBehindModel: true,
      visibilityCheckInterval: 100,
      ...options,
    };

    this.annotations = [];

    // For 3D annotations
    this.raycaster = new THREE.Raycaster();
    this.cameraPosition = new THREE.Vector3();
    this.annotationWorldPosition = new THREE.Vector3();
    this.rayDirection = new THREE.Vector3();

    this.lastVisibilityCheckTime = 0;
  }

  /**
   * Adds an HTML annotation.
   * @param {Object} config - Annotation configuration.
   * @param {string} config.htmlContent - HTML content for the annotation.
   * @param {THREE.Vector3 | Object} config.position - For 3D: THREE.Vector3 in model space. For static: Object with 2D CSS position (e.g., {top: '10px', left: '10px'}).
   * @param {boolean} [config.isStatic=false] - If true, annotation is a static 2D overlay.
   * @param {THREE.Object3D} [config.parent] - Parent object to attach to (for 3D annotations). Required if not static.
   * @param {number} [config.scaleFactor] - Scale factor to apply (for 3D annotations).
   * @param {string} [config.cssClass="model-annotation" | "static-model-annotation"] - CSS class for styling.
   * @param {boolean} [config.faceCamera=true] - Whether 3D annotation should face the camera.
   * @param {number} [config.visibilityDistance=2.4] - Max distance for 3D annotation visibility.
   * @param {number} [config.minVisibilityDistance] - Min distance for 3D annotation visibility.
   * @param {string} [config.id] - Optional ID for the annotation (used as dataset.target).
   * @returns {Object|null} The created annotation object with control methods, or null on error.
   */
  addAnnotation(config) {
    const annotationId = config.id || `annotation-${this.annotations.length}`;

    if (config.isStatic) {
      if (!this.viewerContainer) {
        console.error(
          "Viewer container not provided to AnnotationManager; cannot add static annotation.",
        );
        return null;
      }

      const element = document.createElement("div"); // Static annotations are divs by default
      element.innerHTML = config.htmlContent;
      element.className = config.cssClass || "static-model-annotation";
      element.style.position = "absolute";
      element.style.pointerEvents = "auto"; // Or 'none' if not interactive
      element.style.cursor = "pointer"; // Or 'default'

      if (config.id) {
        element.dataset.target = config.id;
      }

      // Apply 2D position
      if (config.position) {
        if (typeof config.position.top === "string") element.style.top = config.position.top;
        if (typeof config.position.left === "string") element.style.left = config.position.left;
        if (typeof config.position.right === "string") element.style.right = config.position.right;
        if (typeof config.position.bottom === "string") element.style.bottom = config.position.bottom;
        if (typeof config.position.x === "number") element.style.left = `${config.position.x}px`; // Alias
        if (typeof config.position.y === "number") element.style.top = `${config.position.y}px`; // Alias
      }

      this.viewerContainer.appendChild(element);

      const annotation = {
        id: annotationId,
        element: element,
        isStatic: true,
        isVisible: true, // Static annotations are visible by default
        target: config.id,

        setVisible: (visible) => {
          if (annotation.isVisible === visible) return;
          element.style.display = visible ? "" : "none";
          annotation.isVisible = visible;
        },
        setContent: (htmlContent) => {
          element.innerHTML = htmlContent;
        },
        setPosition: (position) => { // Expects {top, left, right, bottom}
          if (typeof position.top === "string") element.style.top = position.top;
          if (typeof position.left === "string") element.style.left = position.left;
          if (typeof position.right === "string") element.style.right = position.right;
          if (typeof position.bottom === "string") element.style.bottom = position.bottom;
        },
        remove: () => {
          if (element.parentNode === this.viewerContainer) {
            this.viewerContainer.removeChild(element);
          }
          const index = this.annotations.findIndex((a) => a.id === annotation.id);
          if (index !== -1) {
            this.annotations.splice(index, 1);
          }
        },
      };
      this.annotations.push(annotation);
      return annotation;

    } else {
      // Logic for 3D annotations (CSS3DObject)
      if (!config.parent?.isObject3D) {
        console.error(
          "Invalid or missing parent object provided for 3D annotation.",
        );
        return null;
      }
      if (!(config.position instanceof THREE.Vector3)) {
        console.error(
          "Invalid position for 3D annotation. Must be a THREE.Vector3.",
        );
        return null;
      }

      const element = document.createElement("button");
      element.innerHTML = config.htmlContent;
      element.className = config.cssClass || "model-annotation";
      element.style.pointerEvents = "auto";
      element.style.cursor = "pointer";
      element.style.opacity = "0"; // Start hidden for transition
      element.style.transition = "opacity 0.2s ease-in-out";
      if (config.id) {
        element.dataset.target = config.id;
      }

      const cssObject = new CSS3DObject(element);
      cssObject.position.copy(config.position);

      const isMobile = window.innerWidth < 768;
      const scaleFactor = isMobile ? (config.scaleFactor || 1) / 3000 : (config.scaleFactor || 1) / 4500;
      cssObject.scale.set(scaleFactor, scaleFactor, scaleFactor);

      config.parent.add(cssObject);

      const annotation = {
        id: annotationId,
        object: cssObject,
        element: element,
        isStatic: false,
        faceCamera: config.faceCamera !== false,
        visibilityDistance: config.visibilityDistance || (isMobile ? 1.8 : 2.4),
        minVisibilityDistance: config.minVisibilityDistance,
        isVisible: false, // Start as not visible, will be updated
        target: config.id,

        setVisible: (visible) => {
          if (annotation.isVisible === visible) return;
          element.style.opacity = visible ? "1" : "0";
          element.style.pointerEvents = visible ? "auto" : "none";
          annotation.isVisible = visible;
        },
        setContent: (htmlContent) => {
          element.innerHTML = htmlContent;
        },
        setPosition: (positionVec3) => {
          if (positionVec3 instanceof THREE.Vector3) {
            cssObject.position.copy(positionVec3);
          }
        },
        remove: () => {
          if (cssObject.parent) {
            cssObject.parent.remove(cssObject);
          }
          const index = this.annotations.findIndex((a) => a.id === annotation.id);
          if (index !== -1) {
            this.annotations.splice(index, 1);
          }
        },
      };
      this.annotations.push(annotation);
      // Trigger initial visibility check for newly added 3D annotations
      if (this.options.hideAnnotationsBehindModel && config.parent.parent) { // Assuming parent is the model, and model is in scene
        this._updateSingleAnnotationVisibility(annotation, config.parent.parent);
      } else {
        annotation.setVisible(true); // If no occlusion check, make it visible
      }
      return annotation;
    }
  }

  /**
   * Updates all annotations based on the current camera view and model state.
   * Handles both 3D annotations and responsive 2D annotations.
   *
   * @param {Object} model - The 3D model object used for visibility checks
   */
  update(model) {
    if (!this.camera || this.annotations.length === 0) return;

    this._updateAnnotationOrientations(); // Only affects 3D annotations

    // update responsive annotations
    if(this.responsiveAnnotations && this.responsiveAnnotations.length > 0) {
      this.responsiveAnnotations.forEach(annotation => {
        if(annotation.updatePosition) annotation.updatePosition();
      })
    }

    const now = performance.now();
    if (
      this.options.hideAnnotationsBehindModel &&
      model &&
      now - this.lastVisibilityCheckTime > this.options.visibilityCheckInterval
    ) {
      this._updateAllAnnotationVisibility(model); // Only affects 3D annotations
      this.lastVisibilityCheckTime = now;
    }
  }

  /**
   * Updates 3D annotation orientations to always face the camera if configured.
   * @private
   */
  _updateAnnotationOrientations() {
    const cameraQuaternion = this.camera.quaternion;
    const parentWorldQuaternion = new THREE.Quaternion();
    const inverseParentQuaternion = new THREE.Quaternion();

    this.annotations.forEach((annotation) => {
      if (annotation.isStatic || !annotation.faceCamera || !annotation.object) return;

      const object = annotation.object;
      if (object.parent) {
        object.parent.getWorldQuaternion(parentWorldQuaternion);
        inverseParentQuaternion.copy(parentWorldQuaternion).invert();
        object.quaternion.copy(inverseParentQuaternion).multiply(cameraQuaternion);
      } else {
        object.quaternion.copy(cameraQuaternion);
      }
    });
  }

  /**
   * Updates visibility for a single 3D annotation.
   * @private
   */
  _updateSingleAnnotationVisibility(annotation, model) {
    if (annotation.isStatic || !annotation.object) return;

    this.camera.getWorldPosition(this.cameraPosition);
    const object = annotation.object;
    object.getWorldPosition(this.annotationWorldPosition);

    this.rayDirection.subVectors(this.annotationWorldPosition, this.cameraPosition);
    const distanceToAnnotation = this.rayDirection.length();
    this.rayDirection.normalize();

    this.raycaster.set(this.cameraPosition, this.rayDirection);
    this.raycaster.far = distanceToAnnotation * 0.99; // Check up to just before the annotation

    const intersects = this.raycaster.intersectObject(model, true);
    const isBehindModel = intersects.length > 0;

    const isMobile = window.innerWidth <= 768;
    const effectiveVisibilityDistance = isMobile
      ? annotation.visibilityDistance * 1.5 // Consider adjusting or removing this multiplier
      : annotation.visibilityDistance;

    let isWithinDistance = distanceToAnnotation <= effectiveVisibilityDistance;
    if (annotation.minVisibilityDistance !== undefined) {
      isWithinDistance = isWithinDistance && distanceToAnnotation >= annotation.minVisibilityDistance;
    }

    const isVisible = isWithinDistance && !isBehindModel;
    annotation.setVisible(isVisible);
  }


  /**
   * Updates visibility for all 3D annotations based on occlusion and distance.
   * @private
   * @param {THREE.Object3D} model - The model to check for occlusion.
   */
  _updateAllAnnotationVisibility(model) {
    this.annotations.forEach((annotation) => {
      if (annotation.isStatic || !annotation.object) return; // Skip static or invalid annotations
      this._updateSingleAnnotationVisibility(annotation, model);
    });
  }

  /**
   * Adds a responsive annotation that automatically updates its position based on a 3D point in the scene.
   *
   * @param {Object} config - Configuration object for the annotation
   * @param {THREE.Vector3} config.modelPosition - 3D position in the model space that the annotation tracks
   * @param {string} [config.content] - HTML content of the annotation
   * @param {string} [config.className] - Additional CSS class names for the annotation
   * @param {Object} [config.style] - Custom CSS styles for the annotation
   * @param {Function} [config.onClick] - Click event handler for the annotation
   * @param {boolean} [config.visible=true] - Initial visibility state
   * @returns {Object|null} The created annotation object or null if creation failed
   *
   * @example
   * // Create a responsive annotation at a specific 3D point
   * const position = new THREE.Vector3(10, 5, 3);
   * const annotation = annotationManager.addResponsiveAnnotation({
   *   modelPosition: position,
   *   content: 'Important feature',
   *   className: 'highlight-annotation',
   *   onClick: () => console.log('Annotation clicked')
   * });
   */
  addResponsiveAnnotation(config) {
    // First, check if we have a 3D position reference
    if (!config.modelPosition || !(config.modelPosition instanceof THREE.Vector3)) {
      console.error("Model position (THREE.Vector3) is required for model-based static annotations");
      return null;
    }

    // Project the 3D position to screen space once
    const vector = config.modelPosition.clone();
    vector.project(this.camera);

    // Convert to CSS coordinates
    const x = (vector.x * 0.5 + 0.5) * 100;
    const y = (-(vector.y * 0.5) + 0.5) * 100;

    // Create a static annotation with the calculated position
    const annotation = this.addAnnotation({
      ...config,
      isStatic: true,
      position: {
        top: `${y}%`,
        left: `${x}%`
      }
    });

    if (!annotation) return null;

    // Center the annotation on the point
    annotation.element.style.transform = 'translate(-50%, -50%)';

    // Store the original model position for reference (but we won't use it for updates)
    annotation.modelPosition = config.modelPosition.clone();

    // Add to static annotations list
    if (!this.staticModelAnnotations) this.staticModelAnnotations = [];
    this.staticModelAnnotations.push(annotation);

    return annotation;

    // if (!config.modelPosition || !(config.modelPosition instanceof THREE.Vector3)) {
    //   console.error("Model position (THREE.Vector3) is required for responsive annotations");
    //   return null;
    // }
    //
    // const annotation = this.addAnnotation({
    //   ...config,
    //   isStatic: true,
    //   position: { top: '0%', left: '0%' } // Initial position, will be updated
    // });
    //
    // if (!annotation) return null;
    //
    // annotation.modelPosition = config.modelPosition.clone();
    //
    // const updatePosition = () => {
    //   if (!this.camera || !annotation.modelPosition) return;
    //
    //   const vector = annotation.modelPosition.clone();
    //   vector.project(this.camera);
    //
    //   const x = (vector.x * 0.5 + 0.5) * 100;
    //   const y = (-(vector.y * 0.5) + 0.5) * 100;
    //
    //   annotation.element.style.left = `${x}%`;
    //   annotation.element.style.top = `${y}%`;
    //
    //   annotation.element.style.transform = 'translate(-50%, -50%)';
    // };
    //
    // annotation.updatePosition = updatePosition;
    //
    // updatePosition();
    //
    //
    // if (!this.responsiveAnnotations) this.responsiveAnnotations = [];
    // this.responsiveAnnotations.push(annotation);
    //
    // return annotation;
  }

  /**
   * Disposes of all annotation resources.
   */
  dispose() {
    this.annotations.forEach((annotation) => {
      if (annotation.isStatic) {
        if (annotation.element.parentNode === this.viewerContainer) {
          this.viewerContainer.removeChild(annotation.element);
        }
      } else if (annotation.object) { // 3D annotation
        if (annotation.object.parent) {
          annotation.object.parent.remove(annotation.object);
        }
        // The CSS3DObject's element is managed by the CSS3DRenderer,
        // but good practice to ensure it's not orphaned if manually handled.
        if (annotation.element.parentNode) {
          annotation.element.parentNode.removeChild(annotation.element);
        }
      }
    });
    this.annotations = [];
    this.viewerContainer = null; // Release reference
  }
}










/**
 * manages html annotations in 3d space
 */
// export class AnnotationManager {
//   /**
//    * creates annotation manager
//    * @param {THREE.Scene} scene - scene containing annotations
//    * @param {THREE.Camera} camera - camera for visibility checks
//    * @param {Object} options - configuration options
//    * @param {boolean} [options.hideAnnotationsBehindModel=true] - hide annotations when behind model
//    * @param {number} [options.visibilityCheckInterval=100] - interval in milliseconds between visibility checks
//    */
//   constructor(scene, camera, options = {}) {
//     this.scene = scene;
//     this.camera = camera;
//     this.options = {
//       hideAnnotationsBehindModel: true,
//       visibilityCheckInterval: 100,
//       ...options,
//     };
//
//     this.annotations = [];
//
//     this.raycaster = new THREE.Raycaster();
//     this.cameraPosition = new THREE.Vector3();
//     this.annotationWorldPosition = new THREE.Vector3();
//     this.rayDirection = new THREE.Vector3();
//
//     this.lastVisibilityCheckTime = 0;
//   }
//
//   /**
//    * add HTML annotation to the scene
//    * @param {Object} config - annotation configuration
//    * @param {string} config.htmlContent - HTML content for annotation
//    * @param {THREE.Vector3} config.position - Position in model space
//    * @param {THREE.Object3D} config.parent - parent object to attach
//    * @param {number} config.scaleFactor - scale factor to apply
//    * @param {string} [config.cssClass="model-annotation"] - CSS class for styling purposes
//    * @param {boolean} [config.faceCamera=true] - whether annotation should face camera
//    * @param {number} [config.visibilityDistance=2.4] - max distance after annotation goes invisible
//    * @param {number} config.minVisibilityDistance - min distance after annotation goes invisible
//    * @param {string} config.id - target name for annotation
//    * @returns {Object} the created annotation object with control methods
//    */
//   addAnnotation(config) {
//     if (!config.parent?.isObject3D) {
//       console.error("Invalid parent object provided for annotation");
//       return null;
//     }
//
//     if (!(config.position instanceof THREE.Vector3)) {
//       console.error("Invalid position provided. Must be a THREE.Vector3");
//       return null;
//     }
//
//     const element = document.createElement("button");
//     element.innerHTML = config.htmlContent;
//     element.className = config.cssClass || "model-annotation";
//     element.style.pointerEvents = "auto";
//     element.style.cursor = "pointer";
//
//     element.style.opacity = "0";
//     element.style.transition = "opacity 0.2s ease-in-out";
//     element.dataset.target = config.id;
//
//     const cssObject = new CSS3DObject(element);
//     cssObject.position.copy(config.position);
//
//     const isMobile = window.innerWidth < 768;
//
//     const scaleFactor = isMobile ? (config.scaleFactor || 1) / 3000 : (config.scaleFactor || 1) / 4500;
//     cssObject.scale.set(scaleFactor, scaleFactor, scaleFactor);
//
//     config.parent.add(cssObject);
//
//
//     const annotation = {
//       id: `annotation-${this.annotations.length}`,
//       object: cssObject,
//       element: element,
//       faceCamera: config.faceCamera !== false,
//       visibilityDistance: config.visibilityDistance || isMobile ? 1.8 : 2.4,
//       minVisibilityDistance: config.minVisibilityDistance,
//       isVisible: true,
//       target: config.id,
//
//       setVisible: (visible) => {
//         if (annotation.isVisible === visible) return;
//         element.style.opacity = visible ? "1" : "0";
//         element.style.pointerEvents = visible ? "auto" : "none";
//         annotation.isVisible = visible;
//       },
//
//       setContent: (htmlContent) => {
//         element.innerHTML = htmlContent;
//       },
//
//       setPosition: (position) => {
//         cssObject.position.copy(position);
//       },
//
//       remove: () => {
//         if (cssObject.parent) {
//           cssObject.parent.remove(cssObject);
//         }
//
//         const index = this.annotations.findIndex((a) => a.id === annotation.id);
//         if (index !== -1) {
//           this.annotations.splice(index, 1);
//         }
//       },
//     };
//     this.annotations.push(annotation);
//     return annotation;
//   }
//
//   /**
//    * updates all annotations
//    * @param {THREE.Object3D} model - model for visibility checks
//    */
//   update(model) {
//     if (!this.camera || this.annotations.length === 0) return;
//
//     this._updateAnnotationOrientations();
//
//     const now = performance.now();
//
//     if (
//       this.options.hideAnnotationsBehindModel &&
//       model &&
//       now - this.lastVisibilityCheckTime > this.options.visibilityCheckInterval
//     ) {
//       this._updateAnnotationVisibility(model);
//       this.lastVisibilityCheckTime = now;
//     }
//   }
//
//   /**
//    * updates annotation orientations to always face the camera
//    * @private
//    */
//   _updateAnnotationOrientations() {
//     const cameraQuaternion = this.camera.quaternion;
//     const parentWorldQuaternion = new THREE.Quaternion();
//     const inverseParentQuaternion = new THREE.Quaternion();
//
//     this.annotations.forEach((annotation) => {
//       if (!annotation.faceCamera) return;
//
//       const object = annotation.object;
//
//       if (object.parent) {
//         object.parent.getWorldQuaternion(parentWorldQuaternion);
//         inverseParentQuaternion.copy(parentWorldQuaternion).invert();
//
//         object.quaternion
//           .copy(inverseParentQuaternion)
//           .multiply(cameraQuaternion);
//       } else {
//         object.quaternion.copy(cameraQuaternion);
//       }
//     });
//   }
//
//   /**
//    * updates annotation visibility
//    * @private
//    * @param {THREE.Object3D} model - model to check occlusion
//    */
//   _updateAnnotationVisibility(model) {
//     this.camera.getWorldPosition(this.cameraPosition);
//
//     this.annotations.forEach((annotation) => {
//       const object = annotation.object;
//       object.getWorldPosition(this.annotationWorldPosition);
//
//       this.rayDirection.subVectors(
//         this.annotationWorldPosition,
//         this.cameraPosition,
//       );
//       const distanceToAnnotation = this.rayDirection.length();
//       this.rayDirection.normalize();
//
//       this.raycaster.set(this.cameraPosition, this.rayDirection);
//       this.raycaster.far = distanceToAnnotation * 0.99;
//
//       const intersects = this.raycaster.intersectObject(model, true); // performance ???
//
//       const isBehindModel = intersects.length > 0;
//
//       const isMobile = window.innerWidth <= 768;
//       const effectiveVisibilityDistance = isMobile
//         ? annotation.visibilityDistance * 1.5
//         : annotation.visibilityDistance;
//       const isBeyondEffectiveDistance =
//         distanceToAnnotation > effectiveVisibilityDistance;
//
//       const isVisible = !isBeyondEffectiveDistance && !isBehindModel;
//
//       annotation.setVisible(isVisible);
//     });
//   }
//
//   /**
//    * disposes annotation resources
//    */
//   dispose() {
//     this.annotations.forEach((annotation) => {
//       if (annotation.object.parent) {
//         annotation.object.parent.remove(annotation.object);
//       }
//       if (annotation.element.parentNode) {
//         annotation.element.parentNode.removeChild(annotation.element);
//       }
//     });
//     this.annotations = [];
//   }
// }
