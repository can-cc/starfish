import bluebird from "bluebird";
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import ejs from 'ejs';
import fsExtra from 'fs-extra';

import {parseOrg, parseMarkDown} from './parse.js';
import {isFile, isDir, takeFileName, takeFileNameWithoutSuffix,
        getRelativePath, filterDotFiles, isSuffix, mergeForce} from './util';
import {warning, error} from './message';
import {MapDone} from './mapdone';
import {loadConfig} from './loadConfig.js';

const pfs = bluebird.promisifyAll(fs);

const HashNum = 7;

import R from 'fw-ramda';
const globToRegExp = require('glob-to-regexp');
const md5 = require('blueimp-md5');

import {syncMappingDirs, fixArticleUrlAndCut, getParsersFromModules, makeDocumentParserFn, getPlugin} from './render-util';

// for date util
require('sugar');

let htmlToText = require('html-to-text');
let dateFormat = require('dateformat');


import {getModifyDates} from '../util/git-date';

const isOrg = R.curry(isSuffix)('org');
const isMd = R.curry(isSuffix)('md');
const isYaml = R.curry(isSuffix)('yaml');

import {RenderManager} from './render-manager';

export class RenderController {
  constructor(inputPath, outputRoot, options) { // TODO merge inputPath, outputRoot
    this.inputPath = inputPath;
    this.outputRoot = outputRoot;
    this.categorys = {};
    this.theme = options.STYLE.THEME;
    this.options = options;
    this.rendering = false;

    this.pluginType = 'render';
    this.plugins = getPlugin(this.pluginType);

    // TODO remove
    const themeDir = path.isAbsolute(options.STYLE.THEMEDIR) ? options.STYLE.THEMEDIR : path.resolve(inputPath, options.STYLE.THEMEDIR);
    this.themePath = path.join(themeDir, this.theme);


    // methods
    this.loadRootIgnore();

    this.renderManager = new RenderManager(inputPath, outputRoot, options);

    this.parsers = getParsersFromModules();
    this.documentParserFn = makeDocumentParserFn(this.parsers);
  }

  async render() {
    if (this.rendering) {
      return;
    }
    this.rendering = true;
    this.clearData();

    await this.loadDir(this.inputPath, this.outputRoot, 'index');
    // TODO rename
    await this.copyStatic();
    await this.renderCategorys();

    // await Promise.all([this.copyStatic(), this.renderCategorys()]);

    // TODO check the f*ck
    this.rendering = false;
    this.runPluinAfter();
  }

  async loadDir(dirPath, outputPath, category) {
    const paths = await pfs.readdirAsync(dirPath).filter(this.filterIgnores.bind(this));

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    this.addCategory(category, dirPath, outputPath);

    const [files, dirs] = _.partition(paths, pathName => isFile(path.resolve(dirPath, pathName)));
    const fileNames = files.filter(file => filterDotFiles(file) && R.values(this.parsers).some(parser => parser.check(file)));

    await Promise.all(fileNames.map(async (fileName) => await this.addArticle(fileName, category)));

    const fileNameWithoutSuffixs = fileNames.map(file => takeFileNameWithoutSuffix(file));
    const [articleAsserts, subDirs] = _.partition(dirs, (dir) => fileNameWithoutSuffixs.indexOf(dir) >= 0);
    const shouldCopyArticleAssertNames = articleAsserts.filter((articleAssert) => fileNameWithoutSuffixs.indexOf(articleAssert) >= 0);

    await Promise.all(shouldCopyArticleAssertNames.map(async (shouldCopyArticleAssertName) => {
      await fsExtra.copy(path.join(dirPath, shouldCopyArticleAssertName), path.join(outputPath, shouldCopyArticleAssertName));
    }));

    const mappingRules = this.options.MAPPING || {};
    const [needMapping, subCateDirs] = R.splitIf(dir => Object.keys(mappingRules).indexOf(dir) >= 0, subDirs);
    syncMappingDirs(needMapping, mappingRules, dirPath, outputPath)

    await Promise.all(subCateDirs.map(async (subDir) => {
      await this.loadDir(path.join(dirPath, subDir), path.join(outputPath, subDir), subDir);
    }));
  }


