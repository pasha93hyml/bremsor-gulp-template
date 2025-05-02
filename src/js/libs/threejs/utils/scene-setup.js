import * as THREE from "three";

/**
 * Creates and configures a Three.js scene
 * @returns {THREE.Scene} The configured scene
 */
export function setupScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  return scene;
}

/**
 * Creates and configures a perspective camera
 * @param {number} width - Viewport width
 * @param {number} height - Viewport height
 * @returns {THREE.PerspectiveCamera} The configured camera
 */
export function setupCamera(width, height) {
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, 0);
  return camera;
}

/**
 * Sets up lighting for the scene
 * @param {THREE.Scene} scene - The scene to add lights to
 */
export function setupLights(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
}