import * as THREE from "three";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";

/**
 * Creates a CSS3D annotation object
 * @param {string} htmlContent - HTML content for the annotation
 * @param {THREE.Vector3} position - Position in 3D space
 * @param {string} cssClass - CSS class for styling
 * @param {number} modelScaleFactor - Scale factor to apply
 * @returns {CSS3DObject} The created annotation object
 */
export function createAnnotation(htmlContent, position, cssClass, modelScaleFactor) {
  const element = document.createElement("button");
  element.innerHTML = htmlContent;
  element.className = cssClass;
  element.style.pointerEvents = "auto";
  element.style.cursor = "pointer";
  element.style.transform = 'translateX(150%)';

  const cssObject = new CSS3DObject(element);
  cssObject.position.copy(position);

  const scaleFactor = modelScaleFactor / 5000;
  cssObject.scale.set(scaleFactor, scaleFactor, scaleFactor);

  return cssObject;
}