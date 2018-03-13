import * as path from 'path';
import * as fs from 'fs';
import Category from './Category';
import { RenderController } from '../modules/render/render-controller';

export class CategoryList {
  constructor(
    private options: {
      categoryListOutputPath: string;
    },
    private categorys: Category[],
    private controller: RenderController
  ) {}

  public render() {
    const categorysData = this.categorys.map(c => c.data);
    if (!fs.existsSync(this.options.categoryListOutputPath)) {
      fs.mkdirSync(this.options.categoryListOutputPath);
    }

    const html = this.controller.renderThemer.renderTemplate('CATEGORY_LIST', categorysData);
    fs.writeFileSync(path.join(this.options.categoryListOutputPath, 'index.html'), html);

    this.controller.renderPluginManager.runPluinAfterwCategoryListRender(categorysData, {
      outputPath: this.options.categoryListOutputPath
    });
  }
}
