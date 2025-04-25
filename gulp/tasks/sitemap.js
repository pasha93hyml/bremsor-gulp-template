import gulp from "gulp";
import sitemap from "gulp-sitemap";
import config from "../config.js";

export const generateSitemap = () => {
  return gulp
    .src(config.paths.dist.base + "/**/*.html", { read: false })
    .pipe(
      sitemap({
        siteUrl: "https://bremsor.com", // FIX LATER
        changefreq: "weekly",
        priority: "0.5",
      }),
    )
    .pipe(gulp.dest(config.paths.dist.base));
};