  // TODO check options valid and dir valid
  checkVaild() {

  }

  loadRootIgnore() {
    this.rootIgnoreRegs = [];
    let self = this;
    let ignoreFilePath = path.join(this.inputPath, this.options.CONFIG.IGNORE_FILE);
    if (fs.existsSync(ignoreFilePath)) {
      fs.readFileSync(ignoreFilePath, 'utf-8').split('\n').forEach((globStr) => {
        self.rootIgnoreRegs.push(globToRegExp(globStr));
      });
    }
  }

  async copyStatic() {
    await fsExtra.copy(path.join(this.themePath, 'static'), path.join(this.outputRoot, 'static'));
  }

  runPluinEachArticle(rawDocument, articleInfo, cb) {
    R.values(this.plugins).forEach(plugin => {
      plugin.eachArticle(rawDocument, articleInfo, cb);
    });
  }

  runPluinAfter() {
    R.values(this.plugins).forEach(plugin => plugin.after())
  }
  // exec when after render
  renderAfter() {

  }

  // exec when before render
  renderBefore() {

  }

  checkIgnore() {

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

  // init category data
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

  renderTemp(key, data) {
    const mergedTemplateData = this.renderManager.mergeTemplateData(data);
    return ejs.render(this.renderManager.getTemplate(key), mergedTemplateData, {filename: path.join(this.renderManager.getThemeTemplateRootPath(), key + '.html')});
  }

  async renderCategoryList() {
    const categorys = R.values(this.categorys).map((category) => ({
      name: category.aliasName || category.name,
      indexUrl: path.join('/', category.relativeOutputPath, 'index.html'),
      number: category.articles.length
    })).filter((category) => category.number > 0);

    const html = this.renderTemp('categorylist', {
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

  // dispatch category or index
  async renderCategoryIndex(name, outputPath, articles) {
    const sorted = this.sortArticles(articles);
    const pageN = Math.ceil(sorted.length / this.options.BLOG.CATEGORY_ARTICLE_NUMBER);

    await Promise.all(_.chunk(sorted, this.options.BLOG.CATEGORY_ARTICLE_NUMBER).map(async (articleChunk, i) => {

      const data = {
        title: this.categorys[name].aliasName || name,
        articles: articleChunk,
        currentPageN: i,
        pageN: pageN,
        // FIXME
        type: 'category'
      };

      const html = this.renderTemp('category', data);
      const outputDir = i === 0 ? outputPath : path.join(outputPath, 'page', i + 1 + '/');

      await fsExtra.mkdirs(outputDir);
      const outputFilePath = path.join(outputDir, 'index.html');
      await fs.writeFileAsync(outputFilePath, html);
    }));
  }

  async generateArticleToRenderData(category, documentFile) {
    const outputPath = category.outputPath;
    const inputPath = category.inputPath;

    const filePath = path.join(inputPath, documentFile.fileName);
    const articleRawData = await pfs.readFileAsync(filePath, 'utf-8');
    const articleDoc = this.documentParserFn(filePath, articleRawData);
    if (!articleDoc) {
      throw new Error('can not parse this document', filePath);
    }
    const fileNameWithoutSuffix = takeFileNameWithoutSuffix(documentFile.fileName);
    const outputFilePath = path.join(outputPath, fileNameWithoutSuffix + '.html');
    const outputUrl = path.join('/', category.relativeOutputPath, fileNameWithoutSuffix + '.html');
    const relativeOutputPath = getRelativePath(this.outputRoot, outputPath);
    const [content, contentPart] = fixArticleUrlAndCut(articleDoc.content, relativeOutputPath, this.options.BLOG.ARTICLE_SUMMARY_CHAR_NUMBER);

    return R.merge(documentFile, {
      id: md5(filePath).substring(0, HashNum),
      title: articleDoc.title,
      content: content,
      category: category,
      createDate: documentFile.dateInfo.create,
      author: this.options.AUTHOR.NAME,
      blogName: this.options.BLOG.NAME,
      blogDesc: this.options.BLOG.DESC,
      relativeOutputPath: relativeOutputPath,
      outputfilename: fileNameWithoutSuffix + '.html',
      outputUrl: outputUrl,
      contentPart: contentPart,
      type: articleDoc.type,
      showTime: documentFile.dateInfo.create.format('long', this.options.LANG || this.renderManager.getThemeConfigure.LANG)
    });
  }

  async renderArticle() {

  }

  async renderCategory(category) {
    const outputPath = category.outputPath;
    const inputPath = category.inputPath;

    await Promise.all(category.articles.map(async (articleInfo) => {
      const filePath = path.join(inputPath, articleInfo.fileName);
      const articleRawData = await pfs.readFileAsync(filePath, 'utf-8');
      const articleDoc = this.documentParserFn(filePath, articleRawData);
      if (!articleDoc) {
        throw new Error('can not parse this document', filePath);
      }

      const fileNameWithoutSuffix = takeFileNameWithoutSuffix(articleInfo.fileName);
      const outputFilePath = path.join(outputPath, fileNameWithoutSuffix + '.html');
      const outputUrl = path.join('/', category.relativeOutputPath, fileNameWithoutSuffix + '.html');
      const relativeOutputPath = getRelativePath(this.outputRoot, outputPath);
      const [content, contentPart] = fixArticleUrlAndCut(articleDoc.content, relativeOutputPath, this.options.BLOG.ARTICLE_SUMMARY_CHAR_NUMBER);

      mergeForce(articleInfo, {
        id: md5(filePath).substring(0, HashNum),
        title: articleDoc.title,
        content: content,
        summary: contentPart, // rename
        contentPart, // remove
        category: category,
        createDate: articleInfo.dateInfo.create,
        author: this.options.AUTHOR.NAME,
        blogName: this.options.BLOG.NAME,
        blogDesc: this.options.BLOG.DESC,
        fileNameWithoutSuffix,
        relativeOutputPath: relativeOutputPath,
        outputfilename: fileNameWithoutSuffix + '.html',
        outputUrl,
        outputFilePath,
        type: articleDoc.type,
        showTime: articleInfo.dateInfo.create.format('long', this.options.LANG || this.renderManager.getThemeConfigure.LANG)
      });
      const result = this.renderTemp('article', articleInfo);
      this.runPluinEachArticle(articleRawData, articleInfo);
      // await pfs.writeFile(outputFilePath, result);
      fs.writeFileSync(outputFilePath, result);
      return articleInfo;
    }));
    category.articles = await Promise.all(category.articles.map(R.curry(this.generateArticleToRenderData)(category).bind(this)));

    await this.renderCategoryIndex(category.name, outputPath, category.articles);
  }


  async renderIndex() {
    // TODO refactor function
    if (this.renderManager.getThemeConfigure().INDEX_TYPE !== 'one') {
      return;
    }

    const allarticles = Object.keys(this.categorys).reduce((result, categoryName) => {
      return result.concat(this.categorys[categoryName].articles);
    }, []).sort((a, b) => {
      return b.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime() - a.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime();
    });


    const categorys = R.values(this.categorys).map(category => ({name: category.aliasName || category.name, indexUrl: path.join('/', category.relativeOutputPath, 'index.html'), number: category.articles.length}))
          .filter((category) => category.number > 0);

    const html = this.renderTemp('index', {
      title: this.options.BLOG.NAME,
      blogDesc: this.options.BLOG.DESC,
      articles: R.take(this.options.BLOG.INDEX_ARTICLE_NUMBER, allarticles),
      categorys: categorys
    });

    const outputFilePath = path.join(this.outputRoot, 'index.html');
    await pfs.writeFileAsync(outputFilePath, html);
  }

  async renderAllArticles(cb) {
    if (this.renderManager.hasAllArticles()) {
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
        const html = this.renderTemp('allarticles', {
          title: this.options.BLOG.NAME,
          articles: articles,
          categorys: categorys,
          currentPageN: i,
          pageN: pageN,
          type: this.renderManager.getThemeConfigure.INDEX_TYPE
        });

        // TODO 优化
        let outputPath;
        if (i === 0) {
          // TODO refactor function
          if (this.renderManager.getThemeConfigure.INDEX_TYPE === 'one') { //TODO one 是什么鬼
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
