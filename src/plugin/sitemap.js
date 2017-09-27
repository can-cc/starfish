import fs from 'fs';
import path from 'path';
import glob from 'glob';

export default class StarFishRenderSiteMap {
  constructor(options) {
    this.options = options;
    this.name = 'sitemap';
    this.type = 'render';
    this.urls = [];
  }

  getName() {
    return this.name;
  }

  beforeArticleRender() {}

  afterArticleRender(rendered, articleData) {
    this.urls.push(
      `http://${this.options.blogConfigure.BLOG.DOMAIN}${articleData.outputFileRelativePath}`
    );
  }

  afterRender() {
    fs.writeFileSync(path.join(this.options.outputPath, 'sitemap.txt'), this.urls.join('\n'));
  }

  afterIndexRender() {}

  afterCategoryListRender(rendered, data) {
    // console.log(data);
  }

  afterCategoryRender(rendered, data) {
    // console.log(data);
  }
}
