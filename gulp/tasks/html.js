import gulp from "gulp";
import twig from "gulp-twig";
import data from "gulp-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config.js";
import { server } from "./serve.js";
import { createSvgUtils } from "../../utils/twig-svg-functions.js";
import { createPictureUtils } from "../../utils/twig-picture-function.js";

import { createPageUtils } from "../../utils/twig-page-functions.js";

const pageUtils = createPageUtils();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

const svgUtils = createSvgUtils(rootDir);
const pictureUtils = createPictureUtils(rootDir);

export const html = () => {
  return gulp
    .src(config.paths.src.pages)
    .pipe(
      data(() => {
        const dataDir = path.join(config.paths.src.base, "data");

        if (!fs.existsSync(dataDir)) {
          return {};
        }

        const dataFiles = fs.readdirSync(dataDir);
        const siteData = {};

        dataFiles.forEach((file) => {
          if (path.extname(file) === ".json") {
            const fileName = path.basename(file, ".json");
            const fileContent = fs.readFileSync(path.join(dataDir, file));
            siteData[fileName] = JSON.parse(fileContent);
          }
        });

        return siteData;
      }),
    )
    .pipe(
      twig({
        base: config.paths.src.templates,
        functions: [
          {
            name: "svgIcon",
            func: svgUtils.svgIcon.bind(svgUtils),
          },
          {
            name: "getSvgSprite",
            func: svgUtils.getSvgSprite.bind(svgUtils),
          },
          {
            name: "svgInline",
            func: svgUtils.svgInline.bind(svgUtils),
          },
          {
            name: "getSvgImage",
            func: svgUtils.getSvgImage.bind(svgUtils),
          },
          {
            name: "picture",
            func: pictureUtils.picture.bind(pictureUtils),
          },
          {
            name: "getCurrentPage",
            func: function () {
              return pageUtils.getCurrentPage(this.context._target.relative)
            }
          }
        ],
        errorLogToConsole: true,
      }),
    )
    .pipe(gulp.dest(config.paths.dist.base))
    .pipe(server.stream());
};
