import * as bluebird from 'bluebird';
import * as fs from 'fs';
import * as path from 'path';
import * as R from 'fw-ramda';
import { isDir } from '../lib/util';

const pfs = bluebird.promisifyAll(fs);

import Category from './Category';
import BlogIndex from './Index';
import CategoryList from './CategoryList';

export default class Blog {
  inputPath: string;
  options: any;
  outputPath: string;
  controller: any;
  categorys: any;
  blogIndex: any;
  categoryList: any;

  constructor(options, controller) {
    this.inputPath = options.inputPath;
    this.outputPath = options.outputPath;
    this.options = options;
    this.controller = controller;
  }

  load() {
    this.categorys = this.loadCategorys();
    this.categorys.forEach(category => {
      category.load();
    });

    this.blogIndex = new BlogIndex(this.options, this.categorys, this.controller);
    this.categoryList = new CategoryList(this.options, this.categorys, this.controller);
  }

  loadCategorys() {
    const categoryPaths = fs
      .readdirSync(this.inputPath)
      .filter(p => isDir(path.join(this.inputPath, p)));

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

  render() {
    this.renderCategorys();
    this.blogIndex.render();
    this.categoryList.render();
  }

  renderCategorys() {
    this.categorys.forEach(category => {
      category.render();
      category.renderAllArticle();
    });
  }

  getAllArticle() {
    return R.compose(R.flatten, R.map(category => category.getAllArticles()))(this.categorys);
  }
}
