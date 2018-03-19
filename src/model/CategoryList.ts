import * as path from 'path';
import * as fs from 'fs';
import Category from './Category';
import { RenderController } from '../modules/render/render-controller';

export class CategoryList {
  private data: CategoryListData;

  constructor(
    private options: {
      categoryListOutputPath: string;
    },
    private categorys: Category[],
    private controller: RenderController
  ) {
    this.data = this.loadCategoryListData();
  }

  public loadCategoryListData(): CategoryListData {
    return {
      categoryList: this.categorys
        .map(c => c.getData())
        .map(cd => ({ categoryName: cd.categoryName })),
      categoryListOutputPath: this.options.categoryListOutputPath
    };
  }

  public render() {
    if (!fs.existsSync(this.options.categoryListOutputPath)) {
      fs.mkdirSync(this.options.categoryListOutputPath);
    }

    const html = this.controller.renderThemer.renderTemplate('CATEGORY_LIST', this.data);
    fs.writeFileSync(path.join(this.options.categoryListOutputPath, 'index.html'), html);

    this.controller.renderPluginManager.runPluinAfterwCategoryListRender(html, this.data);
  }
}
