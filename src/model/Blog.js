import bluebird from 'bluebird';
import fs from 'fs';
import path from 'path';
import R from 'fw-ramda';
import { isDir } from '../lib/util';

const pfs = bluebird.promisifyAll(fs);

import Category from './Category';

export default class Blog {
  constructor(options, controller) {
    this.inputPath = options.inputPath;
    this.outputPath = options.outputPath;
    this.options = options;
    this.controller = controller;

    this.categorys = [];
  }

  addCategory(category) {
    this.categorys.push(category);
  }

  async load() {
    await this.loadCategorys();
    this.loadCategoryDir();
  }

  async loadCategorys() {
    const categoryPaths = await pfs
      .readdirAsync(this.inputPath)
      .filter(this.controller.filterIgnores.bind(this.controller))
      .filter(p => isDir(path.resolve(this.inputPath, p)));

    categoryPaths.map(categoryName =>
      this.addCategory(
        new Category(
          {
            inputPath: path.join(this.inputPath, categoryName),
            outputPath: path.join(this.outputPath, categoryName),
            name: categoryName,
            outputRootPath: this.outputPath,
            inputRootPath: this.inputPath,
            parsers: this.options.parsers
          },
          this.controller
        )
      )
    );
  }

  loadCategoryDir() {
    this.categorys.forEach(category => {
      category.load();
      category.loadArticles();
    });
  }

  concatAllArticle() {
    return [].concat(...this.categorys.map(c => c.getAllArticles()));
  }

  async render() {
    await this.renderCategoryList();
    await this.renderEachCategory();

    // const allarticles = this.concatAllArticle().sort((a, b) => {
    //   return b.data.createTime.getTime() - a.data.createTime.getTime();
    // });
    // const categorys = this.categorys.map(category => {
    //   return {
    //     name: category.name,
    //     indexUrl: path.join('/', category.data.relativeOutputPath, 'index.html'),
    //     number: category.articles.length
    //   };
    // });
    // const indexData = {
    //   ...this.controller.getBlogInformation(),
    //   articles: R.take(10, allarticles).map(a => a.data),
    //   categorys: categorys
    // };
    // const html = this.controller.renderThemer.renderTemplate('INDEX', indexData);
    // const outputFilePath = path.join(this.outputPath, 'index.html');
    // fs.writeFileSync(outputFilePath, html);
  }

  renderAllArticles() {}

  renderCategoryList() {
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

  renderEachCategory() {
    this.categorys.forEach(category => {
      category.render();
      category.renderAllArticle();
    });
  }
}
