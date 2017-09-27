import fs from 'fs';
import path from 'path';
import glob from 'glob';

export default class StarFishRenderSiteMap {
  constructor(options) {
    this.name = 'sitemap';
    this.type = 'render';
    this.urls = [];
  }

  getName() {
    return this.name;
  }

  beforeArticleRender() {}

  afterArticleRender(rawDocument, articleData) {
    console.log(articleData);
  }

  runPluinAfterRender() {}

  afterRender() {}

  afterIndexRender() {}

  afterwCategoryListRender() {}

  afterwCategoryRender() {}
}
