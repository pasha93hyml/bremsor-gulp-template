/**
 * Sets up a resize observer to handle container size changes
 * @param {HTMLElement} container - The container element to observe
 * @param {THREE.Camera} camera - The camera to update
 * @param {THREE.WebGLRenderer} webglRenderer - The WebGL renderer to resize
 * @param {CSS3DRenderer} cssRenderer - The CSS3D renderer to resize
 * @returns {ResizeObserver} The created resize observer
 */
export function handleResize(container, camera, webglRenderer, cssRenderer) {
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      if (entry.target === container) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;

        if (width > 0 && height > 0) {
          // Update camera
          camera.aspect = width / height;
          camera.updateProjectionMatrix();

          // Update both renderers
          webglRenderer.setSize(width, height);
          cssRenderer.setSize(width, height);
        }
      }
    }
  });

  resizeObserver.observe(container);
  return resizeObserver;
}