// gulp/tasks/watch.js
import gulp from "gulp";
import config from "../config.js";
import { html } from "./html.js";
import { styles } from "./styles.js";
import { scripts } from "./scripts.js";
import { images } from "./images.js";
import { fonts } from "./fonts.js";
import { sprites } from "./svg-sprite.js";
import { svgImages } from "./svg-images.js";
import { videos } from "./videos.js";

export const watch = () => {
  gulp.watch(
    config.paths.src.templates + "/**/*.twig",
    gulp.series(html, styles),
  );
  gulp.watch(
    ["./src/assets/styles/**/*.scss", "./src/assets/styles/**/*.css"],
    styles,
  );
  gulp.watch(config.paths.src.scripts, scripts);
  gulp.watch(config.paths.src.images, images);
  gulp.watch(config.paths.src.fonts, fonts);
  gulp.watch(config.paths.src.svgIcons, sprites);
  gulp.watch(config.paths.src.svgIcons, svgImages);
  gulp.watch(config.paths.src.data, html);
  gulp.watch(config.paths.src.videos, videos);
};
