import gulp from "gulp";
import svgSprite from "gulp-svg-sprite";
import config from "../config.js";
import { server } from "./serve.js";

export const sprites = () => {
  const spriteConfig = {
    shape: {
      dimension: {
        maxWidth: 32,
        maxHeight: 32,
      },
      spacing: {
        padding: 0,
      },
      transform: [
        {
          svgo: {
            plugins: [
              {
                name: "preset-default",
                params: {
                  overrides: {
                    removeViewBox: false,
                    cleanupIds: false,
                  },
                },
              },
              {
                name: "removeAttrs",
                params: {
                  attrs: ["fill", "stroke"],
                },
              },
            ],
          },
        },
      ],
    },
    mode: {
      symbol: {
        dest: ".",
        sprite: "sprite.svg",
        example: false,
      },
    },
    svg: {
      xmlDeclaration: false,
      doctypeDeclaration: false,
      namespaceIDs: false,
    },
  };

  return gulp
    .src(config.paths.src.svgIcons)
    .pipe(svgSprite(spriteConfig))
    .pipe(gulp.dest(config.paths.dist.svgSprite))
    .pipe(server.stream());
};
