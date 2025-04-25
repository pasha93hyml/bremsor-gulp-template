import Plyr from "plyr";

import { initHero } from "./components/hero.js";
import { initHeader } from "./components/header.js";
import { plyrInit } from "./libs/plyr.js";
import { reviewsKeenSliderInit } from "./libs/reviews-keen-slider.js";
import { gridSliderInit } from "./libs/grid-keen-slider.js";
import Loader from "./components/loader.js";

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
});
