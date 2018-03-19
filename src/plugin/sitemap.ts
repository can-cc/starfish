import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

export default class StarFishRenderSiteMap {
  name = 'sitemap';
  type: 'render';
  urls = [];

  constructor(private options: PluginOptions) {}

  public getName() {
    return this.name;
  }

  public beforeArticleRender() {}

  public afterArticleRender(rendered, articleData: ArticleData) {
    this.urls.push(`//${path.join(this.options.blogConfigure.BLOG.DOMAIN, articleData.path)}`);
  }

  public afterRender() {
    fs.writeFileSync(path.join(this.options.rootOutputPath, 'sitemap.txt'), this.urls.join('\n'));
  }

  public afterIndexRender() {}

  public afterCategoryListRender() {}

  public afterCategoryRender(rendered, data) {}
}
