export const gridSliderInit = (KeenSliderInstance) => {
  const gridSliderElement = document.querySelector("#grid-images-slider");
  const gridDotsContainer = document.querySelector("#grid-images-dots");

  if (gridSliderElement && gridDotsContainer) {
    let gridKeenSliderInstance = null;

    const updateGridDots = () => {
      if (!gridDotsContainer || !gridKeenSliderInstance) return;
      const slideCount = gridKeenSliderInstance.track.details.slides.length;
      const currentSlide = gridKeenSliderInstance.track.details.rel;
      gridDotsContainer.innerHTML = "";
      for (let i = 0; i < slideCount; i++) {
        const dot = document.createElement("button");
        dot.classList.add(
          "w-5",
          "h-5",
          "rounded-full",
          "border",
          "flex",
          "items-center",
          "justify-center",
          "transition-all",
          "duration-300",
        );
        dot.classList.add(
          i === currentSlide ? "border-white" : "border-transparent",
        );
        dot.innerHTML =
          '<span class="w-2 h-2 bg-white rounded-full block"></span>';
        dot.addEventListener("click", () =>
          gridKeenSliderInstance?.moveToIdx(i),
        );
        gridDotsContainer.appendChild(dot);
      }
    };

    gridKeenSliderInstance = new KeenSliderInstance(gridSliderElement, {
      loop: true,
      slides: {
        perView: 1,
        spacing: 0,
      },
      created: (slider) => setTimeout(updateGridDots, 100),
      slideChanged: (slider) => updateGridDots(),
    });
  } else if (gridSliderElement && !gridDotsContainer) {
    new KeenSliderInstance(gridSliderElement, {
      loop: false,
      slides: { perView: 1, spacing: 0 },
    });
    console.log("Grid images slider initialized (no dots needed/found).");
  }
};
