export class SimpleImageUpload {
  constructor(button) {
    this.button = button;
    this.input = document.querySelector(`[data-name='${button.dataset.target}']`)
    this.text = document.querySelector(`.js-input-image-text[data-target='${button.dataset.target}']`)

    this._init();
  }

  _init() {
   this.button.addEventListener('click', () => this.input.click());
   this.input.addEventListener('change', (e) => this.handleFiles(e))
  }

  handleFiles = (event) => {
    const files = event.target.files;
    if(files.length === 0) {
      this.text.textContent = 'Choose file'
    }

    if(files.length === 1) {
      this.text.textContent = files[0].name
    } else {
      this.text.textContent = `${files.length} files selected`
    }
  }
}