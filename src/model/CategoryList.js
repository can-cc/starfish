

export default class CategoryList {
  constructor(options, categorys) {
    this.options = options;
    this.categorys = categorys;
  }


  render() {
    const categorysData = this.categorys.map(c => c.data);
    const categoryListOutputPath = path.join(this.outputPath, 'categorys');
    if (!fs.existsSync(categoryListOutputPath)) {
      fs.mkdirSync(categoryListOutputPath);
    }

    const html = this.controller.renderThemer.renderTemplate('CATEGORY_LIST', categorysData);
    fs.writeFileSync(path.join(categoryListOutputPath, 'index.html'), html);
    this.controller.renderPluginManager.runPluinAfterwCategoryListRender(categorysData, {
      outputPath: path.join(this.outputPath, 'categorys')
    });
  }
}
