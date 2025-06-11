import * as THREE from "three";
import Plyr from "plyr";
import KeenSlider from "keen-slider";
import "img-comparison-slider";

import { initHero } from "./components/hero.js";
import { initHeader } from "./components/header.js";
import { plyrInit } from "./libs/plyr.js";
import { reviewsKeenSliderInit } from "./libs/reviews-keen-slider.js";
import { gridSliderInit } from "./libs/grid-keen-slider.js";
import Loader from "./components/loader.js";
import { Dropdown } from "./components/dropdown.js";
import { ImageUpload } from "./components/image-upload.js";
import { ColorPick } from "./components/color-pick.js";
import { Form } from "./components/form.js";
import { CustomBtn } from "./components/custom-btn.js";
import { comparisonSliderInitAnimation } from "./libs/img-comparsion-slider.js";
import { initModals } from "./components/modal.js";

import { ImageAnnotationSystem } from "./components/custom-caliper.js";
import { Pagination } from "./components/pagination.js";
import { SimpleDropdown } from "./components/simple-dropdown.js";
import { SearchList } from "./components/search-list.js";
import { SimpleImageUpload } from "./components/simple-images-upload.js";
import { aboutKeenSlider } from "./libs/about-slider.js";
import { toolsKeenSlider } from "./libs/tools-slider.js";
import { ScrollIntoView } from "./components/scroll-into-view.js";
import { AccordionItem } from "./components/accordion.js";

import { ModelViewer } from "./libs/enhanced-viewer/viewer.js";

import "./libs/aos.js";

window.siteLoader = new Loader();

