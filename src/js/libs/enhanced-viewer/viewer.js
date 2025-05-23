import * as THREE from "three";

import { SceneManager } from "./core/SceneManager.js";
import { RendererManager } from "./core/RendererManager.js";
import { ModelManager } from "./core/ModelManager.js";
import { AnnotationManager } from "./core/AnnotationManager.js";

import { AutoRotation } from "./features/AutoRotation.js";
import { CameraController } from "./features/CameraController.js";
import { PerformanceMonitor } from "./features/PerformanceMonitor.js";
import { DebugTools } from "./features/DebugTools.js";

import { viewerIcon } from "./icons/viewer.js";

export class ModelViewer {
  /**
   * @param {Object} config - Configuration object
   * @param {HTMLElement} config.container - DOM element to host the viewer
   * @param {string} config.modelPath - Path to the 3D model file (GLB/GLTF)
   * @param {Object} [config.options] - optional configuration settings
   * @param {boolean} [config.options.hideAnnotationsBehindModel=true] - hide annotation when it goes behind model
   * @param {boolean} [config.options.enableAutoRotate=true] - Enable autorotation of model
   * @param {number} [config.options.autoRotateSpeed=3.0] - Auto-rotation speed
   * @param {boolean} [config.options.pauseRotationOnHover=true] - Pause rotation on hover
   * @param {boolean} [config.options.enableZoom=false] - Enable camera zoom
   * @param {number} [config.options.defaultZoom=1.0] - Default camera zoom level
   * @param {Array<number>} [config.options.initialRotation] - Initial rotation [x,y,z] in radians
   * @param {boolean} [config.options.highPerformanceMode=false] - prioritize performance over quality
   * @param {boolean} [config.options.showFPS=flase] - show FPS
   * @param {boolean} [config.options.enableLOD=true] - enable level of detail(LOD) optimization
   * @param {boolean} [config.options.debugMode=false] - enable or disable debug mode
   * @param {Array<string>} [config.options.colorExclusionNames=[]] - Mesh names to exclude from color changes.
   * @param {Array<string>} [config.options.modelColors] - Optional array of colors to cycle through.
   * @param {Array<number>|THREE.Vector3} [config.options.initialCameraPosition] - Optional initial camera position [x,y,z] or THREE.Vector3
   * @param {Array<number>|THREE.Vector3} [config.options.initialCameraTarget] - Optional initial camera target [x,y,z] or THREE.Vector3
   */
  constructor(config) {
    if (!config?.container) {
      throw new Error("Container element for 3d viewer is required");
    }

    this.container = config.container;
    this.modelPath = config.modelPath;

    // default colors if not provided in options
    const defaultModelColors = [
      "#0049E9",
      "#00C5CA",
      "#D69800",
      "#C60000",
      "#FC007C",
      "#2FB900",
      "#EB6D00",
    ];

    this.options = {
      hideAnnotationsBehindModel: true,
      enableAutoRotate: true,
      autoRotateSpeed: 3.0,
      pauseRotationOnHover: true,
      enableZoom: false,
      defaultZoom: 1.0,
      initialRotation: [0, 0, 0],
      initialCameraPosition: null,
      initialCameraTarget: null,
      enableInactivityReset: true,
      inactivityResetDelay: 3000,
      cameraResetAnimationDuration: 2000,
      highPerformanceMode: false,
      showFPS: false,
      enableLOD: true,
      debugMode: true,
      colorExclusionNames: ["Layer002", "Layer0"],
      modelColors: defaultModelColors,
      ...config.options,
    };

    this.modelColors = Array.isArray(this.options.modelColors)
      ? this.options.modelColors
      : defaultModelColors;
    this._colorExclusionNames = Array.isArray(this.options.colorExclusionNames)
      ? this.options.colorExclusionNames
      : [];

    this._ensureContainerPositioning();

    // core managers
    this.sceneManager = null;
    this.rendererManager = null;
    this.modelManager = null;
    this.annotationManager = null;

    // feature controllers
    this.autoRotation = null;
    this.cameraController = null;
    this.performanceMonitor = null;

    // state tracking
    this.isInitialized = false;
    this.isDisposed = false;
    this.loadPromise = null;
    this.animationFrameId = null;
    this._currentColorIndex = -1;

    // For inactivity reset
    this.savedInitialCameraPosition = new THREE.Vector3();
    this.savedInitialCameraTarget = new THREE.Vector3();
    this.savedInitialCameraZoom = 1.0;
    this.inactivityTimer = null;
    this.boundHandleInteractionStart = this._handleInteractionStart.bind(this);
    this.boundHandleInteractionEnd = this._handleInteractionEnd.bind(this);
    this.boundResetCameraToInitial = this._resetCameraToInitial.bind(this);
    this.isUserInteracting = false;
    this.showAnnotationsTimer = null;

    // for camera reset animation
    this.isCameraResetAnimationActive = false;
    this.cameraResetAnimation = {
      startTime: 0,
      startPos: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      startTarget: new THREE.Vector3(),
      endTarget: new THREE.Vector3(),
      startZoom: 1.0,
      endZoom: 1.0,
      wasAutoRotating: false,
      originalDampingEnabled: false,
      originalDampingFactor: 0.05,
    };
    this.boundUpdateCameraResetAnimation =
      this._updateCameraResetAnimation.bind(this);

    this._initialize();
  }

