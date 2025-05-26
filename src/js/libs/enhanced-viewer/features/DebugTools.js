import * as THREE from "three";

/**
 * Provides debugging tools for the model viewer, integrated into the container.
 */
export class DebugTools {
  /**
   * Creates a new debug tools instance
   * @param {Object} context - model viewer context
   * @param {THREE.Scene} context.scene - scene
   * @param {THREE.Camera} context.camera - camera
   * @param {THREE.WebGLRenderer} context.renderer - WebGL renderer
   * @param {THREE.Object3D} context.model - 3D model
   * @param {HTMLElement} context.container - The main viewer container element
   * @param {HTMLElement} context.eventSourceElement - DOM element for event handling (e.g., CSS renderer)
   * @param {Object} [context.cameraControls] - Optional camera controls instance (e.g., OrbitControls)
   * @param {Object} [options] - Configuration options
   * @param {boolean} [options.enableCopyToClipboard=true] - Enable copying coordinates to clipboard
   * @param {number} [options.markerDuration=2000] - Duration to show temporary markers (ms)
   * @param {number} [options.markerSize=0.02] - Size of temporary markers relative to model size (approx)
   */
  constructor(context, options = {}) {
    this.scene = context.scene;
    this.camera = context.camera;
    this.renderer = context.renderer;
    this.model = context.model;
    this.container = context.container; // Use the main container for UI elements
    this.eventSourceElement = context.eventSourceElement; // Element for clicks/drags if needed
    this.cameraControls = context.cameraControls;

    this.options = {
      enableCopyToClipboard: true,
      markerDuration: 2000,
      markerSize: 0.02, // Relative size
      ...options,
    };

    this.isPointFindingEnabled = false;
    this.isRotationControlEnabled = false;
    this.isCameraInfoEnabled = false;
    this.boundOnDoubleClick = null;
    this.markers = [];
    this.rotationControlsUI = null;
    this.coordinateDisplay = null;
    this.cameraInfoUI = null;

    this.boundUpdateCameraInfoDisplay =
      this._updateCameraInfoDisplay.bind(this);

    this.actualMarkerSize = 0.05;
    if (this.model) {
      const box = new THREE.Box3().setFromObject(this.model);
      const size = box.getSize(new THREE.Vector3());
      this.actualMarkerSize =
        Math.max(size.x, size.y, size.z) * this.options.markerSize;
    }
  }

