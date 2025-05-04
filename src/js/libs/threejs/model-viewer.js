import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer.js";

// Utility functions
import { setupScene, setupLights, setupCamera } from "./utils/scene-setup.js";
import { setupRenderers } from "./utils/renderers.js";
import { handleResize } from "./utils/resize-handler.js";
import { createAnnotation } from "./utils/annotations.js";

/**
 * A 3D model viewer that combines WebGL and CSS3D rendering for interactive 3D models with HTML annotations.
 */
export class ModelViewerCSS3D {
  /**
   * Creates a new 3D model viewer instance.
   * @param {HTMLElement} containerElement - DOM element to host the viewer
   * @param {string} modelPath - Path to the 3D model file (GLB/GLTF)
   * @param {boolean} shouldDisappear - Should disappear the annotations while its goes behind the model
   */
  constructor(containerElement, modelPath, shouldDisappear = true) {
    if (!containerElement) {
      throw new Error("Container element is required.");
    }

    console.log('test branch')

    this.container = containerElement;
    this.modelPath = modelPath;
    this.ensureContainerPositioning();

    // loadPromise
    this.loadPromise = null;

    // Core properties
    this.scene = null;
    this.camera = null;
    this.webglRenderer = null;
    this.cssRenderer = null;
    this.controls = null;
    this.model = null;

    // State tracking
    this.animationFrameId = null;
    this.resizeObserver = null;
    this.modelScaleFactor = 1;
    this.annotations = [];
    this.initialViewState = null;
    this.initialRotation = [0.8901, -0.8203, 0.0524];
    this.boundOnDoubleClick = null;
    this.shouldDisappear = shouldDisappear;
    this.boundOnMouseEnter = null;
    this.boundOnMouseLeave = null;
    this.wasAutoRotating = false;

    // properties for annotations visibility
    this.raycaster = new THREE.Raycaster();
    this.cameraPosition = new THREE.Vector3();
    this.annotationWorldPosition = new THREE.Vector3();
    this.rayDirection = new THREE.Vector3();

    this.init();
  }

  /**
   * Ensures container has proper positioning for absolute children
   */
  ensureContainerPositioning() {
    const style = window.getComputedStyle(this.container);
    if (style.position === "static") {
      this.container.style.position = "relative";
    }
  }

  /**
   * Initializes the 3D viewer components
   */
  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = setupScene();
    this.camera = setupCamera(width, height);

    const { webglRenderer, cssRenderer } = setupRenderers(
      width,
      height,
      this.container,
    );
    this.webglRenderer = webglRenderer;
    this.cssRenderer = cssRenderer;

    this.cssRenderer.domElement.classList.add("touchscreen-scroll-events");

    setupLights(this.scene);

    this.setupControls();
    this.setupHoverPause();

