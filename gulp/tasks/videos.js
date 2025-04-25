import gulp from "gulp";
import config from "../config.js";
import { server } from "./serve.js";

export const videos = () => {
  return gulp
    .src(config.paths.src.videos)
    .pipe(gulp.dest(config.paths.dist.videos))
    .pipe(server.reload({ stream: true }));
};
