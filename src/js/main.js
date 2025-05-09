import * as THREE from "three";
import Plyr from "plyr";
import KeenSlider from "keen-slider";
import "img-comparison-slider";

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
import { CustomBtn } from "./components/custom-btn.js";

import { ModelViewer } from "./libs/enhanced-viewer/viewer.js";

import "./libs/aos.js";

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

  const customBtns = document.querySelectorAll(".js-custom-goto-btn");
  if (customBtns && customBtns.length) {
    customBtns.forEach((btn) => {
      new CustomBtn(btn);
    });
  }

  const modelContainer = document.querySelector(".js-model-viewer");
  if (modelContainer) {
    const isMobile = window.innerWidth < 786;

    const viewerConfig = {
      container: modelContainer,
      modelPath: modelContainer.dataset.model,
      shouldDisappear: true,
      options: {
        enableAutoRotate: false,
        autoRotateSpeed: 1.0,
        pauseRotationOnHover: false,
        enableZoom: false,
        defaultZoom: isMobile ? 1.2 : 1.0,
        highPerformanceMode: true,
        showFPS: false,
        hideAnnotationsBehindModel: false,
        enableLOD: true,
        debugMode: false,
      },
    };

    try {
      const viewer = new ModelViewer(viewerConfig);

      viewer.loadPromise.then(() => {
        // viewer.addAnnotation({
        //   position: new THREE.Vector3(0, 0, 0),
        //   htmlContent: `<div class="annotation-wrap-1">
        //     <p>Custom logo</p>
        //     <div class="annotation-svg-container">
        //       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        //         <g class="annotation-svg">
        //           <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" />
        //         </g>
        //       </svg>
        //     </div>
        //   </div>`,
        //   cssClass: "model-annotation-3d",
        //   faceCamera: true,
        //   id: "logo",
        // });
        // viewer.addAnnotation({
        //   position: new THREE.Vector3(0.0980, 0.1058, 0.1328),
        //   htmlContent: `<div class="annotation-wrap-2">
        //     <p>Unique shape</p>
        //     <div class="annotation-svg-container">
        //       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        //         <g class="annotation-svg">
        //           <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" />
        //         </g>
        //       </svg>
        //     </div>
        //   </div>`,
        //   cssClass: "model-annotation-3d",
        //   faceCamera: true,
        //   id: "shape",
        // });
        // viewer.addAnnotation({
        //   position: new THREE.Vector3(0.0467, 0.1042, 0.2661),
        //   htmlContent: `<div class="annotation-wrap-3">
        //     <p>Color of your choice</p>
        //     <div class="annotation-svg-container">
        //       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        //         <g class="annotation-svg">
        //           <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" />
        //         </g>
        //       </svg>
        //     </div>
        //   </div>`,
        //   cssClass: "model-annotation-3d clickable-annotation js-model-color-change",
        //   faceCamera: true,
        //   id: "color",
        // });
      });
    } catch (err) {
      console.log("Failed to initialize ModelViewer:", err);
    }

    // lazyLoading(modelContainers, viewer);
  }
});
