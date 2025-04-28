export class Form {
  constructor(formNode) {
    this.form = formNode;
    this.requiredInputs = [
      ...formNode.querySelectorAll('[data-required="true"]'),
    ];

    this.isValid = true;

    this.#init();
  }

  handleSubmit = (event) => {
    event.preventDefault();
    this.isValid = true;
    const formData = new FormData(event.target);
    for (const input of formData) {
      const name = input[0];
      const requiredInput = this.requiredInputs.find(
        (element) => element.dataset.target.toLowerCase() === name,
      );

      if (requiredInput) {
        const isEmpty = !input[1].length;
        if (isEmpty) {
          this.isValid = false;
        }
      }
    }

    if (!this.isValid) return;

    console.log("send data somewhere");
  };

  destroy() {
    this.form.removeEventListener("submit", this.handleSubmit);
  }

  #init() {
    this.form.addEventListener("submit", this.handleSubmit);
  }
}
