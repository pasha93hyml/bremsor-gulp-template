import gulp from "gulp";
import config from "../config.js";
import { server } from "./serve.js";

export const scriptsShopify = () => {
  return gulp.src(config.paths.src.scripts)
    .pipe(gulp.dest(config.paths.dist.scripts))
    .pipe(server.stream());
};