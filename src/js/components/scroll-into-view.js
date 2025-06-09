export class ScrollIntoView {
  constructor(btn) {
    this.btn = btn;
    this.target = document.querySelector(
      `[data-step='${this.btn.dataset.target}']`,
    );

    this._init();
  }

  _init() {
    this.btn.addEventListener("click", this.handleClick);
  }

  handleClick = () => {
    const elementOffset = this.target.offsetTop;
    const headerHeight = document
      .querySelector("header")
      .getBoundingClientRect().height;
    window.scrollTo({
      top: elementOffset - headerHeight,
      behavior: "smooth",
    });
  };
}
