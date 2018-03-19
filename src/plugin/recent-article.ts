import * as R from 'ramda';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

export default class StarFishRenderRecentArticle {
  name: string;
  type: string;

  constructor(private options: PluginOptions) {
    this.name = 'recent-article';
    this.type = 'render';
  }

  public getName() {
    return this.name;
  }

  public beforeArticleRender() {}

  public afterArticleRender(rendered, articleData) {}

  public afterRender(blog) {
    const articles = blog.getAllArticle();
    const recentArticles = R.compose(
      R.map(article => article.data),
      R.take(10),
      R.sort((a1, a2) => a2.data.createTime - a1.data.createTime)
    )(articles);
    fs.writeFileSync(
      path.join(this.options.rootOutputPath, 'recent-articles.json'),
      JSON.stringify(recentArticles)
    );
  }

  public afterIndexRender() {}
  
  public afterCategoryListRender() {}

  public afterCategoryRender(rendered, data) {}
}
