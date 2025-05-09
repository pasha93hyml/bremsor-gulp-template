import * as THREE from "three";

/**
 * Manages the three.js scene and camera
 */

export class SceneManager {
  /**
   * Creates a new scene manager
   * @param {Object} [options] - configuration options
   * @param {number} [options.fov=60] - Camera field of view(fov)
   * @param {THREE.Color|number} [options.backgroundColor=0x0a0a0a] - scene background color
   */
  constructor(options = {}) {
    this.options = {
      fov: 60,
      backgroundColor: 0x0a0a0a,
      ...options,
    };

    this.scene = this._createScene();
    this.camera = this._createCamera();
    this._setupLights();
  }

  /**
   * creates and configures a scene
   * @private
   * @returns {THREE.Scene} configured scene
   */
  _createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(this.options.backgroundColor);
    return scene;
  }

  /**
   * Creates and configures a perspective camera
   * @private
   * @return {THREE.PerspectiveCamera} configured camera
   */
  _createCamera() {
    const camera = new THREE.PerspectiveCamera(
      this.options.fov,
      1, // placeholder aspect ratio
      0.1,
      1000,
    );
    camera.position.set(0, 0, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    return camera;
  }

  /**
   * Sets up lighting for the scene
   * @private
   */
  _setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);

    // Main direction light
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 10, 7.5);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    // Fill light from opposite direction
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 0, -7.5);
    this.scene.add(fillLight);

    // Rim light for edge highlighting
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.1);
    rimLight.position.set(0, -10, -1);
    this.scene.add(rimLight);
  }

  /**
   * updates the camera's aspect ratio
   * @param {number} width - viewport width
   * @param {number} height - viewport height
   */
  updateCameraAspect(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * disposes scene resources
   */
  dispose() {
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }

      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    while(this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0])
    }
  }
}