  /**
   * @private
   */
  _ensureContainerPositioning() {
    const style = window.getComputedStyle(this.container);
    if (style.position === "static") {
      this.container.style.position = "relative";
    }
  }

  /**
   * Initializes core managers
   * @private
   */
  _initialize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.sceneManager = new SceneManager({ fov: 60 });
    this.sceneManager.setupResizeListener(this.container);

    this.rendererManager = new RendererManager(width, height, this.container, {
      highPerformanceMode: this.options.highPerformanceMode,
    });

    this.modelManager = new ModelManager(this.sceneManager.scene, {
      initialRotation: this.options.initialRotation,
      enableLOD: this.options.enableLOD,
    });

    this.annotationManager = new AnnotationManager(
      this.sceneManager.scene,
      this.sceneManager.camera,
      this.container,
      {
        hideAnnotationsBehindModel: this.options.hideAnnotationsBehindModel,
      },
    );

    this.cameraController = new CameraController(
      this.sceneManager.camera,
      this.rendererManager.cssRenderer.domElement,
      {
        enableZoom: this.options.enableZoom,
        defaultZoom: this.options.defaultZoom,
      },
    );

    this.container.addEventListener("resize-viewer", (event) => {
      const { width, height } = event.detail;

      if (this.sceneManager) {
        this.sceneManager.updateCameraAspect(width, height);
      }

      if (
        this.modelManager &&
        this.modelManager.model &&
        this.cameraController
      ) {
        this.cameraController.setupOptimalCameraPosition(
          this.modelManager.model,
        );
      }
    });

    // LISTENERS FOR INACTIVITY RESET IF ENABLED
    if (
      this.options.enableInactivityReset &&
      this.cameraController &&
      this.cameraController.controls
    ) {
      this.cameraController.controls.addEventListener(
        "start",
        this.boundHandleInteractionStart,
      );
      this.cameraController.controls.addEventListener(
        "end",
        this.boundHandleInteractionEnd,
      );
    }

    // FUNCTIONALITY FOR HANDLE CLICKS INSIDE CSS3DRENDERER DOM ELEMENT

    // if (this.rendererManager && this.rendererManager.cssRenderer) {
    //   this.rendererManager.cssRenderer.domElement.addEventListener(
    //     "pointerdown",
    //     (event) => {
    //       const targetElement = event.target;
    //       const isClickable = targetElement.closest(".clickable-annotation");
    //
    //       if (isClickable) {
    //         event.stopPropagation();
    //       }
    //     },
    //     true,
    //   );
    //
    //   this.rendererManager.cssRenderer.domElement.addEventListener(
    //     "click",
    //     (event) => {
    //       const clickableElement = event.target.closest(
    //         ".clickable-annotation.js-model-color-change",
    //       );
    //
    //       if (clickableElement) {
    //         this.cycleModelColor();
    //       }
    //     },
    //   );
    // }

