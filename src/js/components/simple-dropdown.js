/**
 * Class representing a simple dropdown component
 * @class
 */
export class SimpleDropdown {
  /**
   * Create a dropdown component
   * @param {Object} config - Configuration options
   * @param {string} config.containerSelector - CSS selector for the dropdown container
   * @param {string} config.triggerSelector - CSS selector for the dropdown trigger button
   * @param {string} config.contentSelector - CSS selector for the dropdown content
   * @param {string} config.optionSelector - CSS selector for the dropdown options
   * @param {string} config.valueSelector - CSS selector for the element displaying the selected value
   * @param {string} config.clearSelector - CSS selector for the clear button
   * @param {string} config.activeClass - Class to add when dropdown is open
   * @param {number} config.animationDuration - Duration of open/close animation in ms
   */
  constructor(config) {
    this.config = {
      containerSelector: '.js-simple-dropdown',
      triggerSelector: '.js-dropdown-trigger',
      contentSelector: '.js-dropdown-content',
      optionSelector: '.js-dropdown-option',
      valueSelector: '.js-dropdown-value',
      clearSelector: '.js-dropdown-clear',
      activeClass: 'active',
      animationDuration: 400,
      ...config
    };

    this.container = document.querySelector(this.config.containerSelector);
    if (!this.container) return;

    this.trigger = this.container.querySelector(this.config.triggerSelector);
    this.content = this.container.querySelector(this.config.contentSelector);
    this.valueElement = this.container.querySelector(this.config.valueSelector);
    this.optionElements = this.container.querySelectorAll(this.config.optionSelector);
    this.clearButton = document.querySelector(this.config.clearSelector);

    this.isOpen = false;
    this.isAnimating = false;
    this.defaultValue = this.trigger?.dataset.defaultValue || '';
    this.currentValue = this.valueElement?.textContent.trim() || '';

    this._boundHandlers = {
      triggerClick: this.#handleTriggerClick.bind(this),
      optionClick: this.#handleOptionClick.bind(this),
      clearClick: this.#handleClearClick.bind(this),
      outsideClick: this.#handleOutsideClick.bind(this),
      keyDown: this.#handleKeyDown.bind(this),
      transitionEnd: this.#handleTransitionEnd.bind(this)
    };

    this.#init();
  }

  /**
   * Initialize the dropdown
   * @private
   */
  #init() {
    if (!this.trigger || !this.content || !this.valueElement) return;

    this.#bindEvents();
  }

  /**
   * Bind event listeners
   * @private
   */
  #bindEvents() {
    this.trigger.addEventListener('click', this._boundHandlers.triggerClick);

    this.optionElements.forEach(option => {
      option.addEventListener('click', this._boundHandlers.optionClick);
    });

    if (this.clearButton) {
      this.clearButton.addEventListener('click', this._boundHandlers.clearClick);
    }

    document.addEventListener('click', this._boundHandlers.outsideClick);
    document.addEventListener('keydown', this._boundHandlers.keyDown);
    this.content.addEventListener('transitionend', this._boundHandlers.transitionEnd);
  }

  /**
   * Handle trigger button click
   * @param {Event} event - Click event
   * @private
   */
  #handleTriggerClick(event) {
    event.stopPropagation();
    if (this.isAnimating) return;
    this.#toggleDropdown();
  }

  /**
   * Handle option click
   * @param {Event} event - Click event
   * @private
   */
  #handleOptionClick(event) {
    const option = event.currentTarget;
    const value = option.dataset.value;

    this.setValue(value);
    this.close();

    this.container.dispatchEvent(new CustomEvent('valueChange', {
      detail: { value }
    }));
  }

  /**
   * Handle clear button click
   * @param {Event} event - Click event
   * @private
   */
  #handleClearClick() {
    this.resetToDefault();
    this.container.dispatchEvent(new CustomEvent('valueReset'));
  }

  /**
   * Handle clicks outside the dropdown
   * @param {Event} event - Click event
   * @private
   */
  #handleOutsideClick(event) {
    if (this.isOpen && !this.container.contains(event.target)) {
      this.close();
    }
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  #handleKeyDown(event) {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  /**
   * Handle transition end event
   * @param {TransitionEvent} event - Transition event
   * @private
   */
  #handleTransitionEnd(event) {
    if (event.propertyName === 'grid-template-rows') {
      this.isAnimating = false;
    }
  }

  /**
   * Toggle dropdown open/closed state
   * @private
   */
  #toggleDropdown() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Rotate the dropdown icon
   * @param {boolean} open - Whether the dropdown is open
   * @private
   */
  #rotateIcon(open) {
    const dropdownIcon = this.trigger.querySelector('.dropdown-icon');
    if (dropdownIcon) {
      dropdownIcon.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  }

  /**
   * Set animation safety timeout
   * @private
   */
  #setAnimationSafetyTimeout() {
    setTimeout(() => {
      if (this.isAnimating) {
        this.isAnimating = false;
      }
    }, this.config.animationDuration + 50);
  }

  /**
   * Open the dropdown
   * @returns {this}
   * @public
   */
  open() {
    if (this.isOpen || this.isAnimating) return this;

    this.isAnimating = true;
    this.isOpen = true;

    this.container.classList.add(this.config.activeClass);
    this.#rotateIcon(true);
    this.content.classList.add(this.config.activeClass);

    this.#setAnimationSafetyTimeout();
    return this;
  }

  /**
   * Close the dropdown
   * @returns {this}
   * @public
   */
  close() {
    if (!this.isOpen || this.isAnimating) return this;

    this.isAnimating = true;
    this.isOpen = false;

    this.container.classList.remove(this.config.activeClass);
    this.#rotateIcon(false);
    this.content.classList.remove(this.config.activeClass);

    this.#setAnimationSafetyTimeout();
    return this;
  }

  /**
   * Set the dropdown value
   * @param {string} value - New value to set
   * @returns {this}
   * @public
   */
  setValue(value) {
    this.currentValue = value;
    this.valueElement.textContent = value;

    this.optionElements.forEach(option => {
      const isActive = option.dataset.value === value;
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    return this;
  }

  /**
   * Reset to default value
   * @returns {this}
   * @public
   */
  resetToDefault() {
    return this.setValue(this.defaultValue);
  }

  /**
   * Destroy the dropdown and clean up event listeners
   * @returns {void}
   * @public
   */
  destroy() {
    if (!this.container) return;

    this.trigger.removeEventListener('click', this._boundHandlers.triggerClick);

    this.optionElements.forEach(option => {
      option.removeEventListener('click', this._boundHandlers.optionClick);
    });

    if (this.clearButton) {
      this.clearButton.removeEventListener('click', this._boundHandlers.clearClick);
    }

    document.removeEventListener('click', this._boundHandlers.outsideClick);
    document.removeEventListener('keydown', this._boundHandlers.keyDown);
    this.content.removeEventListener('transitionend', this._boundHandlers.transitionEnd);

    // Reset state
    this.container.classList.remove(this.config.activeClass);
    this.content.classList.remove(this.config.activeClass);
    this.#rotateIcon(false);

    // Clear references
    this.container = null;
    this.trigger = null;
    this.content = null;
    this.valueElement = null;
    this.optionElements = null;
    this.clearButton = null;
  }
}

