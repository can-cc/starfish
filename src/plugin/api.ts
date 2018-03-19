import * as fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';

export default class StarflishRenderAjaxPlugin {
  private name = 'api';
  private type = 'redner';

  constructor(
    private options: PluginOptions
  ) {}

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

  public afterwCategoryListRender(data, meta) {
    if (!fs.existsSync(meta.outputPath)) {
      fs.mkdirSync(meta.outputPath);
    }
    fs.writeFileSync(path.join(meta.outputPath, 'index.json'), JSON.stringify(data));
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

  public afterCategoryListRender() {/*ignore*/}
}
