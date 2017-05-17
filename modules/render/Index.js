import bluebird from 'bluebird';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import ejs from 'ejs';
import fsExtra from 'fs-extra';
import moment from 'moment';
import md5 from 'blueimp-md5';
import R from 'fw-ramda';

import { parseOrg, parseMarkDown } from './render-parse.js';
import { isFile, isDir, takeFileName, takeFileNameWithoutSuffix,
         getRelativePath, filterDotFiles, isSuffix, mergeForce } from '../../lib/util';
import { syncMappingDirs, fixArticleUrlAndCut, getParsersFromModules, makeDocumentParserFn, getPlugin } from './render-util';
import { warning, error } from '../../lib/message';
import { loadConfig } from '../../lib/loadConfig.js';
import { getModifyDates } from '../../util/git-date';
import { RenderLoader } from './render-loader';

const pfs = bluebird.promisifyAll(fs);

import Category from './Category';

export default class Index {
  constructor(meta, controller) {
    this.inputPath = meta.inputPath;
    this.outputPath = meta.outputPath;
    this.meta = meta;
    this.controller = controller;

    this.categorys = [];
  }

  addCategory(category) {
    this.categorys.push(category);
  }

  async loadRootDir() {
    const categoryPaths = await pfs.readdirAsync(this.inputPath)
          .filter(this.controller.filterIgnores.bind(this.controller))
          .filter(p => isDir(path.resolve(this.inputPath, p)));
    categoryPaths.map(categoryName => this.addCategory(new Category(
      {
        inputPath: path.join(this.inputPath, categoryName),
        outputPath: path.join(this.outputPath, categoryName),
        name: categoryName,
        outputRootPath: this.inputPath,
        parsers: this.meta.parsers
      },
      this.controller
    )));
  }

  loadCategoryDir() {
    this.categorys.forEach(category => {
      category.load();
      category.loadArticles()
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

    const categorys = this.categorys.map((category) => {
      return {
        name: category.name,
        indexUrl: path.join('/', category.data.relativeOutputPath, 'index.html'),
        number: category.articles.length
      }
    })

    const indexData = {
      ...this.controller.getBlogInformation(),
      title: this.controller.options.BLOG.NAME,
      blogDesc: this.controller.options.BLOG.DESC,
      articles: R.take(10, allarticles).map(a => a.data),
      categorys: categorys
    };

    // this.controller.runPluginAfterIndexRender(indexData);

    const html = this.controller.renderTemplate('index', indexData);
    const outputFilePath = path.join(this.outputPath, 'index.html');
    fs.writeFileSync(outputFilePath, html);
  }

  renderAllArticles() {

  }

  renderCategoryList() {

  }

  renderAllCategory() {
    this.categorys.forEach(category => {
      category.render();
      category.renderAllArticle();
    });
  }
}
