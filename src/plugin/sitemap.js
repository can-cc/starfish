import fs from 'fs';
import path from 'path';
import glob from 'glob';

export default class StarFishRenderSiteMap {
  constructor(options) {
    console.log(options);
    this.options = options;
    this.name = 'sitemap';
    this.type = 'render';
    this.urls = [];
  }

  getName() {
    return this.name;
  }

  beforeArticleRender() {}

  afterArticleRender(rawDocument, articleData) {
    this.urls.push(
      `http://${this.options.blogConfigure.BLOG.DOMAIN}${articleData.outputFileRelativePath}`
    );
  }

  afterRender() {
    fs.writeFileSync(path.join(this.options.outputPath, 'sitemap.txt'), this.urls.join('\n'));
  }

  afterIndexRender() {}

  afterwCategoryListRender() {}

  afterwCategoryRender() {}
}
