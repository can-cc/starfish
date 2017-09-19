import fs from 'fs';
import path from 'path';
import glob from 'glob';

const TMPFILE = './temp.js';

export default class StarFishRenderSiteMap {
  constructor() {
    this.name = 'sitemap';
    this.type = 'render';
  }

  runPluinAfterArticleRender(rawDocument, articleData) {

  }

  runPluinAfterRender() {

  }
}
