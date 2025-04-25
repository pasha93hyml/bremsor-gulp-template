import browserSync from 'browser-sync';
import config from '../config.js';

const server = browserSync.create();

export const serve = (done) => {
  server.init({
    server: {
      baseDir: config.paths.dist.base
    },
    port: config.server.port,
    notify: config.server.notify,
    open: config.server.open
  });
  done();
};

export { server };