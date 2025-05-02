import { ModelViewerCSS3D } from "../libs/threejs/model-viewer.js";
import * as THREE from "three";

/**
 * Initializes and configures a 3D model viewer within a specified container element.
 *
 * This function creates an instance of `ModelViewerCSS3D`, loads a GLB model
 * (path specified via `data-model` attribute on the container or a default path),
 * adds predefined HTML annotations to the loaded model
 * enables a double-click point finding feature for debugging/coordinate identification
 *
 * @param {HTMLElement} container - The DOM element that will host the 3D viewer canvas.
 *   It should have a `data-model` attribute with path to actual model
 * @returns {ModelViewerCSS3D} The initialized instance of the ModelViewerCSS3D class,
 *   allowing further interaction or manipulation if needed.
 */

export const viewer = (container) => {
  const modelPath = container.dataset.model || "/assets/3d/front_only.glb";
  const viewerInstance = new ModelViewerCSS3D(container, modelPath);

  viewerInstance
    .loadPromise
    .then((loadedModel) => {

      const box = new THREE.Box3().setFromObject(loadedModel);
      const size = box.getSize(new THREE.Vector3());

      // Custom annotations array
      const annotations = [
        {
          title: "Custom logo",
          position: [-0.1888, 0.1269, 0.1655],
        },
        {
          title: "Unique shape",
          position: [0.1002, 0.0947, 0.1354],
        },
        {
          title: "Color of your choice",
          position: [0.0532, 0.0624, 0.2849],
        },
      ];

      // annotations initialization
      annotations.forEach((annotation, idx) => {
        const annotationHTML = `
        <div class="annotation-wrap-${idx + 1}">
          <p>${annotation.title}</p>
          <div class="annotation-svg-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <g class="annotation-svg">
                <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" />
              </g>
            </svg>
          </div>
        </div>
      `;

        const position = new THREE.Vector3(...annotation.position);
        viewerInstance.addHtmlAnnotation(
          annotationHTML,
          loadedModel,
          position,
          "model-annotation-3d",
        );
      });

      // Enable point finding by click
      // viewerInstance.enablePointFinding(true);
    })
    .catch((error) => {
      console.error("Failed to load model:", error);
    });

  // Cleanup
  window.addEventListener("beforeunload", () => {
    viewerInstance.dispose();
  });

  return viewerInstance;
};
