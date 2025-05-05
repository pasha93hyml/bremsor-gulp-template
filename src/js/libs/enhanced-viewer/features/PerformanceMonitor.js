/**
 * Monitors and displays performance metrics
 */
export class PerformanceMonitor {
  /**
   * Creates a new performance monitor
   * @param {HTMLElement} container - Container to append the FPS counter to
   */
  constructor(container) {
    this.container = container;
    this.visible = true;

    this.fpsElement = this._createFPSCounter();
    this.container.appendChild(this.fpsElement);

    this.frames = 0;
    this.lastTime = performance.now();
    this.fps = 0;

    // For frame timing
    this.frameStartTime = 0;
    this.frameTimes = [];
    this.maxFrameTimes = 60; // Store last 60 frames
  }

  /**
   * Creates the FPS counter
   * @private
   * @returns {HTMLElement} The FPS counter element
   */
  _createFPSCounter() {
    const element = document.createElement("div");
    element.style.position = "absolute";
    element.style.top = "10px";
    element.style.right = "10px";
    element.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    element.style.color = "white";
    element.style.padding = "5px 10px";
    element.style.borderRadius = "4px";
    element.style.fontFamily = "monospace";
    element.style.fontSize = "12px";
    element.style.zIndex = "100";
    element.style.display = this.visible ? "block" : "none";
    element.textContent = "FPS: --";

    return element;
  }

  beginFrame() {
    this.frameStartTime = performance.now();
  }

  endFrame() {
    const now = performance.now();
    const frameTime = now - this.frameStartTime;


    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxFrameTimes) {
      this.frameTimes.shift();
    }

    this.frames++;

    if (now - this.lastTime >= 500) {

      this.fps = Math.round((this.frames * 1000) / (now - this.lastTime));


      const avgFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;


      if (this.visible) {
        this.fpsElement.textContent = `FPS: ${this.fps} | Frame: ${avgFrameTime.toFixed(1)}ms`;
      }


      this.frames = 0;
      this.lastTime = now;
    }
  }

  /**
   * Sets the visibility of the FPS counter
   * @param {boolean} visible - Whether the counter should be visible
   */
  setVisible(visible) {
    this.visible = visible;
    this.fpsElement.style.display = visible ? "block" : "none";
  }

  /**
   * Disposes
   */
  dispose() {
    if (this.fpsElement && this.fpsElement.parentNode) {
      this.fpsElement.parentNode.removeChild(this.fpsElement);
    }

    this.fpsElement = null;
    this.container = null;
    this.frameTimes = [];
  }
}