let viewportHeight = window.innerHeight;
const vh = viewportHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}px`);

document.addEventListener("DOMContentLoaded", () => {
  const headerHeight = document
    .querySelector("header")
    .getBoundingClientRect().height;
  document.documentElement.style.setProperty(
    "--header-height",
    `${headerHeight}px`,
  );

  window.siteLoader.init();
  new Loader();
  initHeader();
  initHero();
  initModals();
  plyrInit(Plyr);
  reviewsKeenSliderInit(KeenSlider);
  gridSliderInit(KeenSlider);
  aboutKeenSlider(KeenSlider);
  toolsKeenSlider(KeenSlider);
  comparisonSliderInitAnimation();

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

  const cashbackBtnElement = document.querySelector(".js-cashback-btn");

  const modelContainer = document.querySelector(".js-model-viewer");
  if (modelContainer) {
    const isMobile = window.innerWidth < 786;

    const viewerConfig = {
      container: modelContainer,
      modelPath: modelContainer.dataset.model,
      options: {
        enableAutoRotate: false,
        autoRotateSpeed: 1.0,
        pauseRotationOnHover: false,
        enableZoom: false,
        defaultZoom: isMobile ? 1.2 : 1.0,
        highPerformanceMode: false,
        showFPS: false,
        hideAnnotationsBehindModel: false,
        enableLOD: false,
        debugMode: false,
        initialCameraPosition: new THREE.Vector3(1.128, 1.205, 1.124),
        initialCameraTarget: new THREE.Vector3(0.0, 0.0, 0.0),
      },
    };

    try {
      const viewer = new ModelViewer(viewerConfig);

      const logoPosition = new THREE.Vector3(-0.85, 0.2, 0.1902);
      const shapePosition = new THREE.Vector3(0.85, 0.4, 0.1461);
      const colorPosition = new THREE.Vector3(-0.1, -0.8, 0.5);

      viewer.loadPromise.then(() => {
        viewer.annotationManager.addResponsiveAnnotation({
          htmlContent: `
            <span class="">Custom logo</span>
            <span class="annotation-circle">
            </span>
        `,
          modelPosition: logoPosition,
          cssClass:
            "static-annotation text-small lg:text-base text-white flex items-center justify-between gap-5 group transition duration-300 ease",
          id: "info-panel-1",
        });

        viewer.annotationManager.addResponsiveAnnotation({
          htmlContent: `
            <span class="">Unique shape</span>
            <span class="annotation-circle">
            </span>
        `,
          modelPosition: shapePosition, // Use 3D position from the model
          cssClass:
            "static-annotation text-small lg:text-base text-white flex flex-row-reverse items-center justify-between gap-5 group transition duration-300 ease",
          id: "info-panel-2",
        });

        viewer.annotationManager.addResponsiveAnnotation({
          htmlContent: `
            <span class="">Color of your choice</span>
            <span class="annotation-circle">
            </span>
          `,
          modelPosition: colorPosition, // Use 3D position from the model
          cssClass:
            "static-annotation text-small lg:text-base text-white flex items-center justify-between gap-5 group transition duration-300 ease",
          id: "info-panel-3",
        });
      });
    } catch (err) {
      console.log("Failed to initialize ModelViewer:", err);
    }

    // lazyLoading(modelContainers, viewer);
  }

  const customCaliperContainer = document.querySelector(
    ".js-custom-caliper-container",
  );
  if (customCaliperContainer) {
    const initCaliperDots = () => {
      const isSmallContainer =
        customCaliperContainer.classList.contains("js-smaller-offset");
      if (isSmallContainer) {
        const isMobile = window.innerWidth < 576;
        new ImageAnnotationSystem({
          imageContainerClass: "js-custom-caliper-container",
          svgId: "annotation-svg",
          annotations: [
            {
              dotId: "dot1",
              lineColor: "white",
              lineWidth: 1,
              targetOffset: { x: isMobile ? 30 : 55, y: isMobile ? 40 : 35 },
            },
            {
              dotId: "dot2",
              lineColor: "white",
              lineWidth: 1,
              targetOffset: {
                x: isMobile ? -30 : -30,
                y: isMobile ? -40 : -40,
              },
            },
            {
              dotId: "dot3",
              lineColor: "white",
              lineWidth: 1,
              targetOffset: { x: isMobile ? 30 : 40, y: isMobile ? -40 : -30 },
            },
          ],
        }).initialize();
      } else {
        const isMobile = window.innerWidth < 768;
        new ImageAnnotationSystem({
          imageContainerClass: "js-custom-caliper-container",
          svgId: "annotation-svg",
          annotations: [
            {
              dotId: "dot1",
              lineColor: "white",
              lineWidth: 1,
              targetOffset: { x: isMobile ? 30 : 60, y: isMobile ? 40 : 60 },
            },
            {
              dotId: "dot2",
              lineColor: "white",
              lineWidth: 1,
              targetOffset: {
                x: isMobile ? -30 : -60,
                y: isMobile ? -40 : -50,
              },
            },
            {
              dotId: "dot3",
              lineColor: "white",
              lineWidth: 1,
              targetOffset: { x: isMobile ? 30 : 60, y: isMobile ? -40 : -50 },
            },
          ],
        }).initialize();
      }
    };
    const dotsPromise = new Promise((res, rej) => {
      res(initCaliperDots);
    });
    setTimeout(() => dotsPromise.then((func) => func()), 1000);
  }

  const paginationContainers = document.querySelectorAll(
    ".js-pagination-container",
  );
  if (paginationContainers) {
    const isMobile = window.innerWidth < 576;
    paginationContainers.forEach((container) => {
      let textColor = "white";
      const totalPages = parseInt(container.dataset.pages, 10);
      const visiblePages = parseInt(container.dataset.visible, 10);
      if (container.dataset.color) {
        textColor = container.dataset.color;
      }
      new Pagination(container, {
        totalPages,
        currentPage: 1,
        visiblePages: isMobile ? 4 : visiblePages,
        containerSelector: ".js-pagination-container",
        isMobile: isMobile,
        textColor,
      });

      // add some logic at page change
      container.addEventListener("pageChange", (e) => {
        console.log(`Page changed to: ${e.detail.page}`);
      });
    });
  }

  const dropdownContainers = document.querySelectorAll(".js-simple-dropdown");
  if (dropdownContainers && dropdownContainers.length > 0) {
    Array.from(dropdownContainers).map((container, index) => {
      new SimpleDropdown(container, {
        containerSelector: `.js-simple-dropdown:nth-of-type(${index + 1})`,
      });

      container.addEventListener("valueChange", (e) => {
        console.log(`Dropdown value changed to: ${e.detail.value}`);
      });

      container.addEventListener("valueReset", () => {
        console.log("Dropdown value reset to default");
      });
    });
  }

  const searchInputs = document.querySelectorAll(".js-searchlist-input");
  if (searchInputs && searchInputs.length > 0) {
    searchInputs.forEach((input) => {
      new SearchList(input);
    });
  }

  const imageUploadButtons = document.querySelectorAll(
    ".js-simple-image-upload",
  );
  if (imageUploadButtons && imageUploadButtons.length > 0) {
    imageUploadButtons.forEach((btn) => {
      new SimpleImageUpload(btn);
    });
  }

  const scrollToBtns = document.querySelectorAll(".js-scroll-down-btn");
  if (scrollToBtns && scrollToBtns.length > 0) {
    scrollToBtns.forEach((btn) => {
      new ScrollIntoView(btn);
    });
  }

  const accordionItems = document.querySelectorAll(".js-accordion-item");
  if (accordionItems && accordionItems.length > 0) {
    accordionItems.forEach((item) => {
      new AccordionItem(item);
    });
  }
});