    this.loadPromise = this.loadModel();
    this.loadPromise.catch(this.handleModelLoadError.bind(this));
    this.setupResizeHandler();
    this.animate();
  }

  /*
   * set up listeners to pause of rotation on hover
   */

  setupHoverPause() {
    if (!this.container || !this.controls) {
      console.warn("Container or controls not ready for hover setup.");
      return;
    }

    this.wasAutoRotating = this.controls.autoRotate;

    this.boundOnMouseEnter = () => {
      if (this.controls) {
        this.wasAutoRotating = this.controls.autoRotate;
        this.controls.autoRotate = false;
      }
    };

    this.boundOnMouseLeave = () => {
      if (this.controls) {
        this.controls.autoRotate = this.wasAutoRotating;
      }
    };

    this.container.addEventListener("mouseenter", this.boundOnMouseEnter);
    this.container.addEventListener("mouseleave", this.boundOnMouseLeave);

    console.log("Hover pause for auto-rotate enabled.");
  }

  /**
   * Sets up orbit controls for camera navigation
   */
  setupControls() {
    if (this.cssRenderer && this.cssRenderer.domElement) {
      // fix issue with scroll at touch-screen devices
      this.cssRenderer.domElement.classList.add("touchscreen-scroll-events");
    } else {
      console.error(
        "CSS Renderer DOM element not available for setting touch-action.",
      );
    }

    this.controls = new OrbitControls(this.camera, this.cssRenderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0, 0);
    this.controls.minPolarAngle = Math.PI / 2; // preventing vertical rotation
    this.controls.maxPolarAngle = Math.PI / 2; // preventing vertical rotation
    this.controls.enablePan = false; // preventing interact with model on scroll
    this.controls.enableZoom = false;

    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 3.0;

    this.controls.update();
  }

  /**
   * Handles model loading errors
   * @param {Error} error - The error that occurred
   */
  handleModelLoadError(error) {
    console.error("Failed to load model:", error);
    this.container.innerHTML = `<div style="color: red; padding: 20px; position: relative; z-index: 2;">Error loading model.</div>`;
  }

  /**
   * Loads the 3D model and sets up its position, scale, and rotation
   * @returns {Promise<THREE.Object3D>} Promise resolving to the loaded model
   */
  loadModel() {
    const loader = new GLTFLoader();
    const loadingElement = this.showLoader();

    // progress bar
    const progressBar = loadingElement.querySelector("#loader-progress-bar");
    const progressText = loadingElement.querySelector("#loader-progress-text");

    return new Promise((resolve, reject) => {
      loader.load(
        this.modelPath,
        (gltf) => {
          this.model = gltf.scene;
          this.applyInitialRotation();
          this.centerAndScaleModel();
          this.scene.add(this.model);
          this.setupCameraPosition();

          if(progressBar) progressBar.style.width = '100%'
          if(progressText) progressText.textContent = "100%"


          if (loadingElement) loadingElement.remove();
          console.log("Model loaded.");
          resolve(this.model);
        },
        (progress) => {
          const progressPercent = Math.round((progress.loaded / progress.total) * 100)

          if(progressBar) progressBar.style.width = `${progressPercent}%`
          if(progressText) progressText.textContent = `${progressPercent}%`
        },
        (error) => {
          if (loadingElement) loadingElement.remove();
          console.error("Error loading GLTF model:", error);
          reject(error);
        },
      );
    });
  }

  /**
   * Applies initial rotation to the model
   */
  applyInitialRotation() {
    if (this.initialRotation && this.model) {
      const [x, y, z] = this.initialRotation;

      const euler = new THREE.Euler(x, y, z, "XYZ");

      this.model.quaternion.setFromEuler(euler);

      this.model.updateMatrixWorld(true);
    }
  }

  /**
   * Centers and scales the model to fit the view
   */
  centerAndScaleModel() {
    const box = new THREE.Box3().setFromObject(this.model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);

    const scale = maxSize > 0 ? 2 / maxSize : 1;
    this.modelScaleFactor = scale;

    this.model.scale.set(scale, scale, scale);

    // Recalculate box and center after scaling
    box.setFromObject(this.model);
    box.getCenter(center);

    // Center model at origin
    this.model.position.sub(center);
  }

  /**
   * Sets up camera position based on model size
   */

  setupCameraPosition() {
    if (!this.model || !this.camera || !this.controls) {
      console.error(
        "Cannot setup camera position: Model, camera, or controls not ready.",
      );
      return;
    }

    const box = new THREE.Box3().setFromObject(this.model);
    const boundingSphere = box.getBoundingSphere(new THREE.Sphere());
    const modelRadius = boundingSphere.radius;

    const fovInRadians = THREE.MathUtils.degToRad(this.camera.fov);
    const baseCameraDistance = modelRadius / Math.tan(fovInRadians / 2);

    const mobileBreakpoint = 768;
    const isMobile = window.innerWidth < mobileBreakpoint;

    // A LARGER padding factor pushes the camera FURTHER AWAY.
    const desktopPaddingFactor = 0.8; // Original factor (or adjust)
    const mobilePaddingFactor = 1.3; // Increase this to push camera back more on mobile

    const paddingFactor = isMobile ? mobilePaddingFactor : desktopPaddingFactor;

    const effectiveDistance = baseCameraDistance * paddingFactor;

    const cameraY = modelRadius * 0.5; // Adjusts camera height

    this.camera.position.set(0, cameraY, effectiveDistance);
    this.controls.target.set(0, 0, 0);

    this.camera.lookAt(this.controls.target);

    this.controls.update();

    if (this.initialViewState) {
      this.setViewState(this.initialViewState);
      this.initialViewState = null;
    }
  }

  /**
   * Adds an HTML element as an annotation attached to a 3D position
   * @param {string} htmlContent - HTML content for the annotation
   * @param {THREE.Object3D} parentObject - 3D object to attach to
   * @param {THREE.Vector3} localPosition - Position relative to parent
   * @param {string} cssClass - CSS class for styling
   * @returns {CSS3DObject} The created annotation object
   */
  addHtmlAnnotation(
    htmlContent,
    parentObject,
    localPosition,
    cssClass = "model-annotation-3d",
  ) {
    if (!parentObject?.isObject3D) {
      console.error("Invalid parentObject provided for annotation.");
      return null;
    }

    if (!(localPosition instanceof THREE.Vector3)) {
      console.error("Invalid localPosition provided. Must be a THREE.Vector3.");
      return null;
    }

    const cssObject = createAnnotation(
      htmlContent,
      localPosition,
      cssClass,
      this.modelScaleFactor,
    );

    parentObject.add(cssObject);
    this.annotations.push(cssObject);

    return cssObject;
  }

  /**
   * Shows a loading indicator while the model loads
   * @returns {HTMLElement} The loader element
   */
  showLoader() {
    let loader = this.container.querySelector(".css3d-loader");
    if (!loader) {
      loader = document.createElement("div");
      loader.className = "css3d-loader";
      loader.style.position = "absolute";
      loader.style.left = "0";
      loader.style.width = "100%";
      loader.style.height = "100%";
      loader.style.display = "flex";
      loader.style.alignItems = "center";
      loader.style.justifyContent = "center";
      loader.style.zIndex = "10";

      loader.innerHTML = `
      <div class="absolute bottom-[177px] flex flex-col items-center justify-center gap-[17px]">
        <div class="text-white text-2xl progress-text font-sans" id="loader-progress-text">0%</div>
        <div class="w-[200px] h-[6px] bg-[#292929] rounded-full overflow-hidden mt-auto">
          <div class="h-full bg-green-main rounded-full transition-all duration-10 progress-bar"
               id="loader-progress-bar" style="width: 0"></div>
        </div>
      </div>
    `;

      this.container.appendChild(loader);
    }
    return loader;
  }

  /**
   * Sets up resize handling to maintain proper aspect ratio
   */
  setupResizeHandler() {
    this.resizeObserver = handleResize(
      this.container,
      this.camera,
      this.webglRenderer,
      this.cssRenderer,
    );
  }

  /**
   * Animation loop for continuous rendering
   */
  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    this.controls.update();

    this.updateAnnotationOrientations();
    if (this.shouldDisappear) {
      // for annotations disappearing while moving behind the model
      this.updateAnnotationVisibility();
    }
    this.render();
  }

  /*
   * update annotation visibility
   */

  updateAnnotationVisibility() {
    if (!this.camera || !this.model || this.annotations.length === 0) {
      return;
    }

    this.camera.getWorldPosition(this.cameraPosition);

    this.annotations.forEach((annotation) => {
      annotation.getWorldPosition(this.annotationWorldPosition);

      // TODO: Add data-current to more pretty handling
      const isBtn1 = annotation.element.textContent
        .toLowerCase()
        .includes("custom logo".toLowerCase());
      const isBtn2 = annotation.element.textContent
        .toLowerCase()
        .includes("color of your choice".toLowerCase());
      const isBtn3 = annotation.element.textContent
        .toLowerCase()
        .includes("unique shape".toLowerCase());

      const visibleDistance = 2.4; // distance while annotation disappears
      const btn3MobileVisibleDistance = 3.7;
      const isMobile = window.innerWidth <= 768;

      this.rayDirection.subVectors(
        this.annotationWorldPosition,
        this.cameraPosition,
      );
      const distanceToAnnotation = this.rayDirection.length();
      this.rayDirection.normalize();

      this.raycaster.set(this.cameraPosition, this.rayDirection);
      this.raycaster.far = distanceToAnnotation;

      const intersects = this.raycaster.intersectObject(this.model, true);

      const condition = isBtn1
        ? intersects.length > 0
        : isMobile && isBtn3
          ? intersects.length > 0 &&
            distanceToAnnotation > btn3MobileVisibleDistance
          : intersects.length > 0 && distanceToAnnotation > visibleDistance;

      if (condition) {
        annotation.element.style.opacity = "0";
        annotation.element.style.pointerEvents = "none";
      } else {
        annotation.element.style.opacity = "1";
        annotation.element.style.pointerEvents = "auto";
      }
    });
  }

  /**
   * Updates annotation orientations to face the camera
   */
  updateAnnotationOrientations() {
    if (this.camera && this.annotations.length > 0) {
      const cameraQuaternion = this.camera.quaternion;
      const parentWorldQuaternion = new THREE.Quaternion();
      const inverseParentQuaternion = new THREE.Quaternion();

      this.annotations.forEach((annotation) => {
        if (annotation.parent) {
          annotation.parent.getWorldQuaternion(parentWorldQuaternion);
          inverseParentQuaternion.copy(parentWorldQuaternion).invert();
          annotation.quaternion
            .copy(inverseParentQuaternion)
            .multiply(cameraQuaternion);
        }
      });
    }
  }

  /**
   * Renders the scene with both renderers
   */
  render() {
    this.webglRenderer.render(this.scene, this.camera);
    this.cssRenderer.render(this.scene, this.camera);
  }

  /**
   * Gets the current camera position and controls target
   * @returns {object|null} View state object or null if not ready
   */
  getViewState() {
    if (!this.camera || !this.controls) {
      console.warn("Camera or controls not ready. Cannot get view state.");
      return null;
    }

    return {
      cameraPosition: [
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z,
      ],
      controlsTarget: [
        this.controls.target.x,
        this.controls.target.y,
        this.controls.target.z,
      ],
    };
  }

  /**
   * Sets the camera position and controls target
   * @param {object} viewState - View state object with position and target
   */
  setViewState(viewState) {
    if (!viewState?.cameraPosition || !viewState?.controlsTarget) {
      console.error("Invalid viewState object provided.");
      return;
    }

    if (!this.camera || !this.controls) {
      this.initialViewState = viewState;
      console.log("Camera/controls not ready. Stored initial view state.");
      return;
    }

    const [cpX, cpY, cpZ] = viewState.cameraPosition;
    const [ctX, ctY, ctZ] = viewState.controlsTarget;

    this.camera.position.set(cpX, cpY, cpZ);
    this.controls.target.set(ctX, ctY, ctZ);
    this.controls.update();
  }

  /**
   * Gets the current rotation of the loaded model
   * @returns {Array<number>|null} Rotation as [x,y,z] or null if no model
   */
  getCurrentRotation() {
    if (!this.model) {
      console.warn("Model not loaded yet. Cannot get rotation.");
      return null;
    }

    return [
      this.model.rotation.x,
      this.model.rotation.y,
      this.model.rotation.z,
    ];
  }

  /**
   * Sets a default rotation to be applied to the model
   * @param {Array<number>} rotationArray - Rotation as [x,y,z] in radians
   */
  setDefaultRotation(rotationArray) {
    if (!Array.isArray(rotationArray) || rotationArray.length !== 3) {
      console.error(
        "Invalid rotation provided. Must be an array [x, y, z] in radians.",
      );
      return;
    }

    this.initialRotation = rotationArray;
    const [x, y, z] = rotationArray;

    if (this.model) {
      this.model.rotation.set(x, y, z);
      console.log(
        `Applied rotation immediately: [${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}] rad`,
      );
    } else {
      console.log(
        `Stored initial rotation: [${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}] rad`,
      );
    }
  }

  // --- FOR DEBUGGING MODE ---
  /**
   * Enables or disables point finding mode (double-click to find coordinates)
   * @param {boolean} enable - Whether to enable point finding
   */
  enablePointFinding(enable = true) {
    if (enable) {
      if (!this.boundOnDoubleClick) {
        this.boundOnDoubleClick = this.handlePointFindingClick.bind(this);
        this.cssRenderer.domElement.addEventListener(
          "dblclick",
          this.boundOnDoubleClick,
        );
        console.log("Point finding enabled. Double-click on the model.");
        this.cssRenderer.domElement.style.cursor = "crosshair";
      }
    } else {
      if (this.boundOnDoubleClick) {
        this.cssRenderer.domElement.removeEventListener(
          "dblclick",
          this.boundOnDoubleClick,
        );
        this.boundOnDoubleClick = null;
        console.log("Point finding disabled.");
        this.cssRenderer.domElement.style.cursor = "default";
      }
    }
  }

  /**
   * Handles double-click events for point finding
   * @param {MouseEvent} event - The click event
   */
  handlePointFindingClick(event) {
    if (!this.model || !this.camera) return;

    const rect = this.cssRenderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();

    // Calculate mouse position in normalized device coordinates
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObject(this.model, true);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const worldPoint = intersection.point;

      // Convert world point to model's local coordinates
      const inverseModelMatrix = new THREE.Matrix4();
      inverseModelMatrix.copy(this.model.matrixWorld).invert();
      const localPoint = worldPoint.clone().applyMatrix4(inverseModelMatrix);

      const x = localPoint.x.toFixed(4);
      const y = localPoint.y.toFixed(4);
      const z = localPoint.z.toFixed(4);

      console.log(`Point Found (Local Coords): [${x}, ${y}, ${z}]`);
      this.addTemporaryMarker(worldPoint);
    } else {
      console.log("No intersection found with the model.");
    }
  }

  /**
   * Adds a temporary visual marker at the clicked point
   * @param {THREE.Vector3} worldPosition - Position in world coordinates
   */
  addTemporaryMarker(worldPosition) {
    const geometry = new THREE.SphereGeometry(0.02, 16, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      depthTest: false,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(worldPosition);
    marker.renderOrder = 999;

    this.scene.add(marker);

    setTimeout(() => {
      this.scene.remove(marker);
      geometry.dispose();
      material.dispose();
    }, 2000);
  }

  // --- END FOR DEBUGGING MODE ---

  /**
   * Cleans up resources when the viewer is no longer needed
   */
  dispose() {
    console.log("Disposing CSS3D model viewer...");

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.resizeObserver && this.container) {
      this.resizeObserver.unobserve(this.container);
    }

    if (this.controls) {
      this.controls.dispose();
    }

    this.disposeSceneObjects();
    this.disposeRenderers();

    // Clear references
    this.scene = null;
    this.camera = null;
    this.webglRenderer = null;
    this.cssRenderer = null;
    this.controls = null;
    this.model = null;
    this.container = null;
    this.resizeObserver = null;
    this.annotations = [];
  }

  /**
   * Disposes all scene objects and materials
   */
  disposeSceneObjects() {
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }

        if (object instanceof CSS3DObject) {
          if (object.element && object.element.parentNode) {
            object.element.parentNode.removeChild(object.element);
          }
        }
      });

      if (this.model) {
        this.scene.remove(this.model);
      }
    }
  }

  /**
   * Disposes renderers and removes their DOM elements
   */
  disposeRenderers() {
    if (this.webglRenderer) {
      this.webglRenderer.dispose();
      if (this.webglRenderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.webglRenderer.domElement);
      }
    }

    if (
      this.cssRenderer &&
      this.cssRenderer.domElement.parentNode === this.container
    ) {
      this.container.removeChild(this.cssRenderer.domElement);
    }
  }
}
