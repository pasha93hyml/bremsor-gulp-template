import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class AutoRotation {
  /**
   * creates autorotation controller
   * @param {OrbitControls} controls - orbit controls to manage
   * @param {HTMLElement} container - container element for hover detection
   * @param {Object} options - configuration options
   * @param {boolean} [options.enabled=true] - whether autorotation is enabled
   * @param {number} [options.speed=3.0] - autorotation speed
   * @param {boolean} [options.pauseOnHover=true] - pause rotation on hover
   */
  constructor(controls, container, options = {}) {
    this.controls = controls;
    this.container = container;
    this.options = {
      enabled: true,
      speed: 3.0,
      pauseOnHover: true,
      ...options,
    };

    this.wasAutoRotating = this.options.enabled;

    this._applySettings();

    if (this.options.pauseOnHover) {
      this._setupHoverPause();
    }
  }

  /**
   * applies current settings to the controls
   * @private
   */
  _applySettings() {
    if (!this.controls) return;

    this.controls.autoRotate = this.options.enabled;
    this.controls.autoRotateSpeed = this.options.speed;
  }

  /**
   * setup listeners to pause on hover
   * @private
   */
  _setupHoverPause() {
    if (!this.container || !this.controls) return;

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
  }

  /**
   * enable or disable autorotation
   * @param {boolean} enabled - whether autorotation should be enabled
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
    this.wasAutoRotating = enabled;
    this.controls.autoRotate = enabled;
  }

  /**
   * sets autorotation speed
   * @param {number} speed - rotation speed
   */
  setSpeed(speed) {
    this.options.speed = speed;
    this.controls.autoRotateSpeed = speed;
  }

  /**
   * enable or disable pause on hover
   * @param {boolean} enabled - whether to pause on hover
   */

  setPauseOnHover(enabled) {
    if(this.options.pauseOnHover === enabled) return;

    this.options.pauseOnHover = enabled

    if(enabled) {
      this._setupHoverPause()
    } else {
      this._removeHoverPause()
    }
  }

  /**
   * removes hover pause
   * @private
   */
  _removeHoverPause() {
    if(!this.container || !this.boundOnMouseEnter || !this.boundOnMouseLeave) return;

    this.container.removeEventListener('mouseenter', this.boundOnMouseEnter)
    this.container.removeEventListener('mouseleave', this.boundOnMouseLeave)

    this.boundOnMouseEnter = null;
    this.boundOnMouseLeave = null;
  }

  /**
   * dispose resources
   */
  dispose() {
    this._removeHoverPause()
    this.controls = null;
    this.container = null;
  }
}
