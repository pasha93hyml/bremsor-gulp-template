// import * as THREE from "three";
//
// export const viewer = (container) => {
//   const modelPath = container.dataset.model || "/assets/3d/opti.glb";
//   const viewerInstance = new ModelViewerCSS3D(container, modelPath);
//
//   // --- Get Debug Control Elements ---
//   const rotXSlider = document.getElementById("rotX");
//   const rotYSlider = document.getElementById("rotY");
//   const rotZSlider = document.getElementById("rotZ");
//   const valXSpan = document.getElementById("valX");
//   const valYSpan = document.getElementById("valY");
//   const valZSpan = document.getElementById("valZ");
//   const copyRotationBtn = document.getElementById("copyRotationBtn");
//   const debugControlsDiv = document.getElementById("debug-controls"); // Get the container
//
//   // Function to update model rotation from sliders
//   function updateRotationFromSliders() {
//     if (!viewerInstance.model) return; // Don't do anything if model isn't loaded
//
//     const rotXDeg = parseFloat(rotXSlider.value.toString());
//     const rotYDeg = parseFloat(rotYSlider.value.toString());
//     const rotZDeg = parseFloat(rotZSlider.value.toString());
//
//     // Update display values
//     valXSpan.textContent = rotXDeg.toFixed(0);
//     valYSpan.textContent = rotYDeg.toFixed(0);
//     valZSpan.textContent = rotZDeg.toFixed(0);
//
//     // Convert degrees to radians and apply to model
//     viewerInstance.model.rotation.x = THREE.MathUtils.degToRad(rotXDeg);
//     viewerInstance.model.rotation.y = THREE.MathUtils.degToRad(rotYDeg);
//     viewerInstance.model.rotation.z = THREE.MathUtils.degToRad(rotZDeg);
//   }
//
//   // Function to update sliders from model rotation
//   function updateSlidersFromRotation() {
//     if (!viewerInstance.model) return;
//
//     const rotXDeg = THREE.MathUtils.radToDeg(viewerInstance.model.rotation.x);
//     const rotYDeg = THREE.MathUtils.radToDeg(viewerInstance.model.rotation.y);
//     const rotZDeg = THREE.MathUtils.radToDeg(viewerInstance.model.rotation.z);
//
//     rotXSlider.value = rotXDeg;
//     rotYSlider.value = rotYDeg;
//     rotZSlider.value = rotZDeg;
//
//     valXSpan.textContent = rotXDeg.toFixed(0);
//     valYSpan.textContent = rotYDeg.toFixed(0);
//     valZSpan.textContent = rotZDeg.toFixed(0);
//   }
//
//   // --- Event Listeners for Sliders ---
//   rotXSlider.addEventListener("input", updateRotationFromSliders);
//   rotYSlider.addEventListener("input", updateRotationFromSliders);
//   rotZSlider.addEventListener("input", updateRotationFromSliders);
//
//   // --- Event Listener for Copy Button ---
//   copyRotationBtn.addEventListener("click", () => {
//     if (!viewerInstance.model) {
//       alert("Model not loaded yet!");
//       return;
//     }
//     const currentRot = viewerInstance.getCurrentRotation(); // Use the existing method
//     if (currentRot) {
//       const [x, y, z] = currentRot;
//       const rotationString = `[${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)}]`;
//
//       navigator.clipboard
//         .writeText(rotationString)
//         .then(() => {
//           // Success feedback
//           const originalText = copyRotationBtn.textContent;
//           copyRotationBtn.textContent = "Copied!";
//           copyRotationBtn.style.backgroundColor = "#90ee90"; // Light green
//           setTimeout(() => {
//             copyRotationBtn.textContent = originalText;
//             copyRotationBtn.style.backgroundColor = "";
//           }, 1500); // Reset after 1.5 seconds
//         })
//         .catch((err) => {
//           console.error("Failed to copy rotation: ", err);
//           alert("Failed to copy rotation. See console for details.");
//         });
//     }
//   });
//
//   // --- Get Current Location Button (Your existing code) ---
//   const getCurrentLocationBtn = document.querySelector(".js-get-location-btn");
//   if (getCurrentLocationBtn) {
//     // Check if button exists
//     getCurrentLocationBtn.addEventListener("click", (e) => {
//       // Use getViewState for camera/target, getCurrentRotation for model's own rotation
//       const currentView = viewerInstance.getViewState();
//       const currentModelRot = viewerInstance.getCurrentRotation();
//
//       if (currentView) {
//         console.log("Current View State:", currentView);
//         console.log(
//           "Camera Position:",
//           currentView.cameraPosition.map((v) => v.toFixed(4)),
//         );
//         console.log(
//           "Controls Target:",
//           currentView.controlsTarget.map((v) => v.toFixed(4)),
//         );
//       }
//       if (currentModelRot) {
//         const [x, y, z] = currentModelRot;
//         console.log(
//           `Current Model Rotation (radians): [${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)}]`,
//         );
//       }
//     });
//   }
//
//   // --- Load Model and THEN Initialize Sliders ---
//   viewerInstance
//     .loadModel()
//     .then((loadedModel) => {
//       console.log(
//         "Model ready, adding annotations and initializing debug controls...",
//       );
//
//       // --- Initialize Slider Positions from Model's Initial Rotation ---
//       updateSlidersFromRotation(); // Set sliders to match the model's state after loading
//
//       // --- Add Annotations (Your existing code) ---
//       const box = new THREE.Box3().setFromObject(loadedModel);
//       const size = box.getSize(new THREE.Vector3());
//       const topCenterPos = new THREE.Vector3(0, size.y / 2, 0);
//       const annotationHTML = `
//         <p>Custom logo</p>
//         <div class="annotation-svg-container">
//           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
//           <g class="annotation-svg">
//             <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2" stroke-linecap="round" />
//           </g>
//           </svg>
//         </div>
//       `;
//       const position1 = new THREE.Vector3(-0.2022, 0.2118, 0.1904);
//       viewerInstance.addHtmlAnnotation(
//         annotationHTML,
//         loadedModel,
//         position1,
//         "model-annotation-3d",
//       );
//
//       // Enable point finding if needed
//       // viewerInstance.enablePointFinding(true);
//     })
//     .catch((error) => {
//       console.error("Failed to load model:", error);
//       // Optionally hide or disable debug controls on error
//       if (debugControlsDiv) debugControlsDiv.style.display = "none";
//     });
//
//   // --- Cleanup ---
//   window.addEventListener("beforeunload", () => {
//     viewerInstance.dispose();
//     // Optional: Remove debug listeners if needed, though dispose should handle model access
//   });
//
//   // Return the instance if needed elsewhere
//   // return viewerInstance;
// };
