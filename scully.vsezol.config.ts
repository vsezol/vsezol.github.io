import { ScullyConfig } from '@scullyio/scully';
import '@scullyio/scully-plugin-puppeteer';

export const config: ScullyConfig = {
  projectRoot: './src',
  projectName: 'vsezol',
  distFolder: './dist/vsezol',
  outDir: './dist/static',
  defaultPostRenderers: [],
  routes: {},
};
