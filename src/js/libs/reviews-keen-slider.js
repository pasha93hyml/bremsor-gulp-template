export const reviewsKeenSliderInit = (SliderInstance) => {
  const sliderElement = document.querySelector("#reviews-slider");
  // const prevButton = document.querySelector("#reviews-slider-prev");
  // const nextButton = document.querySelector("#reviews-slider-next");
  const dotsContainer = document.querySelector("#reviews-slider-dots");

  let keenSliderInstance = null;

  if (sliderElement) {

    const updateDots = () => {
      if (!dotsContainer || !keenSliderInstance) return;

      const slideCount = keenSliderInstance.track.details.slides.length;
      const currentSlide = keenSliderInstance.track.details.rel;

      dotsContainer.innerHTML = "";

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
        dot.innerHTML = '<span class="w-2 h-2 bg-white rounded-full"></span>';
        dot.addEventListener("click", () => {
          keenSliderInstance?.moveToIdx(i);
        });
        dotsContainer.appendChild(dot);
      }
    };

    keenSliderInstance = new SliderInstance(sliderElement, {
      loop: true,
      slides: {
        perView: 3,
        spacing: 24,
      },
      breakpoints: {
        "(max-width: 1024px)": {
          slides: {
            perView: 2,
            spacing: 16,
          },
        },
        "(max-width: 768px)": {
          slides: {
            perView: 1,
            spacing: 12,
          },
        },
      },

      created(slider) {
        setTimeout(updateDots, 100)
      },
      slideChanged(slider) {
        updateDots();
      },
    });

    // prevButton?.addEventListener("click", () => keenSliderInstance?.prev());
    // nextButton?.addEventListener("click", () => keenSliderInstance?.next());
  }
};
