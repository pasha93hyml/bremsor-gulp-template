import { SceneManager } from "./core/SceneManager.js";
import { RendererManager } from "./core/RendererManager.js";
import { ModelManager } from "./core/ModelManager.js";
import { AnnotationManager } from "./core/AnnotationManager.js";

import { AutoRotation } from "./features/AutoRotation.js";
import { CameraController } from "./features/CameraController.js";
import { PerformanceMonitor } from "./features/PerformanceMonitor.js";
import { DebugTools } from "./features/DebugTools.js";

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
   */
  constructor(config) {
    if (!config?.container) {
      throw new Error("Container element for 3d viewer is required");
    }

    this.container = config.container;
    this.modelPath = config.modelPath;

    this.options = {
      hideAnnotationsBehindModel: true,
      enableAutoRotate: true,
      autoRotateSpeed: 3.0,
      pauseRotationOnHover: true,
      enableZoom: false,
      defaultZoom: 1.0,
      // initialRotation: [0.8901, -0.8203, 0.0524],
      initialRotation: [1.5184, -0.9599, 0.4363],
      highPerformanceMode: false,
      showFPS: false,
      enableLOD: true,
      debugMode: true,
      ...config.options,
    };

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

    this.sceneManager = new SceneManager({fov: 60});

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
        this.cameraController.setupOptimalCameraPosition(
          this.modelManager.model,
        );
        if (this.options.debugMode) {
          this._initializeDebugTools();
          this.debug.enablePointFinding()
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

      this.cameraController.update();
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
   * add HTML element as annotation attached to 3d position
   * @param {Object} config - annotation configuration
   * @param {string} config.htmlContent - HTML content for annotation
   * @param {THREE.Vector3} config.position - position in model space
   * @param {string} [config.cssClass="model-annotation"] - css class for styling
   * @param {boolean} [config.faceCamera=true] - whether annotation should face camera
   * @returns {Object} created annotation object
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
    // Ensure all required components are ready
    if (!this.sceneManager || !this.cameraController || !this.rendererManager || !this.modelManager?.model || !this.container) {
      console.warn("Cannot initialize debug tools - required components missing.");
      return;
    }

    this.debugTools = new DebugTools({
      scene: this.sceneManager.scene,
      camera: this.sceneManager.camera,
      renderer: this.rendererManager.webglRenderer, // Pass WebGL renderer if needed
      model: this.modelManager.model,
      container: this.container, // Pass the main container
      eventSourceElement: this.rendererManager.cssRenderer.domElement, // Element for capturing clicks/events
    }, {
      // Optional: Pass debug options from viewer config if needed
      // markerSize: this.options.debugMarkerSize || 0.02
    });

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
        // Also update the ModelManager's internal state if necessary,
        // though DebugTools modifies the model directly here.
        // if (this.modelManager) this.modelManager.setRotation(rotation);
        return this.debug;
      },

      /**
       * Gets the current model rotation
       * @returns {Array<number>|null} Rotation as [x,y,z] in radians or null
       */
      getModelRotation: () => {
        return this.debugTools ? this.debugTools.getModelRotation() : null;
      },

      // Add other debug methods as needed
    };

    // Example: Automatically enable controls if debugMode is true in options
    if (this.options.debugMode) {
      this.debug.enablePointFinding(true);
      this.debug.enableRotationControls(true); // Enable sliders by default in debug mode
    }
  }

  /**
   * dispose resources
   */
  dispose() {
    if (this.isDisposed) return;

    this.isDisposed = true;

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
  }
}
