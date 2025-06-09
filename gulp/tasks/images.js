import gulp from "gulp";
import imagemin from "gulp-imagemin";
import webp from "gulp-webp";
import gulpif from "gulp-if";
import config from "../config.js";
import { server } from "./serve.js";

export const processOriginals = () => {
  return gulp
    .src(config.paths.src.images)
    .pipe(
      gulpif(
        // config.production,
        false,
        imagemin([
          imagemin.mozjpeg({ quality: 80, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
          imagemin.gifsicle({ interlaced: true }),
        ]),
      ),
    )
    .pipe(gulp.dest(config.paths.dist.images))
    .pipe(server.stream());
};

export const processWebP = () => {
  return gulp
    .src(config.paths.src.images)
    .pipe(
      gulpif(
        config.production,
        webp({
          quality: 100,
          method: 6,
          metadata: "none",
        }),
        gulpif(
          !config.production,
          webp({
            quality: 100,
            method: 0,
            metadata: "none",
          }),
        )
      )
    )
    .pipe(gulp.dest(config.paths.dist.images))
    .pipe(server.stream());
};

export const images = gulp.series(processOriginals, processWebP);
