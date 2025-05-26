/**
 * @file Manages scroll-triggered animations for DOM elements.
 */

/**
 * Class responsible for animating elements when they scroll into the viewport.
 */
export class ScrollAnimator {
  /**
   * Creates an instance of ScrollAnimator.
   * @param {Object} [options] - Configuration options for the scroll animator.
   * @param {string} [options.selector='.animate-on-scroll'] - The CSS selector for elements to animate.
   * @param {string} [options.animationClass='animated'] - The CSS class to add to trigger the animation.
   * @param {number} [options.offset=100] - The offset from the bottom of the viewport to trigger the animation (in pixels).
   */
  constructor(options = {}) {
    this.options = {
      selector: '.animate-on-scroll',
      animationClass: 'animated',
      offset: 100,
      ...options,
    };

    this.elements = document.querySelectorAll(this.options.selector);
    this._boundAnimateOnScroll = this._animateElements.bind(this);

    this._initialize();
  }

  /**
   * Initializes the scroll animator by adding event listeners and performing an initial check.
   * @private
   */
  _initialize() {
    if (this.elements.length === 0) {
      console.warn(`ScrollAnimator: No elements found with selector "${this.options.selector}".`);
      return;
    }
    this._setupEventListeners();
    document.addEventListener('DOMContentLoaded', this._boundAnimateOnScroll);
    this._animateElements();
  }

  /**
   * Sets up the scroll event listener.
   * @private
   */
  _setupEventListeners() {
    window.addEventListener('scroll', this._boundAnimateOnScroll);
  }

  /**
   * Checks elements and applies animation if they are in the viewport.
   * This method is bound to the class instance for use in event listeners.
   * @private
   */
  _animateElements() {
    const windowHeight = window.innerHeight;

    this.elements.forEach(element => {
      if (element.classList.contains(this.options.animationClass)) {
        return;
      }

      const elementPosition = element.getBoundingClientRect().top;

      if (elementPosition < windowHeight - this.options.offset) {
        element.classList.add(this.options.animationClass);
      }
    });
  }

  /**
   * Removes event listeners and cleans up resources.
   * Call this method when the animator is no longer needed to prevent memory leaks.
   */
  dispose() {
    window.removeEventListener('scroll', this._boundAnimateOnScroll);
    document.removeEventListener('DOMContentLoaded', this._boundAnimateOnScroll);
    this.elements = [];
    console.log('ScrollAnimator disposed.');
  }
}

//init
new ScrollAnimator();
