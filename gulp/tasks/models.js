import gulp from "gulp";
import config from "../config.js";
import { server } from "./serve.js";

export const models = () => {
  return gulp
    .src(config.paths.src.models)
    .pipe(gulp.dest(config.paths.dist.models))
    .pipe(server.reload({ stream: true }));
};
