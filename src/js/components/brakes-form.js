export const brakesFormInit = () => {
  const shouldRun =
    document.title.toLowerCase() === "Request Custom Order".toLowerCase();
  if (!shouldRun) return;

  document.querySelectorAll(".image-upload-input").forEach((input) => {
    input.addEventListener("change", function () {
      const container = this.closest(".js-image-upload-field");
      const preview = container.querySelector(".image-preview");
      const previewImg = preview.querySelector(".preview-image");
      const placeholder = container.querySelector(".image-upload-placeholder");

      if (this.files && this.files[0]) {
        const reader = new FileReader();

        reader.onload = function (e) {
          previewImg.src = e.target.result;
          placeholder.style.display = "none";
          preview.style.display = "block";
        };

        reader.readAsDataURL(this.files[0]);
      }
    });

    const removeBtn = input
      .closest(".image-upload-container")
      .querySelector(".remove-image-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        const container = this.closest(".image-upload-container");
        const input = container.querySelector(".image-upload-input");
        const preview = container.querySelector(".image-preview");
        const placeholder = container.querySelector(
          ".image-upload-placeholder",
        );

        input.value = "";
        preview.style.display = "none";
        placeholder.style.display = "block";
      });
    }
  });

  document.querySelectorAll(".file-upload-input").forEach((input) => {
    input.addEventListener("change", function () {
      const container = this.closest(".file-upload-container");
      const preview = container.querySelector(".file-preview");
      const fileName = preview.querySelector(".file-name");
      const placeholder = container.querySelector(".file-placeholder");

      if (this.files && this.files[0]) {
        fileName.textContent = this.files[0].name;
        placeholder.style.display = "none";
        preview.style.display = "block";
      }
    });

    const removeBtn = input
      .closest(".file-upload-container")
      .querySelector(".remove-file-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        const container = this.closest(".file-upload-container");
        const input = container.querySelector(".file-upload-input");
        const preview = container.querySelector(".file-preview");
        const placeholder = container.querySelector(".file-placeholder");

        input.value = "";
        preview.style.display = "none";
        placeholder.style.display = "block";
      });
    }
  });

  document.querySelectorAll(".toggle-color-grid-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const container = this.closest(".color-selector-container");
      const grid = container.querySelector(".color-grid-container");

      if (grid.style.display === "none") {
        grid.style.display = "block";
        this.textContent = "Hide Colors";
      } else {
        grid.style.display = "none";
        this.textContent = "Show Colors";
      }
    });
  });
};
