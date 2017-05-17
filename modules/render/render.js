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

const HashNum = 7;

const globToRegExp = require('glob-to-regexp');

let htmlToText = require('html-to-text');
let dateFormat = require('dateformat');

const isOrg = R.curry(isSuffix)('org');
const isMd = R.curry(isSuffix)('md');
const isYaml = R.curry(isSuffix)('yaml');

import Index from './Index';


export class RenderController {
  constructor(inputPath, outputRoot, options) { // TODO merge inputPath, outputRoot
    this.inputPath = inputPath;
    this.outputRoot = outputRoot;

    this.theme = options.STYLE.THEME;
    this.options = options;

    this.categorys = {};

    this.pluginType = 'render';
    this.plugins = getPlugin(this.pluginType, {
      inputPath,
      outputRoot,
      options
    });

    // TODO remove
    const themeDir = path.isAbsolute(options.STYLE.THEMEDIR) ? options.STYLE.THEMEDIR : path.resolve(inputPath, options.STYLE.THEMEDIR);
    this.themePath = path.join(themeDir, this.theme);

    // methods
    this.loadRootIgnore();

    this.renderLoader = new RenderLoader(inputPath, outputRoot, options);

    this.parsers = getParsersFromModules();
    this.documentParserFn = makeDocumentParserFn(this.parsers);
  }

  async render() {

    this.clearData();

    if (!fs.existsSync(this.outputRoot)) {
      fs.mkdirSync(this.outputRoot);
    }

    await this.load(this.inputPath, this.outputRoot, 'index');
    await this.copyStatic();

    // TODO rename
    // await this.copyStatic();
    // await this.renderCategorys();

    // this.runPluinAfterRender();
  }

  async load(dirPath, outputPath, category) {
    const index = new Index({
      inputPath: dirPath,
      outputPath,
      parsers: this.parsers
    }, this);

    await index.loadRootDir();
    await index.loadCategoryDir();
    await index.render();
    await index.renderAllCategory();
  }

  // TODO move
  loadRootIgnore() {
    this.rootIgnoreRegs = [];
    let self = this;
    let ignoreFilePath = path.join(this.inputPath, this.options.CONFIG.IGNORE_FILE);
    if (fs.existsSync(ignoreFilePath)) {
      fs.readFileSync(ignoreFilePath, 'utf-8').split('\n').forEach((globStr) => {
        self.rootIgnoreRegs.push(globToRegExp(globStr));
      });
    }
    const mappingRules = this.options.MAPPING || {};
    R.keys(mappingRules).forEach(toMapPath => this.rootIgnoreRegs.push(globToRegExp(toMapPath)));
  }

  async copyStatic() {
    await fsExtra.copy(path.join(this.themePath, 'static'), path.join(this.outputRoot, 'static'));
  }

  runPluinAfterArticleRender(rawDocument, articleInfo, cb) {
    R.values(this.plugins).forEach(plugin => {
      plugin.afterArticleRender(rawDocument, articleInfo, cb);
    });
  }

  runPluinAfterRender() {
    R.values(this.plugins).forEach(plugin => plugin.afterRender())
  }

  runPluginAfterIndexRender(indexData) {
    R.values(this.plugins).forEach(plugin => plugin.afterIndexRender(indexData));
  }

  filterIgnores(name) {
    return this.rootIgnoreRegs.every(reg => !reg.test(name));
  }

  // add article info to category.articles array
  async addArticle(fileName, category) {
    const dateInfo = await getModifyDates(path.join(this.categorys[category].inputPath, fileName), this.inputPath);
    this.categorys[category].articles.push({
      fileName: fileName,
      dateInfo: dateInfo
    });
  }

  clearData() {
    this.categorys = [];
  }

  addCategory(name, inputPath, outputPath) {
    const configFilePath = path.join(inputPath, this.options.CONFIG.DIR_CONFIG_FILE);
    this.categorys[name] = {
      name: name,
      outputPath: outputPath,
      inputPath: inputPath,
      relativeOutputPath: getRelativePath(this.outputRoot, outputPath),
      articles: []
    };

    if (fs.existsSync(configFilePath)) {
      const dirConfig = loadConfig(configFilePath);
      mergeForce(this.categorys[name], dirConfig);
    }
  }

