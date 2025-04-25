export default class Loader {
  constructor() {
    this.loader = document.getElementById("site-loader");
    this.progressBar = document.getElementById("loader-progress-bar");
    this.progressText = document.getElementById("loader-progress-text");
    this.isLoading = true;
    this.progress = 0;
    this.maxProgress = 99;
    this.speed = 10;
    this.step = 1;
    this.interval = null;
  }

  init() {
    if (!this.loader) return;
    this.startProgress();

    window.addEventListener("load", () => {
      this.completeProgress();
    });
  }

  startProgress() {
    this.loader.style.display = "flex";
    document.body.style.overflow = "hidden";
    document.body.classList.add("lock-scroll");

    this.interval = setInterval(() => {
      if (this.progress < 80) {
        this.progress += this.step;
        this.updateProgress();
      }
    }, this.speed);
  }

  completeProgress() {
    clearInterval(this.interval);
    document.body.classList.remove("lock-scroll");

    this.interval = setInterval(() => {
      if (this.progress < this.maxProgress) {
        this.progress += 2;
        this.updateProgress();
      } else {
        clearInterval(this.interval);
        setTimeout(() => this.hideLoader(), 300);
      }
    }, 20);
  }

  updateProgress() {
    if (this.progressBar) this.progressBar.style.width = `${this.progress}%`;
    if (this.progressText)
      this.progressText.textContent = `${Math.round(this.progress)}%`;
  }

  hideLoader() {
    if (!this.loader) return;

    this.loader.classList.add("opacity-0");

    setTimeout(() => {
      this.loader.style.display = "none";
      document.body.style.overflow = "";
      this.isLoading = false;
    }, 500);
  }

  show() {
    this.progress = 0;
    this.updateProgress();
    this.loader.classList.remove("opacity-0");
    this.loader.style.display = "flex";
    document.body.style.overflow = "hidden";
    this.isLoading = true;
    this.startProgress();
  }

  hide() {
    this.completeProgress();
  }
}