  /**
   * Creates the UI for displaying camera information within the container
   * @private
   */
  _createCameraInfoUI() {
    if (this.cameraInfoUI) return;

    const ui = document.createElement("div");
    ui.className = "model-viewer-camera-info";
    ui.style.position = "absolute";
    ui.style.top = "10px";
    ui.style.right = "10px";
    ui.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
    ui.style.color = "white";
    ui.style.padding = "10px";
    ui.style.borderRadius = "4px";
    ui.style.zIndex = "101";
    ui.style.fontFamily = "monospace";
    ui.style.fontSize = "12px";
    ui.style.minWidth = "250px";
    ui.style.textAlign = "left";

    ui.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Camera Info:</div>
      <div style="margin-bottom: 5px;">
        Pos: <span id="cam-pos-x">0.00</span>, <span id="cam-pos-y">0.00</span>, <span id="cam-pos-z">0.00</span>
      </div>
      <div style="margin-bottom: 8px;">
        Target: <span id="cam-target-x">0.00</span>, <span id="cam-target-y">0.00</span>, <span id="cam-target-z">0.00</span>
      </div>
      <button id="copy-camera-view-btn" style="padding: 5px 10px; background-color: #2196F3; border: none; border-radius: 3px; color: white; cursor: pointer; width: 100%;">
        Copy Camera View
      </button>
    `;

    this.container.appendChild(ui);
    this.cameraInfoUI = ui;
    this.cameraInfoUI.style.display = "none";

    const copyBtn = ui.querySelector("#copy-camera-view-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        if (!this.camera) return;

        const camPos = this.camera.position;

        let camTarget = new THREE.Vector3(0, 0, 0); // Default
        if (
          this.cameraControls &&
          this.cameraControls.target instanceof THREE.Vector3
        ) {
          camTarget.copy(this.cameraControls.target);
        } else if (
          this.camera.parent &&
          this.camera.parent.isObject3D &&
          this.camera.parent.target instanceof THREE.Vector3
        ) {
          camTarget.copy(this.camera.parent.target);
        } else if (this.camera.userData.orbitControlsTarget) {
          camTarget.copy(this.camera.userData.orbitControlsTarget);
        } else {
          this.camera
            .getWorldDirection(camTarget)
            .multiplyScalar(5)
            .add(camPos);
          console.warn(
            "Camera target not explicitly found, using point in front of camera.",
          );
        }

        const posStr = `new THREE.Vector3(${camPos.x.toFixed(3)}, ${camPos.y.toFixed(3)}, ${camPos.z.toFixed(3)})`;
        const targetStr = `new THREE.Vector3(${camTarget.x.toFixed(3)}, ${camTarget.y.toFixed(3)}, ${camTarget.z.toFixed(3)})`;

        const viewConfig = `
// Camera View Configuration:
const cameraPosition = ${posStr};
const cameraTarget = ${targetStr};

// Usage (e.g., in your ModelViewer or CameraController setup):
// viewer.cameraController.setPositionAndTarget(cameraPosition, cameraTarget);
// OR
// camera.position.copy(cameraPosition);
// camera.lookAt(cameraTarget);
// if (controls) controls.target.copy(cameraTarget);
        `;

        navigator.clipboard.writeText(viewConfig.trim()).then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = "Copied!";
          copyBtn.disabled = true;
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.disabled = false;
          }, 1500);
        });
      });
    }
  }

  /**
   * Updates the camera information display with current values.
   * @private
   */
  _updateCameraInfoDisplay() {
    if (
      !this.cameraInfoUI ||
      !this.camera ||
      this.cameraInfoUI.style.display === "none"
    )
      return;

    const camPos = this.camera.position;
    this.cameraInfoUI.querySelector("#cam-pos-x").textContent =
      camPos.x.toFixed(2);
    this.cameraInfoUI.querySelector("#cam-pos-y").textContent =
      camPos.y.toFixed(2);
    this.cameraInfoUI.querySelector("#cam-pos-z").textContent =
      camPos.z.toFixed(2);

    let camTarget = new THREE.Vector3(0, 0, 0);
    if (
      this.cameraControls &&
      this.cameraControls.target instanceof THREE.Vector3
    ) {
      camTarget.copy(this.cameraControls.target);
    } else if (
      this.camera.parent &&
      this.camera.parent.isObject3D &&
      this.camera.parent.target instanceof THREE.Vector3
    ) {
      camTarget.copy(this.camera.parent.target);
    } else if (this.camera.userData.orbitControlsTarget) {
      camTarget.copy(this.camera.userData.orbitControlsTarget);
    } else {
      const tempTarget = new THREE.Vector3();
      this.camera.getWorldDirection(tempTarget);
      tempTarget.multiplyScalar(1).add(camPos);
      camTarget.copy(tempTarget);
    }

    this.cameraInfoUI.querySelector("#cam-target-x").textContent =
      camTarget.x.toFixed(2);
    this.cameraInfoUI.querySelector("#cam-target-y").textContent =
      camTarget.y.toFixed(2);
    this.cameraInfoUI.querySelector("#cam-target-z").textContent =
      camTarget.z.toFixed(2);
  }

  /**
   * Enables or disables the camera information display UI.
   * @param {boolean} enable - Whether to enable the UI.
   * @returns {DebugTools} This instance for chaining.
   */
  enableCameraInfo(enable = true) {
    if (enable === this.isCameraInfoEnabled) return this;

    if (enable) {
      if (!this.cameraInfoUI) {
        this._createCameraInfoUI();
      }
      this.cameraInfoUI.style.display = "block";
      this._updateCameraInfoDisplay();

      if (this.cameraControls) {
        this.cameraControls.addEventListener(
          "change",
          this.boundUpdateCameraInfoDisplay,
        );
        console.log("Camera info UI enabled and listening for camera changes.");
      }
    } else {
      if (this.cameraInfoUI) {
        this.cameraInfoUI.style.display = "none";
      }
      if (this.cameraControls) {
        this.cameraControls.removeEventListener(
          "change",
          this.boundUpdateCameraInfoDisplay,
        );
      }
      console.log(
        "Camera info UI disabled and stopped listening for camera changes.",
      );
    }
    this.isCameraInfoEnabled = enable;
    return this;
  }

  /**
   * Creates a floating display for coordinates within the container
   * @private
   * @returns {HTMLElement} coordinate display element
   */
  _createCoordinateDisplay() {
    if (this.coordinateDisplay) return this.coordinateDisplay;

    const display = document.createElement("div");
    display.className = "model-viewer-coordinate-display";

    display.style.position = "absolute";
    display.style.bottom = "10px";
    display.style.left = "10px";
    display.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
    display.style.color = "white";
    display.style.padding = "8px 12px";
    display.style.borderRadius = "4px";
    display.style.fontFamily = "monospace";
    display.style.fontSize = "12px";
    display.style.zIndex = "101";
    display.style.display = "none";
    display.style.maxWidth = "calc(100% - 20px)";
    display.style.whiteSpace = "pre-wrap";
    display.style.wordBreak = "break-all";
    display.style.pointerEvents = "none";

    this.coordinateDisplay = display;
    this.container.appendChild(this.coordinateDisplay);
    return display;
  }

  /**
   * Enables or disables point finding mode
   * @param {boolean} enable - Whether to enable point finding
   * @returns {DebugTools} This instance for chaining
   */
  enablePointFinding(enable = true) {
    if (enable === this.isPointFindingEnabled || !this.eventSourceElement)
      return this;

    this._createCoordinateDisplay();

    if (enable) {
      if (!this.boundOnDoubleClick) {
        this.boundOnDoubleClick = this._handlePointFindingClick.bind(this);
        this.eventSourceElement.addEventListener(
          "dblclick",
          this.boundOnDoubleClick,
        );
        this.eventSourceElement.style.cursor = "crosshair";
        console.log(
          "Point finding enabled. Double-click on the model to find coordinates.",
        );
      }
    } else {
      if (this.boundOnDoubleClick) {
        this.eventSourceElement.removeEventListener(
          "dblclick",
          this.boundOnDoubleClick,
        );
        this.boundOnDoubleClick = null;
        this.eventSourceElement.style.cursor = "";
        if (this.coordinateDisplay) {
          this.coordinateDisplay.style.display = "none";
        }
        console.log("Point finding disabled.");
      }
    }

    this.isPointFindingEnabled = enable;
    return this;
  }

  /**
   * Handles double-click events for point finding
   * @private
   * @param {MouseEvent} event - The click event
   */
  _handlePointFindingClick(event) {
    if (!this.model || !this.camera || !this.eventSourceElement) return;

    const rect = this.eventSourceElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObject(this.model, true); // Check recursively

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

      const coordsArray = `[${x}, ${y}, ${z}]`;
      const coordsObject = `{x: ${x}, y: ${y}, z: ${z}}`;
      const coordsVector = `new THREE.Vector3(${x}, ${y}, ${z})`;

      this._showCoordinates(event.clientX, event.clientY, {
        array: coordsArray,
        object: coordsObject,
        vector: coordsVector,
        raw: { x: parseFloat(x), y: parseFloat(y), z: parseFloat(z) },
      });

      this._addTemporaryMarker(worldPoint);

      console.log(`Point Found (Local Coords): ${coordsArray}`);
    } else {
      console.log("No intersection found with the model.");
      if (this.coordinateDisplay) {
        this.coordinateDisplay.textContent = "No intersection found.";
        this.coordinateDisplay.style.display = "block";
        setTimeout(() => {
          if (this.coordinateDisplay)
            this.coordinateDisplay.style.display = "none";
        }, 2000);
      }
    }
  }

  /**
   * Shows coordinate information in the display panel
   * @private
   * @param {number} screenX - Screen X position of the click (used for potential future positioning)
   * @param {number} screenY - Screen Y position of the click
   * @param {Object} coords - Coordinate data in different formats
   */
  _showCoordinates(screenX, screenY, coords) {
    const display = this._createCoordinateDisplay();

    display.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong>Coordinates:</strong>
        <button id="copy-coords-btn" style="padding: 3px 8px; background-color: #4CAF50; border: none; border-radius: 3px; color: white; cursor: pointer; pointer-events: auto;">
          Copy Vector3
        </button>
      </div>
      <div style="margin-bottom: 4px;"><span style="color: #aaa;">Array:</span> ${coords.array}</div>
      <div style="margin-bottom: 4px;"><span style="color: #aaa;">Object:</span> ${coords.object}</div>
      <div><span style="color: #aaa;">Vector3:</span> ${coords.vector}</div>
    `;

    const copyBtn = display.querySelector("#copy-coords-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(coords.vector).then(() => {
          copyBtn.textContent = "Copied!";
          copyBtn.disabled = true;
          setTimeout(() => {
            copyBtn.textContent = "Copy Vector3";
            copyBtn.disabled = false;
          }, 1500);
        });
      });
    }

    display.style.display = "block";
  }

  /**
   * Adds a temporary visual marker at the clicked point
   * @private
   * @param {THREE.Vector3} worldPosition - Position in world coordinates
   */
  _addTemporaryMarker(worldPosition) {
    const geometry = new THREE.SphereGeometry(this.actualMarkerSize, 16, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(worldPosition);
    marker.renderOrder = 999;

    this.scene.add(marker);
    this.markers.push(marker);

    setTimeout(() => {
      if (this.scene && marker.parent === this.scene) {
        this.scene.remove(marker);
      }
      geometry.dispose();
      material.dispose();

      const index = this.markers.indexOf(marker);
      if (index !== -1) {
        this.markers.splice(index, 1);
      }
    }, this.options.markerDuration);
  }

  /**
   * Enables or disables manual rotation controls UI (sliders)
   * @param {boolean} enable - Whether to enable rotation controls UI
   * @returns {DebugTools} This instance for chaining
   */
  enableRotationControls(enable = true) {
    if (enable === this.isRotationControlEnabled) return this;

    if (enable) {
      if (!this.rotationControlsUI) {
        this._createRotationControlsUI();
      }
      this.rotationControlsUI.style.display = "block";
      this._updateRotationDisplay();
      console.log("Rotation controls UI enabled.");
    } else {
      if (this.rotationControlsUI) {
        this.rotationControlsUI.style.display = "none";
      }
      console.log("Rotation controls UI disabled.");
    }

    this.isRotationControlEnabled = enable;
    return this;
  }

  /**
   * Creates the UI for rotation controls (sliders) within the container
   * @private
   */
  _createRotationControlsUI() {
    if (this.rotationControlsUI) return;

    const ui = document.createElement("div");
    ui.className = "model-viewer-rotation-controls";
    ui.style.position = "absolute";
    ui.style.top = "10px";
    ui.style.left = "10px";
    ui.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
    ui.style.color = "white";
    ui.style.padding = "10px";
    ui.style.borderRadius = "4px";
    ui.style.zIndex = "101";
    ui.style.fontFamily = "sans-serif";
    ui.style.fontSize = "12px";
    ui.style.minWidth = "200px";

    const createAxis = (name, initialValueRad = 0) => {
      const container = document.createElement("div");
      container.style.marginBottom = "8px";
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "space-between";

      const label = document.createElement("label");
      label.textContent = `${name.toUpperCase()}: `;
      label.style.marginRight = "10px";
      label.style.width = "15px";

      const input = document.createElement("input");
      input.type = "range";
      input.min = "-180";
      input.max = "180";
      input.step = "1";
      input.value = THREE.MathUtils.radToDeg(initialValueRad).toFixed(0);
      input.style.flexGrow = "1";
      input.style.marginRight = "10px";
      input.style.height = "4px";

      const valueDisplay = document.createElement("span");
      valueDisplay.textContent = input.value + "°";
      valueDisplay.style.width = "45px";
      valueDisplay.style.textAlign = "right";

      input.addEventListener("input", () => {
        const valueDeg = parseFloat(input.value);
        valueDisplay.textContent = valueDeg.toFixed(0) + "°";

        if (this.model) {
          this.model.rotation[name] = THREE.MathUtils.degToRad(valueDeg);
        }
      });

      container.appendChild(label);
      container.appendChild(input);
      container.appendChild(valueDisplay);

      return {
        container,
        input,
        valueDisplay,
      };
    };

    const initialRot = this.model ? this.model.rotation : { x: 0, y: 0, z: 0 };
    this.xRotation = createAxis("x", initialRot.x);
    this.yRotation = createAxis("y", initialRot.y);
    this.zRotation = createAxis("z", initialRot.z);

    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy Rotation (radians)";
    copyButton.style.padding = "5px 10px";
    copyButton.style.backgroundColor = "#4CAF50";
    copyButton.style.border = "none";
    copyButton.style.borderRadius = "3px";
    copyButton.style.color = "white";
    copyButton.style.cursor = "pointer";
    copyButton.style.width = "100%";
    copyButton.style.marginTop = "5px";

    copyButton.addEventListener("click", () => {
      if (!this.model) return;

      const x = this.model.rotation.x.toFixed(4);
      const y = this.model.rotation.y.toFixed(4);
      const z = this.model.rotation.z.toFixed(4);
      const rotationText = `[${x}, ${y}, ${z}]`;

      navigator.clipboard.writeText(rotationText).then(() => {
        const originalText = copyButton.textContent;
        copyButton.textContent = "Copied!";
        copyButton.disabled = true;
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.disabled = false;
        }, 1500);
      });
    });

    const resetButton = document.createElement("button");
    resetButton.textContent = "Reset Rotation";
    resetButton.style.padding = "5px 10px";
    resetButton.style.backgroundColor = "#f44336";
    resetButton.style.border = "none";
    resetButton.style.borderRadius = "3px";
    resetButton.style.color = "white";
    resetButton.style.cursor = "pointer";
    resetButton.style.width = "100%";
    resetButton.style.marginTop = "5px";

    resetButton.addEventListener("click", () => {
      if (!this.model) return;
      this.model.rotation.set(0, 0, 0);
      this._updateRotationDisplay();
    });

    ui.appendChild(this.xRotation.container);
    ui.appendChild(this.yRotation.container);
    ui.appendChild(this.zRotation.container);
    ui.appendChild(copyButton);
    ui.appendChild(resetButton);

    this.container.appendChild(ui);
    this.rotationControlsUI = ui;
    this.rotationControlsUI.style.display = "none";
  }

  /**
   * Updates the rotation control UI sliders to match the model's current rotation
   * @private
   */
  _updateRotationDisplay() {
    if (
      !this.model ||
      !this.rotationControlsUI ||
      !this.isRotationControlEnabled
    )
      return;

    const rotation = this.model.rotation;

    const rotXDeg = THREE.MathUtils.radToDeg(rotation.x);
    this.xRotation.input.value = rotXDeg.toFixed(0);
    this.xRotation.valueDisplay.textContent = rotXDeg.toFixed(0) + "°";

    const rotYDeg = THREE.MathUtils.radToDeg(rotation.y);
    this.yRotation.input.value = rotYDeg.toFixed(0);
    this.yRotation.valueDisplay.textContent = rotYDeg.toFixed(0) + "°";

    const rotZDeg = THREE.MathUtils.radToDeg(rotation.z);
    this.zRotation.input.value = rotZDeg.toFixed(0);
    this.zRotation.valueDisplay.textContent = rotZDeg.toFixed(0) + "°";
  }

  /**
   * Sets the model's rotation directly (expects radians)
   * @param {Array<number>} rotation - Rotation as [x,y,z] in radians
   * @returns {DebugTools} This instance for chaining
   */
  setModelRotation(rotation) {
    if (!this.model || !Array.isArray(rotation) || rotation.length !== 3)
      return this;

    const [x, y, z] = rotation;
    this.model.rotation.set(x, y, z);

    this._updateRotationDisplay();

    return this;
  }

  /**
   * Gets the current model rotation
   * @returns {Array<number>|null} Rotation as [x,y,z] in radians or null if no model
   */
  getModelRotation() {
    if (!this.model) return null;

    return [
      this.model.rotation.x,
      this.model.rotation.y,
      this.model.rotation.z,
    ];
  }

  /**
   * Disposes debug tools resources
   */
  dispose() {
    this.enablePointFinding(false);
    this.enableRotationControls(false);

    this.markers.forEach((marker) => {
      if (marker.parent) {
        marker.parent.remove(marker);
      }
      if (marker.geometry) marker.geometry.dispose();
      if (marker.material) marker.material.dispose();
    });
    this.markers = [];

    if (this.coordinateDisplay && this.coordinateDisplay.parentNode) {
      this.coordinateDisplay.parentNode.removeChild(this.coordinateDisplay);
    }
    if (this.rotationControlsUI && this.rotationControlsUI.parentNode) {
      this.rotationControlsUI.parentNode.removeChild(this.rotationControlsUI);
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.model = null;
    this.container = null;
    this.eventSourceElement = null;
    this.coordinateDisplay = null;
    this.rotationControlsUI = null;
    this.cameraInfoUI = null;
    this.cameraControls = null;
    this.boundUpdateCameraInfoDisplay = null;
  }
}
