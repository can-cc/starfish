import R from 'ramda';
import fs from 'fs';
import path from 'path';
import glob from 'glob';

export default class StarFishRenderRecentArticle {
  constructor(options) {
    this.options = options;
    this.name = 'recent-article';
    this.type = 'render';
  }

  getName() {
    return this.name;
  }

  beforeArticleRender() {}

  afterArticleRender(rendered, articleData) {}

  afterRender(blog) {
    const articles = blog.getAllArticle();
    const recentArticles = R.compose(
      R.map(article => article.data),
      R.take(10),
      R.sort((a1, a2) => a2.data.createTime - a1.data.createTime)
    )(articles);
    fs.writeFileSync(
      path.join(this.options.outputPath, 'recent-articles.json'),
      JSON.stringify(recentArticles)
    );
  }

  afterIndexRender() {}

  afterCategoryListRender(rendered, data) {
    // console.log(data);
  }

  afterCategoryRender(rendered, data) {
    // console.log(data);
  }
}
