export const aboutKeenSlider = (KeenSliderInstance) => {
  const gridSliderElement = document.querySelector("#about-slider");
  const prevButton = document.querySelector('#about-slider-prev')
  const nextButton = document.querySelector('#about-slider-next')

  if (gridSliderElement) {
    let aboutKeenSliderInstance = null;

    aboutKeenSliderInstance = new KeenSliderInstance(gridSliderElement, {
      loop: true,
      slides: {
        perView: 3,
        spacing: 0,
      },
    });

    prevButton?.addEventListener("click", () => aboutKeenSliderInstance?.prev());
    nextButton?.addEventListener("click", () => aboutKeenSliderInstance?.next());
  }
};
