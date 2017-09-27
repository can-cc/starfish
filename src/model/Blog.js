import bluebird from 'bluebird';
import fs from 'fs';
import path from 'path';
import R from 'fw-ramda';
import { isDir } from '../lib/util';

const pfs = bluebird.promisifyAll(fs);

import Category from './Category';
import BlogIndex from './Index';
import CategoryList from './CategoryList';

export default class Blog {
  constructor(options, controller) {
    this.inputPath = options.inputPath;
    this.outputPath = options.outputPath;
    this.options = options;
    this.controller = controller;
  }

  async load() {
    this.categorys = await this.loadCategorys();
    this.categorys.forEach(category => {
      category.load();
    });

    this.blogIndex = new BlogIndex(this.options, this.categorys, this.controller);
    this.categoryList = new CategoryList(this.options, this.categorys, this.controller);
  }

  async loadCategorys() {
    const categoryPaths = await pfs
      .readdirAsync(this.inputPath)
      .filter(this.controller.filterIgnores.bind(this.controller))
      .filter(p => isDir(path.resolve(this.inputPath, p)));

    return categoryPaths.map(
      categoryName =>
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
    );
  }

  async render() {
    await this.renderEachCategory();
    this.blogIndex.render();
    this.categoryList.render();
  }

  renderEachCategory() {
    this.categorys.forEach(category => {
      category.render();
      category.renderAllArticle();
    });
  }
}
