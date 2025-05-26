import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const argv = yargs(hideBin(process.argv)).argv;
const production = !!argv.production;
const shopify = !!argv.shopify;

const paths = {
  src: {
    base: path.join(rootDir, 'src'),
    templates: path.join(rootDir, 'src/templates'),
    pages: path.join(rootDir, 'src/templates/pages/**/*.twig'),
    styles: path.join(rootDir, 'src/assets/styles/**/*.scss'),
    mainSass: path.join(rootDir, 'src/assets/styles/main.scss'),
    scripts: path.join(rootDir, 'src/js/**/*.js'),
    mainJs: path.join(rootDir, 'src/js/main.js'),
    images: path.join(rootDir, 'src/assets/images/**/*'),
    fonts: path.join(rootDir, 'src/assets/fonts/**/*'),
    data: path.join(rootDir, 'src/data/**/*.json'),
    svgIcons: path.join(rootDir, 'src/assets/icons/**/*.svg'),
    svgImages: path.join(rootDir, 'src/assets/svg/**/*.svg'),
    videos: path.join(rootDir, 'src/assets/videos/**/*'),
    models: path.join(rootDir, 'src/assets/3d/**/*')
  },
  dist: {
    base: path.join(rootDir, 'dist'),
    styles: path.join(rootDir, 'dist/assets/css'),
    scripts: path.join(rootDir, 'dist/assets/js'),
    images: path.join(rootDir, 'dist/assets/images'),
    fonts: path.join(rootDir, 'dist/assets/fonts'),
    svgSprite: path.join(rootDir, 'dist/assets/icons'),
    svgImages: path.join(rootDir, 'dist/assets/svg'),
    videos: path.join(rootDir, 'dist/assets/videos'),
    models: path.join(rootDir, 'dist/assets/3d')
  }
};

const server = {
  port: 3030,
  open: true,
  notify: false
};

export default {
  production,
  shopify,
  paths,
  server
};