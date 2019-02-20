import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { Article } from '../model/Article';
import { StartFishRenderPlugin } from './base/render-plugin';

export default class StarFishRenderSiteMap extends StartFishRenderPlugin {
  public name = 'sitemap';
  public type: 'render';
  private urls = [];
  private isHttps: boolean;

  constructor(private options: PluginOptions) {
    super();
    this.isHttps = options.blogConfigure.BLOG.HTTPS;
  }

  public afterArticleRender(renderedHtml: string, article: Article) {
    const articleData: ArticleData = article.getData();
    const protocol = this.isHttps ? 'https' : 'http';
    this.urls.push(
      `${protocol}://${path.join(this.options.blogConfigure.BLOG.DOMAIN, articleData.path)}`
    );
  }

  public afterBlogRender() {
    fs.writeFileSync(path.join(this.options.rootOutputPath, 'sitemap.txt'), this.urls.join('\n'));
  }
}
