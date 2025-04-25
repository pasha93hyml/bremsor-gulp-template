import gulp from "gulp";
import svgmin from "gulp-svgmin";
import cheerio from "gulp-cheerio";
import config from "../config.js";
import { server } from "./serve.js";

export const svgImages = () => {
  return gulp
    .src(config.paths.src.svgImages)
    .pipe(
      svgmin({
        multipass: false,
        js2svg: {
          pretty: false,
        },
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                removeViewBox: false,
                cleanupIDs: false,
                removeUnknownsAndDefaults: {
                  keepRoleAttr: true,
                  keepAriaAttrs: true,
                },
              },
            },
          },
        ],
      }),
    )
    .pipe(
      cheerio({
        run: ($) => {
          $("[fill]").each(function () {
            $(this).attr("fill", "currentColor");
          });

          $("[stroke]").each(function () {
            $(this).attr("stroke", "currentColor");
          });
        },
        parserOptions: {
          xmlMode: true,
        },
      }),
    )
    .pipe(gulp.dest(config.paths.dist.svgImages))
    .pipe(server.stream());
};
