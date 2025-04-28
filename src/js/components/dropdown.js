export class Dropdown {
  constructor(wrap) {
    this.wrap = wrap;
    this.trigger = this.wrap.querySelector(".js-dropdown-trigger");
    this.name = this.trigger.dataset.dropdownTarget;
    this.dropdown = this.wrap.querySelector(`[data-dropdown=${this.name}]`);
    this.triggerText = this.trigger.querySelector(".js-dropdown-trigger-text");
    this.input = this.wrap.querySelector(".js-dropdown-input");
    this.circles = this.wrap.querySelectorAll(".js-select-circle");
    this.options = this.wrap.querySelectorAll(".js-select-option");
    this.isActive = false;
    this.#init();
  }

  handleActivity = () => {
    this.trigger.classList[this.isActive ? "remove" : "add"]("active");
    this.dropdown.classList[this.isActive ? "remove" : "add"]("active");
    this.isActive = !this.isActive;
  };

  close = () => {
    this.trigger.classList.remove("active");
    this.dropdown.classList.remove("active");
    this.isActive = false;
  };

  handleOutsideClick = (event) => {
    const isCurrent = event.target.closest(
      `.js-dropdown-wrap[data-dropdown="${this.name}"]`,
    );
    if (!isCurrent) {
      this.close();
    }
  };

  handleOptionClick = (event) => {
    const option = event.currentTarget.dataset.option;
    this.triggerText.innerText = option;
    this.input.value = option;
    this.circles.forEach((circle) => {
      circle.classList.remove("opacity-100");
      circle.classList.add("opacity-0");
    });
    const activeCircle = event.currentTarget.querySelector(".js-select-circle");
    activeCircle.classList.remove("opacity-0");
    activeCircle.classList.add("opacity-100");
    this.handleActivity();
  };

  destroy() {
    this.trigger.removeEventListener("click", this.handleActivity);
    this.options.forEach((option) => {
      option.removeEventListener("click", this.handleOptionClick);
    });
    window.removeEventListener("click", this.handleOutsideClick);
  }

  #init() {
    this.trigger.addEventListener("click", this.handleActivity);
    this.options.forEach((option) => {
      option.addEventListener("click", this.handleOptionClick);
    });
    window.addEventListener("click", this.handleOutsideClick);
  }
}
