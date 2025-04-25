import fs from "fs";
import path from "path";

class SvgUtils {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.fs = fs;
    this.path = path;
  }

  getSvgSprite() {
    const spritePath = this.path.join(
      this.rootDir,
      "dist/assets/images/sprite.svg",
    );

    if (this.fs.existsSync(spritePath)) {
      return this.fs.readFileSync(spritePath, "utf8");
    }

    return "";
  }

  svgIcon(name, classes = "", width = null, height = null) {
    const sizeAttrs =
      width && height
        ? `width="${width}" height="${height}"`
        : 'width="24" height="24"';

    return `<svg ${sizeAttrs} class="fill-current ${classes}" aria-hidden="true">
      <use href="/assets/icons/sprite.svg#${name}"></use>
    </svg>`;
  }

  getSvgImage(filename) {
    const svgPath = this.path.join(
      this.rootDir,
      `dist/assets/svg/${filename}.svg`,
    );

    if (this.fs.existsSync(svgPath)) {
      return this.fs.readFileSync(svgPath, "utf8");
    }

    return "";
  }

  svgInline(filename, classes = "") {
    let svgContent = this.getSvgImage(filename);

    if (!svgContent) {
      return "";
    }

    let originalWidth = null;
    let originalHeight = null;

    const widthMatch = svgContent.match(/width="([^"]*)"/);
    const heightMatch = svgContent.match(/height="([^"]*)"/);

    if (widthMatch && widthMatch[1]) {
      originalWidth = widthMatch[1];
    }
    if (heightMatch && heightMatch[1]) {
      originalHeight = heightMatch[1];
    }

    if (originalWidth && originalHeight && !svgContent.includes('viewBox="')) {
      const viewBoxValue = `0 0 ${originalWidth} ${originalHeight}`;

      svgContent = svgContent.replace("<svg", `<svg viewBox="${viewBoxValue}"`);
    }

    if (classes) {
      if (svgContent.includes(' class="')) {
        svgContent = svgContent.replace(' class="', ` class="${classes} `);
      } else {
        svgContent = svgContent.replace("<svg", `<svg class="${classes}"`);
      }
    }

    return svgContent;
  }
}

const createSvgUtils = (rootDir) => {
  return new SvgUtils(rootDir);
};

export { createSvgUtils };
