import * as THREE from "three";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";

/**
 * manages html annotations in 3d space
 */
export class AnnotationManager {
  /**
   * creates annotation manager
   * @param {THREE.Scene} scene - scene containing annotations
   * @param {THREE.Camera} camera - camera for visibility checks
   * @param {Object} options - configuration options
   * @param {boolean} [options.hideAnnotationsBehindModel=true] - hide annotations when behind model
   * @param {number} [options.visibilityCheckInterval=100] - interval in milliseconds between visibility checks
   */
  constructor(scene, camera, options = {}) {
    this.scene = scene;
    this.camera = camera;
    this.options = {
      hideAnnotationsBehindModel: true,
      visibilityCheckInterval: 100,
      ...options,
    };

    this.annotations = [];

    this.raycaster = new THREE.Raycaster();
    this.cameraPosition = new THREE.Vector3();
    this.annotationWorldPosition = new THREE.Vector3();
    this.rayDirection = new THREE.Vector3();

    this.lastVisibilityCheckTime = 0;
  }

  /**
   * add HTML annotation to the scene
   * @param {Object} config - annotation configuration
   * @param {string} config.htmlContent - HTML content for annotation
   * @param {THREE.Vector3} config.position - Position in model space
   * @param {THREE.Object3D} config.parent - parent object to attach
   * @param {number} config.scaleFactor - scale factor to apply
   * @param {string} [config.cssClass="model-annotation"] - CSS class for styling purposes
   * @param {boolean} [config.faceCamera=true] - whether annotation should face camera
   * @param {number} [config.visibilityDistance=2.4] - distance while annotation goes invisible
   * @param {string} config.id - target name for annotation
   * @returns {Object} the created annotation object with control methods
   */
  addAnnotation(config) {
    if (!config.parent?.isObject3D) {
      console.error("Invalid parent object provided for annotation");
      return null;
    }

    if (!(config.position instanceof THREE.Vector3)) {
      console.error("Invalid position provided. Must be a THREE.Vector3");
      return null;
    }

    const element = document.createElement("button");
    element.innerHTML = config.htmlContent;
    element.className = config.cssClass || "model-annotation";
    element.style.pointerEvents = "auto";
    element.style.cursor = "pointer";
    element.style.transform = "translateX(150%)";

    element.style.opacity = "0";
    element.style.transition = "opacity 0.2s ease-in-out";

    const cssObject = new CSS3DObject(element);
    cssObject.position.copy(config.position);

    const scaleFactor = (config.scaleFactor || 1) / 4500;
    cssObject.scale.set(scaleFactor, scaleFactor, scaleFactor);

    config.parent.add(cssObject);

    const annotation = {
      id: `annotation-${this.annotations.length}`,
      object: cssObject,
      element: element,
      faceCamera: config.faceCamera !== false,
      visibilityDistance: config.visibilityDistance || 2.4,
      isVisible: false,
      target: config.id,

      setVisible: (visible) => {
        if (annotation.isVisible === visible) return;
        element.style.opacity = visible ? "1" : "0";
        element.style.pointerEvents = visible ? "auto" : "none";
      },

      setContent: (htmlContent) => {
        element.innerHTML = htmlContent;
      },

      setPosition: (position) => {
        cssObject.position.copy(position);
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
    return annotation;
  }

  /**
   * updates all annotations
   * @param {THREE.Object3D} model - model for visibility checks
   */
  update(model) {
    if (!this.camera || this.annotations.length === 0) return;

    this._updateAnnotationOrientations();

    const now = performance.now();

    if (
      this.options.hideAnnotationsBehindModel &&
      model &&
      now - this.lastVisibilityCheckTime > this.options.visibilityCheckInterval
    ) {
      this._updateAnnotationVisibility(model);
      this.lastVisibilityCheckTime = now;
    }
  }

  /**
   * updates annotation orientations to always face the camera
   * @private
   */
  _updateAnnotationOrientations() {
    const cameraQuaternion = this.camera.quaternion;
    const parentWorldQuaternion = new THREE.Quaternion();
    const inverseParentQuaternion = new THREE.Quaternion();

    this.annotations.forEach((annotation) => {
      if (!annotation.faceCamera) return;

      const object = annotation.object;

      if (object.parent) {
        object.parent.getWorldQuaternion(parentWorldQuaternion);
        inverseParentQuaternion.copy(parentWorldQuaternion).invert();

        object.quaternion
          .copy(inverseParentQuaternion)
          .multiply(cameraQuaternion);
      } else {
        object.quaternion.copy(cameraQuaternion);
      }
    });
  }

  /**
   * updates annotation visibility
   * @private
   * @param {THREE.Object3D} model - model to check occlusion
   */
  _updateAnnotationVisibility(model) {
    this.camera.getWorldPosition(this.cameraPosition);

    const shapeAnnotation = this.annotations[this.annotations.findIndex(a => a.target === 'shape')]
    const logoAnnotation = this.annotations[this.annotations.findIndex(a => a.target === 'logo')]
    const colorAnnotation = this.annotations[this.annotations.findIndex(a => a.target === 'color')]

    this.annotations.forEach((annotation) => {
      const object = annotation.object;
      object.getWorldPosition(this.annotationWorldPosition);

      this.rayDirection.subVectors(
        this.annotationWorldPosition,
        this.cameraPosition,
      );
      const distanceToAnnotation = this.rayDirection.length();
      this.rayDirection.normalize();

      this.raycaster.set(this.cameraPosition, this.rayDirection);
      this.raycaster.far = distanceToAnnotation * 0.99;

      const intersects = this.raycaster.intersectObject(model, true); // performance ???

      const isBehindModel = intersects.length > 0;
      const isTooFar = distanceToAnnotation > annotation.visibilityDistance;

      let condition;
      if(annotation.target === 'logo') {
        condition = distanceToAnnotation < 2.023 && distanceToAnnotation > 2.75
        // console.log('isBehind logo', isBehindModel)
      }
      if(annotation.target === 'shape') {
        console.log('isBehind shape', distanceToAnnotation)
        condition = distanceToAnnotation > 2 && distanceToAnnotation < 2.5 && isBehindModel
        console.log(condition)
      }
      if(annotation.target === 'color') {
        // console.log('isBehind color', isBehindModel)
      }

      const isMobile = window.innerWidth <= 768;
      const effectiveVisibilityDistance = isMobile ? (annotation.visibilityDistance * 1.5) : annotation.visibilityDistance;
      const isBeyondEffectiveDistance = distanceToAnnotation > effectiveVisibilityDistance;

      const isVisible = !isBehindModel && !isBeyondEffectiveDistance;

      // old version
      // const mobileVisibilityDistance = isMobile
      //   ? 3.7
      //   : annotation.visibilityDistance;
      //
      // const isVisible = !(
      //   isBehindModel &&
      //   (isTooFar ||
      //     (isMobile && distanceToAnnotation > mobileVisibilityDistance))
      // );
      annotation.setVisible(isVisible);
    });
  }

  /**
   * disposes annotation resources
   */
  dispose() {
    this.annotations.forEach((annotation) => {
      if (annotation.object.parent) {
        annotation.object.parent.remove(annotation.object);
      }
      if (annotation.element.parentNode) {
        annotation.element.parentNode.removeChild(annotation.element);
      }
    });
    this.annotations = [];
  }
}
