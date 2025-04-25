import gulp from "gulp";
import config from "../config.js";
import { server } from "./serve.js";

export const fonts = () => {
  return gulp
    .src(config.paths.src.fonts)
    .pipe(gulp.dest(config.paths.dist.fonts))
    .pipe(server.stream());
};
