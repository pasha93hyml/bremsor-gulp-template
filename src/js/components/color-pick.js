import {log} from "three/tsl";

export class ColorPick {
  constructor(wrap) {
    this.wrap = wrap;
    this.input = wrap.querySelector(".js-color-value-input");
    this.container = wrap.querySelector(".js-select-color-container");
    this.previewText = wrap.querySelector(".js-select-color-preview-text");
    this.resultContainer = wrap.querySelector(".js-select-color-selected");
    this.selectedBg = this.resultContainer.querySelector(
      ".js-selected-color-bg",
    );
    this.selectedText = this.resultContainer.querySelector(
      ".js-selected-color-label",
    );
    this.btn = wrap.querySelector(".js-toggle-color-grid-btn");
    this.btnOpenIcon = this.btn.querySelector("svg");
    this.btnCloseIcon = this.btn.querySelector(".js-close-icon");
    this.btnText = this.btn.querySelector(".js-toggle-color-picked-text");
    this.dropdown = wrap.querySelector(".js-colors-dropdown");

    this.currentActive = null;
    this.isCurrentActiveDefault = null;

    this.isOpen = null;
    this.isSelected = false;

    this.#init();
  }

  checkAndScroll = () => {
    const rect = this.wrap.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.top <= window.innerHeight;

    if(!isVisible || rect.top < 100) {
      const wrapOffsetY = this.wrap.offsetTop;

      window.scrollTo({
        top: wrapOffsetY - 200,
        behavior: 'smooth',
      })
      // window.scrollIntoView({
      //   top: wrapOffsetY - 200,
      //   behavior: 'smooth',
      //   // block: 'center'
      // })
    }
  }

  toggleIcon = () => {
    if (!this.currentActive) {
      this.btnOpenIcon.classList.toggle("opacity-100", !this.isOpen);
      this.btnOpenIcon.classList.toggle("opacity-0", this.isOpen);
    } else {
      this.btnOpenIcon.classList.add("hidden");
      this.btnText.classList.remove("hidden");
    }
    this.btnCloseIcon.classList.toggle("opacity-0", !this.isOpen);
    this.btnCloseIcon.classList.toggle("opacity-110", this.isOpen);
  };

  handleTriggerClick = (event) => {
    this.isOpen = !this.isOpen;
    this.dropdown.classList.toggle("active", this.isOpen);

    if (!this.isSelected) {
      this.toggleIcon();
    } else {
      this.btnOpenIcon.classList.add("hidden");
      this.btnCloseIcon.classList.add("hidden");
    }
  };

  handleBtnPickClick = (button, isDefault = true) => {
    if (this.currentActive) {
      this.currentActive.classList.remove("active");
    }
    if (this.isCurrentActiveDefault !== null) {
      this.currentActive.querySelector(".js-select-border-wrap").style.border =
        "none";
    }

    const { color, value } = button.dataset;
    this.previewText.classList.add("hidden");
    this.resultContainer.classList.remove("hidden");
    this.resultContainer.classList.add("flex");
    button.classList.add("active");
    this.selectedBg.style.backgroundColor = color;
    this.selectedText.innerText = value;

    if (isDefault) {
      button.querySelector(".js-select-border-wrap").style.border =
        "1px solid #0a0a0a";
      this.isCurrentActiveDefault = true;
    } else {
      this.isCurrentActiveDefault = null;
    }
    this.currentActive = button;
    this.handleTriggerClick();
    this.isSelected = true;

    setTimeout(() => this.checkAndScroll(), 500);
  };

  handleSelect = (event) => {
    const defaultBtn = event.target.closest(".js-default-color-pick-btn");
    const customBtn = event.target.closest(".js-custom-color-pick-btn");

    if (!defaultBtn && !customBtn) return;

    defaultBtn
      ? this.handleBtnPickClick(defaultBtn)
      : this.handleBtnPickClick(customBtn, false);
  };

  handleOutsideClick = (event) => {
    const wrapper = event.target.closest(".js-color-selector-field");
    if (!wrapper && this.isOpen) {
      this.dropdown.classList.remove("active");
      this.isOpen = false;
      this.toggleIcon();
    }
  };

  destroy = () => {
    this.btn.removeEventListener("click", this.handleTriggerClick);
    this.dropdown.removeEventListener("click", this.handleSelect);
    window.removeEventListener("click", this.handleOutsideClick);
  };

  #init() {
    this.container.addEventListener("click", this.handleTriggerClick);
    this.dropdown.addEventListener("click", this.handleSelect);
    window.addEventListener("click", this.handleOutsideClick);
  }
}
