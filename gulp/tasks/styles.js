import gulp from 'gulp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';
import gulpif from 'gulp-if';
import config from '../config.js';
import { server } from './serve.js';

const sass = gulpSass(dartSass);

export const styles = () => {
  return gulp.src('./src/assets/styles/main.scss')
    .pipe(gulpif(!config.production, sourcemaps.init()))
    .pipe(sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['node_modules']
    }).on('error', sass.logError))
    .pipe(postcss())
    // .pipe(gulpif(config.production, cleanCSS()))
    // .pipe(rename({
    //   suffix: config.production ? '.min' : ''
    // }))
    .pipe(gulpif(!config.production, sourcemaps.write('.')))
    .pipe(gulp.dest(config.paths.dist.styles))
    .pipe(server.stream());
};