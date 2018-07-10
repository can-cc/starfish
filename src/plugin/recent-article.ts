import * as R from 'ramda';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import Blog from '../model/Blog';
import { StartFishRenderPlugin } from './base/render-plugin';
import { Article } from '../model/Article';

export default class StarFishRenderRecentArticle extends StartFishRenderPlugin {
  public name = 'recent-article';
  public type = 'render';

  constructor(private options: PluginOptions) {
    super();
  }

  public afterBlogRender(blog: Blog) {
    const articles = blog.getAllArticle();
    const recentArticles = R.compose(
      R.map(article => article.data),
      R.take(10),
      R.sort((a1: Article, a2: Article) => a2.data.createTime - a1.data.createTime)
    )(articles);

    fs.writeFileSync(
      path.join(this.options.rootOutputPath, 'recent-articles.json'),
      JSON.stringify(recentArticles)
    );
  }
}
