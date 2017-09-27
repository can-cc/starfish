import path from 'path';
import fs from 'fs';

export default class CategoryList {
  constructor(options, categorys, controller) {
    this.options = options;
    this.categorys = categorys;
    this.controller = controller;
  }

  render() {
    const categorysData = this.categorys.map(c => c.data);
    const categoryListOutputPath = path.join(this.options.outputPath, 'categorys');
    if (!fs.existsSync(categoryListOutputPath)) {
      fs.mkdirSync(categoryListOutputPath);
    }

    const html = this.controller.renderThemer.renderTemplate('CATEGORY_LIST', categorysData);
    fs.writeFileSync(path.join(categoryListOutputPath, 'index.html'), html);
    this.controller.renderPluginManager.runPluinAfterwCategoryListRender(categorysData, {
      outputPath: path.join(this.options.outputPath, 'categorys')
    });
  }
}
