import Plyr from "plyr";

import { initHero } from "./components/hero.js";
import { initHeader } from "./components/header.js";
import { plyrInit } from "./libs/plyr.js";
import { reviewsKeenSliderInit } from "./libs/reviews-keen-slider.js";
import { gridSliderInit } from "./libs/grid-keen-slider.js";
import { brakesFormInit } from "./components/brakes-form.js";
import Loader from "./components/loader.js";
import { Dropdown } from "./components/dropdown.js";
import { ImageUpload } from "./components/image-upload.js";
import { ColorPick } from "./components/color-pick.js";
import { Form } from "./components/form.js";

import "img-comparison-slider";
import "./libs/aos.js";
import KeenSlider from "keen-slider";

window.siteLoader = new Loader();

document.addEventListener("DOMContentLoaded", () => {
  window.siteLoader.init();
  new Loader();
  initHeader();
  initHero();
  plyrInit(Plyr);
  reviewsKeenSliderInit(KeenSlider);
  gridSliderInit(KeenSlider);
  brakesFormInit();

  const dropdowns = document.querySelectorAll(".js-dropdown-wrap");
  dropdowns.forEach((trigger) => {
    new Dropdown(trigger);
  });

  const imageUploadContainers = document.querySelectorAll(
    ".js-image-upload-field",
  );
  imageUploadContainers.forEach((container) => {
    new ImageUpload(container);
  });

  const colorPickerField = document.querySelector(".js-color-selector-field");
  if (colorPickerField) {
    new ColorPick(colorPickerField);
  }

  const forms = document.querySelectorAll(".js-form");
  if (forms && forms.length) {
    forms.forEach((form) => {
      new Form(form);
    });
  }
});
