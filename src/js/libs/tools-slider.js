export const toolsKeenSlider = (KeenSliderInstance) => {
  const gridSliderElement = document.querySelector("#tools-slider");
  const prevButton = document.querySelector('#tools-slider-prev')
  const nextButton = document.querySelector('#tools-slider-next')

  if (gridSliderElement) {
    let aboutKeenSliderInstance = null;

    aboutKeenSliderInstance = new KeenSliderInstance(gridSliderElement, {
      loop: true,
      slides: {
        perView: 1,
        spacing: 0,
      },
    });

    prevButton?.addEventListener("click", () => aboutKeenSliderInstance?.prev());
    nextButton?.addEventListener("click", () => aboutKeenSliderInstance?.next());
  }
};
