export class CustomBtn {
  constructor(btn) {
    this.btn = btn;
    this.elementToScroll = document.querySelector(
      `[data-name="${btn.dataset.goto}"]`,
    );
    this.top = this.elementToScroll.getBoundingClientRect().top
    this.#init();
  }

  handleBtnClick = (event) => {
    window.scrollTo({
      top: this.top - 80,
      behavior: "smooth",
    });
  };

  destroy() {
    this.btn.removeEventListener('click', this.handleBtnClick)
  }

  #init() {
    this.btn.addEventListener('click', this.handleBtnClick)
  }
}
