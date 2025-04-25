import gulp from 'gulp';
import config from '../config.js';

export const favicons = () => {
  return gulp.src(config.paths.src.base + '/assets/favicons/**/*')
    .pipe(gulp.dest(config.paths.dist.base));
};