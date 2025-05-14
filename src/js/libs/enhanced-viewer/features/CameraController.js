import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * manages camera controls and position
 */
export class CameraController {
  /**
   * creates camera controller
   * @param {THREE.Camera} camera - camera
   * @param {HTMLElement} domElement - DOM element for controls
   * @param {Object} [options] - configuration options
   * @param {boolean} [options.enableZoom=false] - Enable camera zoom
   * @param {number} [options.defaultZoom=1.0] - default camera zoom
   * @param {number} [options.minPolarAngle=0] - no lower limit for vertical rotation
   * @param {number} [options.maxPolarAngle=Math.PI] - no upper limit for vertical rotation
   */
  constructor(camera, domElement, options = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.options = {
      enableZoom: false,
      defaultZoom: 1.0,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
      ...options,
    };

    this.controls = this._setupControls();
    this.initialViewState = null;
  }

  /**
   * setup orbit controls
   * @private
   * @returns {OrbitControls} configured controls
   */
  _setupControls() {
    const controls = new OrbitControls(this.camera, this.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);

    // restrict vertical rotation
    // controls.minPolarAngle = Math.PI / 2;
    // controls.maxPolarAngle = Math.PI / 2;

    // zoom setting
    controls.enableZoom = this.options.enableZoom;
    controls.zoomSpeed = 1.0;
    controls.minDistance = 1;
    controls.maxDistance = 10;

    // prevent interaction on scroll
    controls.enablePan = false;

    controls.update();
    return controls;
  }

  /**
   * Sets the polar angle limits for camera rotation.
   * @param {number} minAngle - Minimum polar angle in radians.
   * @param {number} maxAngle - Maximum polar angle in radians.
   */
  setPolarAngleLimits(minAngle, maxAngle) {
    if (this.controls) {
      this.controls.minPolarAngle = minAngle;
      this.controls.maxPolarAngle = maxAngle;
    }
  }

  /**
   * setup optimal camera position based on model size
   * @param {THREE.Object3D} model - model frame
   */

  setupOptimalCameraPosition(model) {
    if (!model || !this.camera || !this.controls) return;

    const box = new THREE.Box3().setFromObject(model);
    const boundingSphere = box.getBoundingSphere(new THREE.Sphere());
    const modelRadius = boundingSphere.radius;
    const modelCenter = boundingSphere.center;

    // calculate optimal distance based on FOV(field of view)
    const fovInRadians = THREE.MathUtils.degToRad(this.camera.fov);
    const baseCameraDistance = modelRadius / Math.tan(fovInRadians / 2);

    const isMobile = window.innerWidth < 768;
    const paddingFactor = isMobile ? 10 : 0.8;
    const effectiveDistance = baseCameraDistance * paddingFactor;

    const cameraY = modelCenter.y + modelRadius * 0.5;

    // this.camera.position.set(0, cameraY, effectiveDistance);
    this.camera.position.set(
      modelCenter.x,
      cameraY,
      modelCenter.z + effectiveDistance,
    );
    this.controls.target.copy(modelCenter);
    this.controls.target.y += modelRadius * 0.5;
    // this.controls.target.set(0, 0, 0);

    let defaultZoom = this.options.defaultZoom;
    if (isMobile) {
      defaultZoom = this.options.defaultZoom * 0.7;
    }

    // zoom
    if (defaultZoom !== 1) {
      this.setZoom(defaultZoom);
    }

    this.camera.lookAt(this.controls.target);
    this.controls.update();

    if (this.initialViewState) {
      this.setViewState(this.initialViewState);
      this.initialViewState = null;
    }
  }

  /**
   * updates controls (used in animation loop)
   */
  update() {
    if (this.controls) {
      this.controls.update();
    }
  }

  /**
   * setup camera zoom
   * @param {number} zoomLevel - zoom level to set (1.0 is default)
   */
  setZoom(zoomLevel) {
    if (!this.camera || !this.controls) return;

    const currentDistance = this.camera.position.distanceTo(
      this.controls.target,
    );

    const newDistance = currentDistance / zoomLevel;

    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize();

    this.camera.position
      .copy(direction)
      .multiplyScalar(newDistance)
      .add(this.controls.target);

    this.controls.update();
  }

  /**
   * gets current view state
   * @returns {Object|null} view state object or null if not ready
   */
  getViewState() {
    if (!this.camera || !this.controls) return null;

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
   * setup view state
   * @param {Object} viewState - view state object
   */
  setViewState(viewState) {
    if (!viewState?.cameraPosition || !viewState?.controlsTarget) {
      console.error("Invalid viewState object provided:", viewState);
      return;
    }

    if (!this.camera || !this.controls) {
      this.initialViewState = viewState;
      return;
    }

    const [cpX, cpY, cpZ] = viewState.cameraPosition;
    const [ctX, ctY, ctZ] = viewState.controlsTarget;

    this.camera.position.set(cpX, cpY, cpZ);
    this.controls.target.set(ctX, ctY, ctZ);
    this.controls.update();
  }

  /**
   * enable or disable zoom
   * @param {boolean} enabled - whether Zoom should be enabled
   */
  setZoomEnabled(enabled) {
    if (!this.controls) return;

    this.options.enableZoom = enabled;
    this.controls.enableZoom = enabled;
  }

  /**
   * dispose resources
   */
  dispose() {
    if (this.controls) {
      this.controls.dispose();
    }

    this.controls = null;
    this.camera = null;
    this.domElement = null;
  }
}
