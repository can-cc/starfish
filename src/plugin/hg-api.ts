import * as fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import { CategoryList } from '../model/CategoryList';
import Category from '../model/Category';
import { Article } from '../model/Article';
import { StartFishRenderPlugin } from './base/render-plugin';

export default class StarflishRenderHgApiPlugin extends StartFishRenderPlugin {
  public name = 'hg-api';
  public type = 'redner';

  constructor(private options: PluginOptions) {
    super();
  }

  public afterArticleRender(renderedHtml: string, article: Article) {
    const articleData: ArticleData = article.getData();
    const outputDirPath = path.join(this.options.rootOutputPath, articleData.dirPath);
    const outputFilePath = 'index.json';

    fs.writeFileSync(path.join(outputDirPath, outputFilePath), JSON.stringify(articleData));
  }

  public afterCategoryListRender(renderedHtml: string, categoryList: CategoryList) {
    const categoryListData: CategoryListData = categoryList.getData();
    const categoryListOutputDirPath = path.join(this.options.rootOutputPath, categoryListData.path);
    if (!fs.existsSync(categoryListOutputDirPath)) {
      fs.mkdirSync(categoryListOutputDirPath);
    }
    fs.writeFileSync(
      path.join(categoryListOutputDirPath, 'index.json'),
      JSON.stringify(categoryListData)
    );
  }

  public afterCategoryRender(renderedHtml: string, category: Category) {
    const categoryData = category.getData();
    fs.writeFileSync(
      path.join(this.options.rootOutputPath, categoryData.path, 'index.json'),
      JSON.stringify(categoryData)
    );
  }
}
