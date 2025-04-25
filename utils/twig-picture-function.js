import fs from "fs";
import path from "path";

class PictureUtils {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.fs = fs;
    this.path = path;
  }

  /**
   * Generate <picture>
   * @param {string} src - src of img
   * @param {string} alt - alt
   * @param {Object} options - additional options
   * @param {string} options.class - classes for image
   * @param {string} options.pictureClass - classes for <picture>
   * @param {string} options.width - width
   * @param {string} options.height - height
   * @param {string} options.loading - lazy | eager | auto, loading attribute
   * @param {string} options.sizes - sizes attribute
   * @param {Array} options.breakpoints - array of breakpoint objects for srcset attribute
   * @param {boolean} options.skipWebp - skip WebP format
   * @returns {string} HTML for <picture>
   */
  picture(src, alt = "", options = {}) {
    const defaults = {
      class: "",
      pictureClass: "",
      width: "",
      height: "",
      loading: "lazy",
      sizes: "",
      breakpoints: [],
      skipWebp: false,
    };

    const opts = { ...defaults, ...options };

    const srcPath = src.startsWith("/") ? src.substring(1) : src;
    const imagePath = this.path.join(this.rootDir, "dist", srcPath);
    const imageDir = this.path.dirname(imagePath);
    const imageExtension = this.path.extname(imagePath);
    const imageName = this.path.basename(imagePath, imageExtension);
    const webpPath = this.path.join(imageDir, `${imageName}.webp`);

    const hasWebp = !opts.skipWebp && this.fs.existsSync(webpPath);

    let markup = `<picture${opts.pictureClass ? ` class="${opts.pictureClass}"` : ""}>`;

    if (opts.breakpoints && opts.breakpoints.length > 0) {
      const sortedBreakpoints = [...opts.breakpoints].sort(
        (a, b) => (b.width || 0) - (a.width || 0),
      );

      if (hasWebp) {
        sortedBreakpoints.forEach((bp) => {
          const media = bp.width ? `(max-width: ${bp.width}px)` : "";
          const srcset = bp.src ? bp.src.replace(imageExtension, ".webp") : "";

          if (srcset) {
            markup += `\n <source${media ? ` media="${media}"` : ""} srcset="${srcset}" type="image/webp"`;
          }
        });
      }

      sortedBreakpoints.forEach((bp) => {
        const media = bp.width ? `(max-width: ${bp.width}px)` : "";
        const srcset = bp.src || "";

        if (srcset) {
          markup += `\n  <source${media ? ` media="${media}"` : ""} srcset="${srcset}" type="image/${imageExtension.substring(1)}">`;
        }
      });
    } else {
      if (hasWebp) {
        const webpSrc = src.replace(imageExtension, ".webp");
        markup += `\n  <source srcset="${webpSrc}" type="image/webp">`;
      }

      markup += `\n  <source srcset="${src}" type="image/${imageExtension.substring(1)}">`;
    }

    const imgAttributes = [
      opts.class ? `class="${opts.class}"` : "",
      `src="${src}"`,
      `alt="${alt}"`,
      opts.width ? `width="${opts.width}"` : "",
      opts.height ? `height="${opts.height}"` : "",
      opts.loading ? `loading="${opts.loading}"` : "",
      opts.sizes ? `sizes="${opts.sizes}"` : "",
    ]
      .filter(Boolean)
      .join(" ");

    markup += `\n <img ${imgAttributes}>`;
    markup += `\n</picture>`;

    return markup;
  }
}

const createPictureUtils = (rootDir) => {
  return new PictureUtils(rootDir);
};

export { createPictureUtils };
