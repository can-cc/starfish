import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

export default class StarFishRenderSiteMap {
  options: any;
  name: string;
  type: string;
  urls = []

  constructor(options) {
    this.options = options;
    this.name = 'sitemap';
    this.type = 'render';
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

  afterCategoryListRender(rendered, data) {}

  afterCategoryRender(rendered, data) {}
}
