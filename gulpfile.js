import gulp from "gulp";
import { clean } from "./gulp/tasks/clean.js";
import { html } from "./gulp/tasks/html.js";
import { styles } from "./gulp/tasks/styles.js";
import { scripts } from "./gulp/tasks/scripts.js";
import { images } from "./gulp/tasks/images.js";
import { fonts } from "./gulp/tasks/fonts.js";
import { serve } from "./gulp/tasks/serve.js";
import { watch } from "./gulp/tasks/watch.js";
import { sprites } from "./gulp/tasks/svg-sprite.js";
import { svgImages } from "./gulp/tasks/svg-images.js";
import { videos } from "./gulp/tasks/videos.js";
import { robots } from "./gulp/tasks/robots.js";
import { generateSitemap } from "./gulp/tasks/sitemap.js";
import { favicons } from "./gulp/tasks/favicons.js";
import {models} from "./gulp/tasks/models.js";
import {scriptsShopify} from "./gulp/tasks/scripts-shopify.js";

const assets = gulp.parallel([
  images,
  fonts,
  sprites,
  svgImages,
  videos,
  robots,
  favicons,
  models
]);

const mainTasks = gulp.series([html, styles, scripts]);
const mainTasksShopify = gulp.series([html, styles, scriptsShopify])

const dev = gulp.series(clean, assets, mainTasks, gulp.parallel(serve, watch));

const build = gulp.series(clean, assets, mainTasks, generateSitemap);

const buildShopify = gulp.series(clean, assets, mainTasksShopify, generateSitemap);

export default dev;

export { dev, build, buildShopify, clean };
