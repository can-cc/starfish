import bluebird from 'bluebird';
import fs from 'fs';
import path from 'path';
import R from 'fw-ramda';
import {
  isFile,
  isDir,
  takeFileName,
  takeFileNameWithoutSuffix,
  getRelativePath,
  filterDotFiles,
  isSuffix,
  mergeForce
} from '../lib/util';

const pfs = bluebird.promisifyAll(fs);

import Category from './Category';

export default class Index {
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
    return R.concat(...this.categorys.map(c => c.getAllArticles()));
  }

  render() {
    // TODO refactor function
    if (this.controller.renderLoader.getThemeConfigure().INDEX_TYPE !== 'one') {
      return;
    }

    const allarticles = this.concatAllArticle().sort((a, b) => {
      return b.data.createTime.getTime() - a.data.createTime.getTime();
    });

    const categorys = this.categorys.map(category => {
      return {
        name: category.name,
        indexUrl: path.join(
          '/',
          category.data.relativeOutputPath,
          'index.html'
        ),
        number: category.articles.length
      };
    });

    const indexData = {
      //
      ...this.controller.getBlogInformation(),
      articles: R.take(10, allarticles).map(a => a.data),
      categorys: categorys
    };

    const html = this.controller.renderTemplate('index', indexData);
    const outputFilePath = path.join(this.outputPath, 'index.html');
    fs.writeFileSync(outputFilePath, html);
  }

  renderAllArticles() {}

  renderCategoryList() {
    // TODO render
    const categorysData = this.categorys.map(c => c.data);
    this.controller.renderPluginManager.runPluinAfterwCategoryListRender(
      categorysData,
      {
        outputPath: path.join(this.outputPath, 'categorys')
      }
    );
  }

  renderEachCategory() {
    this.categorys.forEach(category => {
      category.render();
      category.renderAllArticle();
    });
  }
}
