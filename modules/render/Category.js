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

import Article from './Article';

export default class Category {
  constructor(meta, controller) {
    this.name = meta.name;
    this.meta = meta;
    this.parsers = meta.parsers;
    this.inputPath = meta.inputPath;
    this.outputPath = meta.outputPath;
    this.controller = controller;

    this.articles = [];

    this.loadCategoryConfigure();
  }

  loadCategoryConfigure() {
    this.categoryConfigure = {};
    const categoryConfigureFilePath = path.join(this.inputPath, '.wdconfig.yaml');

    // fs.readFileSync(

    // )
  }

  loadArticles() {
    const paths = fs.readdirSync(this.inputPath).filter(this.controller.filterIgnores.bind(this.controller));// TODO: filterIgnores 过滤了更多

    const [files, dirs] = _.partition(paths, pathName => isFile(path.resolve(this.inputPath, pathName)));
    const articleFiles = files.filter(file => filterDotFiles(file) && R.values(this.parsers).some(parser => parser.check(file)));

    const articleFileNameWithoutSuffixs = articleFiles.map(file => takeFileNameWithoutSuffix(file));
    const [articleAsserts, otherDirs] = _.partition(dirs, (dir) => articleFileNameWithoutSuffixs.indexOf(dir) >= 0);
    const shouldCopyArticleAssertNames = articleAsserts.filter((articleAssert) => articleFileNameWithoutSuffixs.indexOf(articleAssert) >= 0);

    articleFiles.forEach((articleFile) => {
      const articleFileNameWithoutSuffix = takeFileNameWithoutSuffix(articleFile);
      const article = new Article(Object.assign({}, this.meta, {
        inputPath: path.join(this.inputPath, articleFile),
        outputPath: path.join(this.outputPath, articleFileNameWithoutSuffix + '.html'),
        articleFileNameWithoutSuffix,
        categoryPath: this.inputPath,
        name: articleFileNameWithoutSuffix
      }), this.controller);
      article.load();
      this.addArticle.call(this, article);
    });
  }

  getAllArticles() {
    return this.articles;
  }

  addArticle(article) {
    this.articles.push(article);
  }

  render() {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath);
    }

    const sortedArticles = this.articles;

    const pageN = Math.ceil(sortedArticles.length / 10);
    _.chunk(sortedArticles, 10).forEach((articleChunk, i) => {
      const data = {
        title: this.name,
        articles: articleChunk,
        pageN: i,
        currentPageN: pageN
      };
      console.log(data);
    });
  }

  renderAllArticle() {
    this.articles.forEach(article => {
      article.render();
    });
  }
}
