import { deleteAsync } from 'del';
import config from '../config.js';

export const clean = () => {
  return deleteAsync([config.paths.dist.base]);
};