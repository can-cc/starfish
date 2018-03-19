import * as fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';

export default class StarflishRenderApiPlugin {
  private name = 'api';
  private type = 'redner';

  constructor(private options: PluginOptions) {}

  public getName() {
    return this.name;
  }

  public getType() {
    return this.type;
  }

  public beforeArticleRender(articleData) {}

  public afterArticleRender(rawDocument, articleData: ArticleData) {
    const outputPath = path.join(this.options.rootOutputPath, articleData.path);
    const outputName = 'index.json';

    fs.writeFileSync(path.join(outputPath, outputName), JSON.stringify(articleData));
  }

  public afterCategoryListRender(html, categoryListData: CategoryListData) {
    if (!fs.existsSync(categoryListData.categoryListOutputPath)) {
      fs.mkdirSync(categoryListData.categoryListOutputPath);
    }
    fs.writeFileSync(
      path.join(categoryListData.categoryListOutputPath, 'index.json'),
      JSON.stringify(categoryListData)
    );
  }

  public afterCategoryRender(rendered, categoryData: CategoryData) {
    fs.writeFileSync(
      path.join(this.options.rootOutputPath, categoryData.path, 'index.json'),
      JSON.stringify(categoryData)
    );
  }

  public afterIndexRender(indexData) {
    fs.writeFileSync(
      path.join(this.options.rootOutputPath, 'index.json'),
      JSON.stringify(JSON.stringify(indexData))
    );
  }

  public afterRender() {
    /*ignore*/
  }
}
