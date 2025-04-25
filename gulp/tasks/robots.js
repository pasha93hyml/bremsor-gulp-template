import gulp from "gulp";
import config from "../config.js";

export const robots = () => {
  return gulp.src(config.paths.src.base + '/robots.txt')
    .pipe(gulp.dest(config.paths.dist.base))
}