import * as THREE from "three";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";

/**
 * Creates and configures WebGL and CSS3D renderers
 * @param {number} width - Viewport width
 * @param {number} height - Viewport height
 * @param {HTMLElement} container - Container element to append renderers to
 * @returns {Object} Object containing both renderers
 */
export function setupRenderers(width, height, container) {
  const webglRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  webglRenderer.setSize(width, height);
  webglRenderer.setPixelRatio(window.devicePixelRatio);
  webglRenderer.outputColorSpace = THREE.SRGBColorSpace;
  webglRenderer.domElement.style.position = "absolute";
  webglRenderer.domElement.style.top = "0";
  webglRenderer.domElement.style.left = "0";
  webglRenderer.domElement.style.zIndex = "0";
  container.appendChild(webglRenderer.domElement);

  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(width, height);
  cssRenderer.domElement.style.position = "absolute";
  cssRenderer.domElement.style.top = "0";
  cssRenderer.domElement.style.left = "0";
  cssRenderer.domElement.style.zIndex = "1";
  container.appendChild(cssRenderer.domElement);

  return { webglRenderer, cssRenderer };
}