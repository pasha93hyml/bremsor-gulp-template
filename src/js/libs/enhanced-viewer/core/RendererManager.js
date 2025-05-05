import * as THREE from "three";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";

/**
 * manages WebGL and CSS3D renderers
 */
export class RendererManager {
  /**
   * creates a new renderer manager
   * @param {number} width - initial width
   * @param {number} height - initial height
   * @param {HTMLElement} container - container element
   * @param {Object} [options] - configuration options
   * @param {boolean} [options.highPerformanceMode=false] - enable high performance mode
   */
  constructor(width, height, container, options = {}) {
    this.container = container;
    this.options = {
      highPerformanceMode: false,
      ...options,
    };

    this.webglRenderer = this._createWebGLRenderer(width, height);
    this.cssRenderer = this._createCSS3DRenderer(width, height);

    this._setupResizeObserver();
  }

  /**
   * creates and configures WebGL renderer
   * @private
   * @param {number} width - viewport width
   * @param {number} height - viewport height
   * @returns {THREE.WebGLRenderer} configured WebGL renderer
   */
  _createWebGLRenderer(width, height) {
    const renderer = new THREE.WebGLRenderer({
      antialias: !this.options.highPerformanceMode,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      this.options.highPerformanceMode ? 1 : window.devicePixelRatio,
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !this.options.highPerformanceMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "0";

    this.container.appendChild(renderer.domElement);

    return renderer;
  }

  /**
   * creates and configures the CSS3D renderer
   * @private
   * @param {number} width - viewport width
   * @param {number} height - viewport height
   * @returns {CSS3DRenderer} configured CSS3D renderer
   */
  _createCSS3DRenderer(width, height) {
    const renderer = new CSS3DRenderer();
    renderer.setSize(width, height);

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "1";
    renderer.domElement.classList.add("touchscreen-scroll-events");

    this.container.appendChild(renderer.domElement);

    return renderer;
  }

  /**
   * Sets up a resize observer to handle container size changes
   * @private
   */
  _setupResizeObserver() {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === this.container) {
          const width = entry.contentRect.width;
          const height = entry.contentRect.height;

          if (width > 0 && height > 0) {
            this.resize(width, height);
          }
        }
      }
    });

    this.resizeObserver.observe(this.container);
  }

  /**
   * resizes both renderers
   * @param {number} width - new width
   * @param {number} height - new height
   */
  resize(width, height) {
    this.webglRenderer.setSize(width, height);
    this.cssRenderer.setSize(width, height);
  }

  /**
   * renders the scene with both renderers
   * @param {THREE.Scene} scene - scene to render
   * @param {THREE.Camera} camera - camera to use
   */
  render(scene, camera) {
    this.webglRenderer.render(scene, camera);
    this.cssRenderer.render(scene, camera);
  }

  /**
   * enable or disable high performance mode
   * @param {boolean} enabled - whether to enable high performance mode
   */
  setHighPerformanceMode(enabled) {
    if(this.options.highPerformanceMode === enabled) return;

    this.options.highPerformanceMode = enabled;

    this.webglRenderer.setPixelRatio(enabled ? 1 : window.devicePixelRatio);
    this.webglRenderer.shadowMap.enabled = !enabled;

    // force redraw
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.resize(width, height);
  }

  /**
   * disposes renderer resources
   */
  dispose() {
    if(this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if(this.webglRenderer) {
      this.webglRenderer.dispose();
      if(this.webglRenderer.domElement.parentNode) {
        this.webglRenderer.domElement.parentNode.removeChild(this.webglRenderer.domElement)
      }
    }

    if(this.cssRenderer && this.cssRenderer.domElement.parentNode) {
      this.cssRenderer.domElement.parentNode.removeChild(this.cssRenderer.domElement);
    }
  }
}
