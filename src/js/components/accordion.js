export class AccordionItem {
  constructor(item) {
    this.item = item;
    this.header = item.querySelector(".accordion-header");
    this.title = item.querySelector(".accordion-title");
    this.content = item.querySelector(".accordion-content");
    this.plusIcon = item.querySelector(".plus-icon");
    this.minusIcon = item.querySelector(".minus-icon");

    this.isOpen = false;

    this._init();
  }

  _init() {
    this.item.addEventListener("click", this.handleClick);
  }

  handleClick = () => {
    if (this.isOpen) {
      this.item.classList.remove("accordion-open");
      // this.item.classList.remove("gap-5");
      this.header.setAttribute("aria-expanded", "false");
      this.content.style.maxHeight = "0";
      this.plusIcon.style.opacity = "1";
      this.minusIcon.style.opacity = "0";
      this.title.classList.remove("font-bold");
      this.title.classList.remove("uppercase");
    } else {
      this.item.classList.add("accordion-open");
      // this.item.classList.add("gap-5");
      this.header.setAttribute("aria-expanded", "true");
      this.content.style.maxHeight = this.content.scrollHeight + "px";
      this.plusIcon.style.opacity = "0";
      this.minusIcon.style.opacity = "1";
      this.title.classList.add("font-bold");
      this.title.classList.add("uppercase");
    }
    this.isOpen = !this.isOpen;
  };
}