  sortArticles(articles) {
    return articles.sort((a, b) => {
      return b.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime() -
        a.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime();
    });
  }

  // dispatch task for every dir
  async renderCategorys() {
    // TODO remove it
    if (!this.categorys) {
      return;
    }
    await Promise.all(Object.keys(this.categorys).map(async (name) => {
      if (this.categorys[name].articles.length) {
        await this.renderCategory(this.categorys[name]);
      }
    }));
    await this.renderAllArticles();
    await this.renderIndex();
    await this.renderCategoryList();
  }

  renderTemplate(key, data) {
    const mergedTemplateData = this.renderLoader.mergeTemplateData(data);
    return ejs.render(this.renderLoader.getTemplate(key), mergedTemplateData, {filename: path.join(this.renderLoader.getThemeTemplateRootPath(), key + '.html')});
  }

  async renderCategoryList() {
    const categorys = R.values(this.categorys).map((category) => ({
      name: category.aliasName || category.name,
      indexUrl: path.join('/', category.relativeOutputPath, 'index.html'),
      number: category.articles.length
    })).filter((category) => category.number > 0);

    const html = this.renderTemplate('categorylist', {
      title: this.options.BLOG.NAME,
      categorys: categorys
    });
    // await fsExtra.mkdirs(path.join(this.outputRoot, 'category'));
    const outputFilePath = path.join(this.outputRoot, 'category', 'index.html');
    // TODO extrac
    if (!fs.existsSync(path.join(this.outputRoot, 'category'))) {
      fs.mkdirSync(path.join(this.outputRoot, 'category'));
    }
    // await pfs.writeFile(outputFilePath, html);
    fs.writeFileSync(outputFilePath, html);
  }

  getBlogInformation() {
    return {
      author: this.options.AUTHOR.NAME,
      blogName: this.options.BLOG.NAME,
      blogDesc: this.options.BLOG.DESC
    };
  }

  renderArticle(data) {
    return this.renderTemplate('article', data);
  }


  async renderAllArticles(cb) {
    if (this.renderLoader.hasAllArticles()) {
      const allarticles = Object.keys(this.categorys).reduce((result, categoryName) => {
        return result.concat(this.categorys[categoryName].articles);
      }, []).sort((a, b) => {
        return b.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime() - a.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime();
      });

      const pageN = Math.ceil(allarticles.length / this.options.BLOG.ALL_PAGE_ARTICLE_NUMBER);

      const categorys = R.values(this.categorys).map(category => ({
        name: category.name,
        number: category.articles.length
      })).filter((category) => category.number > 0);

      const pageDirPath = path.join(this.outputRoot, 'page');
      if (!fs.existsSync(pageDirPath)) {
        fs.mkdirSync(pageDirPath);
      }

      await Promise.all(_.chunk(allarticles, this.options.BLOG.ALL_PAGE_ARTICLE_NUMBER).map(async (articles, i) => {
        const html = this.renderTemplate('allarticles', {
          title: this.options.BLOG.NAME,
          articles: articles,
          categorys: categorys,
          currentPageN: i,
          pageN: pageN,
          type: this.renderLoader.getThemeConfigure().INDEX_TYPE
        });

        // TODO 优化
        let outputPath;
        if (i === 0) {
          // TODO refactor function
          if (this.renderLoader.getThemeConfigure().INDEX_TYPE === 'one') { //TODO one 是什么鬼
            // 如果是 one 代表首页就是所有文章的第一页
            outputPath = this.outputRoot + '/page/' + (i + 1);
          } else {
            outputPath = this.outputRoot;
          }
        } else {
          outputPath = this.outputRoot + '/page/' + (i + 1);
        }

        if (!fs.existsSync(outputPath)) {
          await fs.mkdirSync(outputPath);
        }
        const outputFilePath = path.join(outputPath, 'index.html');
        await fs.writeFileAsync(outputFilePath, html);
      }));
    }
  }
}
