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
    this.urls.push(`//${articleData.path}`);
  }

  public afterRender() {
    fs.writeFileSync(path.join(this.options.rootOutputPath, 'sitemap.txt'), this.urls.join('\n'));
  }

  public afterIndexRender() {}

  public afterCategoryListRender(rendered, data) {}

  public afterCategoryRender(rendered, data) {}
}
