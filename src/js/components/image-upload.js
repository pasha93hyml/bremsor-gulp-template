import { fileIcon } from "../icons/file.js";

export class ImageUpload {
  constructor(wrap) {
    this.wrap = wrap;
    this.input = wrap.querySelector(".js-image-upload-input");
    this.preview = wrap.querySelector(".js-image-preview");
    this.previewImage = wrap.querySelector(".js-preview-image");
    this.placeholder = wrap.querySelector(".js-upload-placeholder");
    this.deleteBtn = wrap.querySelector(".js-remove-image-btn");
    this.previewInnerHTML = this.preview.innerHTML;
    this.#init();
  }

  handleClick = (event) => {
    this.input.click();
  };

  updateImageInstance = () => {
    this.previewImage = this.preview.querySelector(".js-preview-image");
  };

  handleDelete = (event) => {
    this.input.value = "";
    this.previewImage.src = "#";
    this.placeholder.style.display = "flex";
    this.preview.style.display = "none";
    this.deleteBtn.classList.add("opacity-0");
    this.deleteBtn.classList.remove("opacity-100");

    this.preview.innerHTML = this.previewInnerHTML;
    this.updateImageInstance();
  };

  handleChange = (event) => {
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (["png", "jpg", "jpeg", "svg", "webp"].includes(fileExtension)) {
        reader.onload = (e) => {
          this.previewImage.src = e.target.result;
          this.placeholder.style.display = "none";
          this.preview.style.display = "flex";
          this.deleteBtn.classList.remove("opacity-0");
          this.deleteBtn.classList.add("opacity-100");
        };
        reader.readAsDataURL(file);
      } else if (fileExtension === "pdf") {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const fileURL = URL.createObjectURL(file);

        if (isMobile) {
          this.preview.innerHTML = `
          <div class="flex flex-col items-center justify-center w-full sm:aspect-1/1 gap-5">
           ${fileIcon()}
          <div class="text-white text-sm text-balance text-center max-w-[200px]">Name: ${file.name}</div>
          </div>`;
        } else {
          this.preview.innerHTML = `
        <div class="rounded-[10px] overflow-hidden w-full h-full aspect-1/1">
          <iframe src="${fileURL}" class="w-full h-full rounded-[10px] overflow-hidden"></iframe>
        </div>`;
        }

        this.placeholder.style.display = "none";
        this.preview.style.display = "flex";
        this.deleteBtn.classList.remove("opacity-0");
        this.deleteBtn.classList.add("opacity-100");
      } else if (fileExtension === "ai") {
        this.preview.innerHTML = `
        <div class="flex flex-col items-center justify-center w-full sm:aspect-1/1 gap-5">
           ${window.innerWidth >= 640 ? fileIcon() : ""}
          <div class="text-white text-sm text-balance text-center max-w-[200px]">Name: ${file.name}</div>
        </div>`;
        this.placeholder.style.display = "none";
        this.preview.style.display = "flex";
        this.deleteBtn.classList.remove("opacity-0");
        this.deleteBtn.classList.add("opacity-100");
      }

    }
  };

  destroy = () => {
    this.placeholder.removeEventListener("click", this.handleClick);
    this.input.removeEventListener("change", this.handleChange);
    this.deleteBtn.removeEventListener("click", this.handleDelete);
  };

  #init() {
    this.placeholder.addEventListener("click", this.handleClick);
    this.input.addEventListener("change", this.handleChange);
    this.deleteBtn.addEventListener("click", this.handleDelete);
  }
}