    this.autoRotation = new AutoRotation(
      this.cameraController.controls,
      this.container,
      {
        enabled: this.options.enableAutoRotate,
        speed: this.options.autoRotateSpeed,
        pauseOnHover: this.options.pauseRotationOnHover,
      },
    );

    if (this.options.showFPS || this.options.highPerformanceMode) {
      this.performanceMonitor = new PerformanceMonitor(this.container);
    }

    // load model
    this._loadModel();

    this._startAnimationLoop();

    this.isInitialized = true;
  }

  /**
   * load 3d model
   * @private
   */
  _loadModel() {
    const loadingElement = this._showLoader();

    this.loadPromise = this.modelManager.loadModel(this.modelPath, {
      onProgress: (progressPercent) => {
        const progressBar = loadingElement.querySelector(
          "#loader-progress-bar",
        );
        const progressText = loadingElement.querySelector(
          "#loader-progress-text",
        );

        if (progressBar) progressBar.style.width = `${progressPercent}%`;
        if (progressText) progressText.textContent = `${progressPercent}%`;
      },
      onLoad: () => {
        if (loadingElement) loadingElement.remove();

        const model = this.modelManager.model;

        this.cameraController.setupOptimalCameraPosition(model);

        let viewChangedByOptions = false;
        if (this.options.initialCameraPosition) {
          const pos = this.options.initialCameraPosition;
          if (Array.isArray(pos) && pos.length === 3) {
            this.sceneManager.camera.position.set(pos[0], pos[1], pos[2]);
          } else if (pos instanceof THREE.Vector3) {
            this.sceneManager.camera.position.copy(pos);
          }
          viewChangedByOptions = true;
        }

        // add rotation indicator
        this._addRotationIndicator();

        if (this.options.initialCameraTarget) {
          const target = this.options.initialCameraTarget;
          if (Array.isArray(target) && target.length === 3) {
            this.cameraController.controls.target.set(
              target[0],
              target[1],
              target[2],
            );
          } else if (target instanceof THREE.Vector3) {
            this.cameraController.controls.target.copy(target);
          }
          viewChangedByOptions = true;
        }

        // if (this.options.initialCameraPosition) {
        //   const pos = this.options.initialCameraPosition;
        //   if (Array.isArray(pos) && pos.length === 3) {
        //     this.sceneManager.camera.position.set(pos[0], pos[1], pos[2]);
        //   } else if (pos instanceof THREE.Vector3) {
        //     this.sceneManager.camera.position.copy(pos);
        //   }
        //   customPositionApplied = true;
        // }
        //
        // if (this.options.initialCameraTarget) {
        //   const target = this.options.initialCameraTarget;
        //   if (Array.isArray(target) && target.length === 3) {
        //     this.cameraController.controls.target.set(
        //       target[0],
        //       target[1],
        //       target[2],
        //     );
        //   } else if (target instanceof THREE.Vector3) {
        //     this.cameraController.controls.target.copy(target);
        //   }
        //   customTargetApplied = true;
        // }

        if (viewChangedByOptions) {
          this.sceneManager.camera.lookAt(
            this.cameraController.controls.target,
          );
          if (this.cameraController.controls) {
            this.cameraController.controls.update();
          }
        }

        if (this.cameraController) {
          this.cameraController.setPolarAngleLimits(Math.PI / 6, Math.PI / 2);
        }

        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          const mobileZoom = 0.7;
          this.cameraController.setZoom(mobileZoom);
        }

        if (
          // (customPositionApplied || customTargetApplied) &&
          this.cameraController.controls
        ) {
          this.cameraController.controls.update();
        }

        this.savedInitialCameraPosition.copy(this.sceneManager.camera.position);
        this.savedInitialCameraTarget.copy(
          this.cameraController.controls.target,
        );
        this.savedInitialCameraZoom = this.sceneManager.camera.zoom;

        if (this.options.enableInactivityReset) {
          this._resetInactivityTimer();
        }

        if (this.options.debugMode) {
          this._initializeDebugTools();
          this.debug.enablePointFinding();
        }
      },
      onError: (error) => {
        if (loadingElement) loadingElement.remove();
        console.error("Error loading model:", error);
        this._showErrorMessage("Failed to load 3D model");
      },
    });
  }

  /**
   * shows loading bar
   * @private
   * @returns {HTMLElement} loader element
   */
  _showLoader() {
    let loader = this.container.querySelector(".model-viewer-loader");
    if (!loader) {
      loader = document.createElement("div");
      loader.className = "model-viewer-loader";
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
   * show error
   * @private
   * @param {string} message - error message
   */
  _showErrorMessage(message) {
    const errorElement = document.createElement("div");
    errorElement.style.position = "absolute";
    errorElement.style.top = "0";
    errorElement.style.left = "0";
    errorElement.style.width = "100%";
    errorElement.style.padding = "20px";
    errorElement.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
    errorElement.style.color = "white";
    errorElement.style.zIndex = "100";
    errorElement.style.textAlign = "center";
    errorElement.textContent = message;

    this.container.appendChild(errorElement);
  }

  /**
   * animation loop
   * @private
   */
  _startAnimationLoop() {
    if (this.isDisposed) return;

    const animate = () => {
      if (this.isDisposed) return;

      this.animationFrameId = requestAnimationFrame(animate);

      if (this.performanceMonitor) {
        this.performanceMonitor.beginFrame();
      }

      if (this.isCameraResetAnimationActive) {
        this._updateCameraResetAnimation();
      } else {
        this.cameraController.update();
      }

      // this.cameraController.update();

      this.annotationManager.update(this.modelManager.model);

      this.rendererManager.render(
        this.sceneManager.scene,
        this.sceneManager.camera,
      );

      if (this.performanceMonitor) {
        this.performanceMonitor.endFrame();
      }
    };

    animate();
  }

  /**
   * changes the model's color to the next one in the modelColors array
   */
  cycleModelColor() {
    if (!this.modelManager || !this.modelManager.model) return;

    if (!this.modelColors || this.modelColors.length === 0) return;

    this._currentColorIndex++;
    if (this._currentColorIndex >= this.modelColors.length) {
      this._currentColorIndex = 0;
    }

    const nextColor = this.modelColors[this._currentColorIndex];

    this.modelManager.setModelColor(nextColor, this._colorExclusionNames);
  }

  /**
   * add HTML annotation to the scene
   * @param {Object} config - annotation configuration
   * @param {string} config.htmlContent - HTML content for annotation
   * @param {THREE.Vector3 | Object} config.position - Position in model space, for 3D: THREE.Vector3 in model space. For 2D: object with css position(top, left, right, bottom)
   * @param {boolean} [config.isStatic=false] - if true, annotation is a static 2D
   * @param {THREE.Object3D} config.parent - parent object to attach
   * @param {number} config.scaleFactor - scale factor to apply
   * @param {string} [config.cssClass="model-annotation" | "static-model-annotation"] - CSS class for styling purposes
   * @param {boolean} [config.faceCamera=true] - whether annotation should face camera
   * @param {number} [config.visibilityDistance=2.4] - max distance after annotation goes invisible
   * @param {number} config.minVisibilityDistance - min distance after annotation goes invisible
   * @param {string} config.id - target name for annotation
   * @returns {Object} the created annotation object with control methods
   */
  addAnnotation(config) {
    return this.annotationManager.addAnnotation({
      ...config,
      parent: this.modelManager.model,
      scaleFactor: this.modelManager.modelScaleFactor,
    });
  }

  /**
   * sets autorotation state
   * @param {boolean} enabled - whether autorotation should be enabled
   * @param {number} [speed] - optional rotation speed
   */
  setAutoRotation(enabled, speed) {
    this.autoRotation.setEnabled(enabled);
    if (speed !== undefined) {
      this.autoRotation.setSpeed(speed);
    }
  }

  /**
   * sets camera zoom
   * @param {number} zoomLevel - Zoom level (1.0 is default)
   */
  setCameraZoom(zoomLevel) {
    this.cameraController.setZoom(zoomLevel);
  }

  /**
   * rotates the model to a specific orientation
   * @param {Array<number>} rotation - rotations as [x,y,z] in radians
   */
  setModelRotation(rotation) {
    this.modelManager.setRotation(rotation);
  }

  /**
   * enable or disable high performance mode
   * @param {boolean} enabled - whether top enable high performance mode
   */
  setHighPerformanceMode(enabled) {
    this.options.highPerformanceMode = enabled;
    this.rendererManager.setHighPerformanceMode(enabled);

    if (enabled && !this.performanceMonitor) {
      this.performanceMonitor = new PerformanceMonitor(this.container);
    } else if (!enabled && this.performanceMonitor && !this.options.showFPS) {
      this.performanceMonitor.dispose();
      this.performanceMonitor = null;
    }
  }

  /**
   * Shows or hides the FPS counter
   * @param {boolean} visible - Whether to show the FPS counter
   */
  showFPS(visible) {
    this.options.showFPS = visible;

    if (visible && !this.performanceMonitor) {
      this.performanceMonitor = new PerformanceMonitor(this.container);
    } else if (
      !visible &&
      this.performanceMonitor &&
      !this.options.highPerformanceMode
    ) {
      this.performanceMonitor.dispose();
      this.performanceMonitor = null;
    }

    if (this.performanceMonitor) {
      this.performanceMonitor.setVisible(visible);
    }
  }

  /**
   * Takes a screenshot of the current view
   * @returns {Promise<string>} Promise resolving to a data URL of the screenshot
   */
  takeScreenshot() {
    return new Promise((resolve) => {
      this.rendererManager.webglRenderer.preserveDrawingBuffer = true;

      this.rendererManager.webglRenderer.render(
        this.sceneManager.scene,
        this.sceneManager.camera,
      );

      const dataURL =
        this.rendererManager.webglRenderer.domElement.toDataURL("image/png");

      this.rendererManager.webglRenderer.preserveDrawingBuffer = false;

      resolve(dataURL);
    });
  }

  /**
   * Initializes debugging tools
   * @private
   */
  _initializeDebugTools() {
    if (
      !this.sceneManager ||
      !this.cameraController ||
      !this.cameraController.controls ||
      !this.rendererManager ||
      !this.modelManager?.model ||
      !this.container
    ) {
      console.warn(
        "Cannot initialize debug tools - required components missing.",
      );
      return;
    }

    this.debugTools = new DebugTools(
      {
        scene: this.sceneManager.scene,
        camera: this.sceneManager.camera,
        renderer: this.rendererManager.webglRenderer, // Pass WebGL renderer if needed
        model: this.modelManager.model,
        container: this.container, // Pass the main container
        eventSourceElement: this.rendererManager.cssRenderer.domElement, // Element for capturing clicks/events
        cameraControls: this.cameraController.controls,
      },
      {
        // Optional: Pass debug options from viewer config if needed
      },
    );

    console.log(
      "Debug tools initialized. Use viewer.debug.* methods to access debugging features.",
    );

    // Create the public debug interface
    this.debug = {
      /**
       * Enables or disables point finding mode (double-click on model)
       * @param {boolean} enable - Whether to enable point finding
       * @returns {Object} The debug interface for chaining
       */
      enablePointFinding: (enable = true) => {
        if (this.debugTools) this.debugTools.enablePointFinding(enable);
        return this.debug;
      },

      /**
       * Enables or disables the camera information display UI.
       * @param {boolean} enable - Whether to enable the UI.
       * @returns {DebugTools} This instance for chaining.
       */
      enableCameraInfo: (enable = true) => {
        if (this.debugTools) this.debugTools.enableCameraInfo(enable);
        return this.debug;
      },

      /**
       * Enables or disables the rotation control sliders UI
       * @param {boolean} enable - Whether to enable rotation controls UI
       * @returns {Object} The debug interface for chaining
       */
      enableRotationControls: (enable = true) => {
        if (this.debugTools) this.debugTools.enableRotationControls(enable);
        return this.debug;
      },

      /**
       * Sets the model's rotation directly (expects radians)
       * @param {Array<number>} rotation - Rotation as [x,y,z] in radians
       * @returns {Object} The debug interface for chaining
       */
      setModelRotation: (rotation) => {
        if (this.debugTools) this.debugTools.setModelRotation(rotation);

        return this.debug;
      },

      /**
       * Gets the current model rotation
       * @returns {Array<number>|null} Rotation as [x,y,z] in radians or null
       */
      getModelRotation: () => {
        return this.debugTools ? this.debugTools.getModelRotation() : null;
      },
    };

    // Example: Automatically enable controls if debugMode is true in options
    if (this.options.debugMode) {
      this.debug.enablePointFinding(true);
      // this.debug.enableRotationControls(true); // Enable sliders by default in debug mode
      this.debug.enableCameraInfo(true);
    }
  }

  /**
   * @private handles the start of a user camera interaction
   */
  _handleInteractionStart() {
    if (!this.options.enableInactivityReset) return;

    clearTimeout(this.inactivityTimer);
    this.inactivityTimer = null;

    this.isUserInteracting = true;

    if (
      this.annotationManager.annotations &&
      this.annotationManager.annotations.length > 0
    ) {
      this.annotationManager.annotations.forEach((annotation) => {
        annotation.element.classList.add("opacity-0");
      });
    }

    if (this.isCameraResetAnimationActive) {
      this.isCameraResetAnimationActive = false;

      const anim = this.cameraResetAnimation;
      const controls = this.cameraController.controls;
      // this.cameraController.controls.enabled = true;

      if (anim.originalDampingEnabled) {
        controls.enableDamping = true;
        controls.dampingFactor = anim.originalDampingFactor;
      }

      controls.enabled = true;

      if (this.sceneManager && this.sceneManager.camera) {
        this.sceneManager.camera.updateProjectionMatrix();
      }

      controls.update();

      if (this.cameraResetAnimation.wasAutoRotating && this.autoRotation) {
        this.autoRotation.setEnabled(true);
      }
    }
  }

  /**
   * @private Handles the end of a user camera interaction
   */
  _handleInteractionEnd() {
    if (!this.options.enableInactivityReset) return;

    this.isUserInteracting = false;

    if (this.showAnnotationsTimer) {
      clearTimeout(this.showAnnotationsTimer);
    }

    this.showAnnotationsTimer = setTimeout(() => {
      if (
        this.annotationManager.annotations &&
        this.annotationManager.annotations.length > 0
      ) {
        this.annotationManager.annotations.forEach((annotation) => {
          annotation.element.classList.remove("opacity-0");
        });
      }
    }, this.options.cameraResetAnimationDuration + this.options.inactivityResetDelay);

    this._resetInactivityTimer();
  }

  /**
   * @private Clears any existing inactivity timer and starts a new one.
   */
  _resetInactivityTimer() {
    if (!this.options.enableInactivityReset) return;
    clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(
      this.boundResetCameraToInitial,
      this.options.inactivityResetDelay,
    );
  }

  /**
   * @private resets the camera to its saved initial position and target
   */
  _resetCameraToInitial() {
    if (
      this.isCameraResetAnimationActive ||
      !this.options.enableInactivityReset ||
      !this.sceneManager ||
      !this.cameraController ||
      !this.cameraController.controls ||
      this.isUserInteracting
    )
      return;

    const camera = this.sceneManager.camera;
    const controls = this.cameraController.controls;
    const anim = this.cameraResetAnimation;

    anim.startPos.copy(camera.position);
    anim.startTarget.copy(controls.target);
    anim.startZoom = camera.zoom;

    const actualCurrentPos = camera.position.clone();
    const actualCurrentTarget = controls.target.clone();
    const actualCurrentZoom = camera.zoom;

    camera.position.copy(this.savedInitialCameraPosition);
    controls.target.copy(this.savedInitialCameraTarget);
    camera.zoom = this.savedInitialCameraZoom;
    camera.updateProjectionMatrix();

    controls.saveState();

    camera.position.copy(actualCurrentPos);
    controls.target.copy(actualCurrentTarget);
    camera.zoom = actualCurrentZoom;
    camera.updateProjectionMatrix();

    anim.startTime = performance.now();
    // anim.startPos.copy(this.sceneManager.camera.position);
    anim.endPos.copy(this.savedInitialCameraPosition);
    // anim.startTarget.copy(this.cameraController.controls.target);
    anim.endTarget.copy(this.savedInitialCameraTarget);
    // anim.startZoom = this.sceneManager.camera.zoom;
    anim.endZoom = this.savedInitialCameraZoom;

    if (controls.enableDamping) {
      anim.originalDampingEnabled = true;
      anim.originalDampingFactor = controls.dampingFactor;
      controls.enableDamping = false;
    } else {
      anim.originalDampingEnabled = false;
    }

    // Pause auto-rotation if active
    if (this.autoRotation && this.autoRotation.isEnabled) {
      anim.wasAutoRotating = true;
      this.autoRotation.setEnabled(false);
    } else {
      anim.wasAutoRotating = false;
    }

    this.isCameraResetAnimationActive = true;
    this.cameraController.controls.enabled = false; // Disable controls during animation

    if (
      this.annotationManager.annotations &&
      this.annotationManager.annotations.length > 0
    ) {
      setTimeout(() => {
        // Only show if no interaction is happening
        if (!this.isUserInteracting) {
          this.annotationManager.annotations.forEach((annotation) => {
            annotation.element.classList.remove("opacity-0");
          });
        }
      }, this.options.cameraResetAnimationDuration + 100);
    }

    // this.sceneManager.camera.position.copy(this.savedInitialCameraPosition);
    // this.cameraController.controls.target.copy(this.savedInitialCameraTarget);
    // this.cameraController.controls.update();
  }

  /**
   * enable or disable the camera inactivity reset feature
   * @param {boolean} enable - whether to enable the feature
   * @param {number} [delay] - optional new delay in milliseconds
   */
  setInactivityReset(enable, delay) {
    this.options.enableInactivityReset = enable;
    if (delay !== undefined) {
      this.options.inactivityResetDelay = Math.max(500, delay); // minimum delay check
    }

    if (this.cameraController && this.cameraController.controls) {
      this.cameraController.controls.removeEventListener(
        "start",
        this.boundHandleInteractionStart,
      );
      this.cameraController.controls.removeEventListener(
        "end",
        this.boundHandleInteractionEnd,
      );
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;

      if (enable) {
        this.cameraController.controls.addEventListener(
          "start",
          this.boundHandleInteractionStart,
        );
        this.cameraController.controls.addEventListener(
          "end",
          this.boundHandleInteractionEnd,
        );
        this._resetInactivityTimer();
      } else {
        // inactivity reset disabled
      }
    }
  }

  /**
   * @private Updates the camera reset animation progress.
   * Called from the main animation loop.
   */
  _updateCameraResetAnimation() {
    if (
      !this.isCameraResetAnimationActive ||
      !this.sceneManager ||
      !this.cameraController ||
      !this.cameraController.controls
    ) {
      this.isCameraResetAnimationActive = false;
      if (this.cameraController && this.cameraController.controls) {
        this.cameraController.controls.enabled = true;

        const anim = this.cameraResetAnimation;
        if (anim.originalDampingEnabled) {
          this.cameraController.controls.enableDamping = true;
          this.cameraController.controls.dampingFactor =
            anim.originalDampingFactor;
        }
      }
      if (this.sceneManager && this.sceneManager.camera) {
        this.sceneManager.camera.updateProjectionMatrix();
      }
      return;
    }

    const anim = this.cameraResetAnimation;
    const camera = this.sceneManager.camera;
    const controls = this.cameraController.controls;

    const elapsedTime = performance.now() - anim.startTime;
    let progress = elapsedTime / this.options.cameraResetAnimationDuration;
    progress = Math.min(progress, 1.0);

    const easedProgress = progress * (2 - progress); // Simple ease-out

    const direction = new THREE.Vector3()
      .subVectors(anim.endPos, anim.startPos)
      .normalize();

    const distance = anim.startPos.distanceTo(anim.endPos);

    const currentPos = new THREE.Vector3()
      .copy(anim.startPos)
      .addScaledVector(direction, distance * easedProgress);

    controls.target.lerpVectors(
      anim.startTarget,
      anim.endTarget,
      easedProgress,
    );
    camera.zoom = anim.startZoom;

    camera.position.lerpVectors(anim.startPos, anim.endPos, easedProgress);
    camera.zoom = THREE.MathUtils.lerp(
      anim.startZoom,
      anim.endZoom,
      easedProgress,
    );
    camera.updateProjectionMatrix();
    controls.update();

    if (progress >= 1.0) {
      // Animation finished
      this.isCameraResetAnimationActive = false;

      camera.position.copy(anim.endPos);
      controls.target.copy(anim.endTarget);
      camera.zoom = anim.endZoom;
      camera.updateProjectionMatrix();

      if (anim.originalDampingEnabled) {
        controls.enableDamping = true;
        controls.dampingFactor = anim.originalDampingFactor;
      }

      controls.enabled = true;
      controls.update();

      if (anim.wasAutoRotating && this.autoRotation) {
        this.autoRotation.setEnabled(true);
      }
    }
  }

  /**
   * add rotation indicator
   */
  _addRotationIndicator() {
    const indicatorContainer = document.querySelector(
      ".js-3d-rotation-indicator",
    );
    indicatorContainer.className = "model-rotation-indicator";
    indicatorContainer.style.width = "60px";
    indicatorContainer.style.height = "60px";
    indicatorContainer.style.zIndex = "10";
    indicatorContainer.style.opacity = "1.0";
    indicatorContainer.style.transition = "opacity 0.3s ease";
    indicatorContainer.style.pointerEvents = "none";

    indicatorContainer.innerHTML = viewerIcon();

    let fadeOutTimeoutId = null;
    let fadeInTimeoutId = null;

    const fadeOutIndicator = () => {
      indicatorContainer.style.opacity = "0";
      clearTimeout(fadeInTimeoutId);
    };
    const fadeInIndicator = () => {
      fadeInTimeoutId = setTimeout(() => {
        indicatorContainer.style.opacity = "1";
      }, this.options.inactivityResetDelay + this.options.cameraResetAnimationDuration);
    };

    this.container.addEventListener("mousedown", fadeOutIndicator);
    this.container.addEventListener("mouseup", fadeInIndicator);
    this.container.addEventListener("touchstart", fadeOutIndicator);
    this.container.addEventListener("touchend", fadeInIndicator);
  }

  /**
   * dispose resources
   */
  dispose() {
    if (this.isDisposed) return;

    this.isDisposed = true;

    clearTimeout(this.inactivityTimer);
    clearTimeout(this.showAnnotationsTimer);

    if (this.cameraController && this.cameraController.controls) {
      this.cameraController.controls.removeEventListener(
        "start",
        this.boundHandleInteractionStart,
      );
      this.cameraController.controls.removeEventListener(
        "end",
        this.boundHandleInteractionEnd,
      );
      this.cameraController.controls.enabled = true;
    }

    this.isCameraResetAnimationActive = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.debugTools) {
      this.debugTools.dispose();
      this.debugTools = null;
      this.debug = null;
    }

    if (this.autoRotation) this.autoRotation.dispose();
    if (this.cameraController) this.cameraController.dispose();
    if (this.performanceMonitor) this.performanceMonitor.dispose();
    if (this.annotationManager) this.annotationManager.dispose();
    if (this.modelManager) this.modelManager.dispose();
    if (this.rendererManager) this.rendererManager.dispose();

    this.autoRotation = null;
    this.cameraController = null;
    this.performanceMonitor = null;
    this.annotationManager = null;
    this.modelManager = null;
    this.rendererManager = null;
    this.sceneManager = null;

    if (this.container) {
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }
    }

    this.container = null;
    this.modelColors = [];
    this._colorExclusionNames = [];

    this.savedInitialCameraPosition = null;
    this.savedInitialCameraTarget = null;
    this.inactivityTimer = null;
    this.boundHandleInteractionStart = null;
    this.boundHandleInteractionEnd = null;
    this.boundResetCameraToInitial = null;
    this.cameraResetAnimation = null;
    this.boundUpdateCameraResetAnimation = null;
  }
}
