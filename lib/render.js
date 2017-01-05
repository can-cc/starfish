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

const R = require('fw-ramda');
const async = require('async');
const globToRegExp = require('glob-to-regexp');
const md5 = require('blueimp-md5');

import {syncMappingDirs} from './render-util';

// for date util
require('sugar');

let htmlToText = require('html-to-text');
let dateFormat = require('dateformat');

var cheerio = require('cheerio');

const makeParse = (parsers) => {
  const modules = fs.readdirSync(path.resolve(__dirname, '../node_modules'))
        .filter((moduleName) => /^nobbb-parse/.test(moduleName))
        .forEach((moduleName) => {parsers[moduleName] = (new (require(moduleName).default)())});
  
  return (filePath, data) => {
    const fileName = takeFileName(filePath);
    for (const i in parsers) {
      if (parsers[i].check(fileName)) {
        const filenameWithoutSuffix = takeFileNameWithoutSuffix(filePath);
        const document = parsers[i].parse(data);
        return {
          fileName: fileName,
          title: document.title,
          content: document.content,
          type: parsers[i].name
        };
      }
    }
    return null;
  };
};

const getPlugin = function(type) {
  const plugins = [];
  fs.readdirSync(path.resolve(__dirname, '../node_modules'))
    .filter(filterDotFiles)
    .filter(name => /^nobbb-plugin/.test(name))
    .forEach((name) => {
      if( !plugins[name] ){
        let plugin = new (require(path.resolve(__dirname, '../node_modules/', name)).default)();
        if( plugin.type === type ){
          plugins[plugin.getName()] = plugin;
        }
      } else {
        throw new Error('duplicate plugin');
      }
    });
  return plugins;
};

// refactor
const parsers = [];
const parseToData = makeParse(parsers);

import {getModifyDates} from '../util/git-date';

const isOrg = R.curry(isSuffix)('org');
const isMd = R.curry(isSuffix)('md');
const isYaml = R.curry(isSuffix)('yaml');

export class RenderController {
  constructor(inputPath, outputRoot, options) { // TODO merge inputPath, outputRoot
    this.inputPath = inputPath;
    this.outputRoot = outputRoot;
    this.categorys = {};
    this.theme = options.STYLE.THEME;
    this.options = options;
    this.rendering = false;

    this.plugins = getPlugin('render');
    
    const themeDir = options.STYLE.THEMEDIR[0] === '/' ? options.STYLE.THEMEDIR : path.resolve(inputPath, options.STYLE.THEMEDIR);
    this.themePath = path.join(themeDir, this.theme);
    this.templates = {};

    // methods
    this.loadRootIgnore();
  }

  // TODO check options valid and dir valid
  checkVaild() {

  }

  loadLangData() {
    const lang = this.lang = this.options.LANG || this.themeConfig.LANG;
    const langFiles = fs.readdirSync(path.join(this.themePath, 'lang'))
          .filter(filterDotFiles).filter(isYaml);

    if( langFiles.indexOf(lang + '.yaml') > 0 ){
      this.langData = loadConfig(path.join(this.themePath, 'lang', lang + '.yaml'));
    } else {
      this.langData = loadConfig(path.join(this.themePath, 'lang', 'default.yaml'));
    }
  }

  loadTextData() {
    this.textData = this.themeConfig.TEXT || {};
  }

  loadLinkData() {
    this.linkData = this.themeConfig.LINK || {};

  }

  loadImgData() {
    this.imgData = this.themeConfig.IMG;
  }

  loadThemeConfig() {
    this.themeConfig = loadConfig(path.join(this.themePath, this.options.CONFIG.CONFIG_FILE));
  }

  loadTemplates() {
    const tempPath = this.tempPath = path.join(this.themePath, 'templates');
    fs.readdirSync(tempPath)
      .filter(filterDotFiles)
      .filter(f => isFile(path.join(tempPath, f)))
      .forEach((filePath) => {
        const key = takeFileNameWithoutSuffix(filePath);
        this.templates[key] = fs.readFileSync(path.join(tempPath, filePath), 'utf-8');
      });
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

  mergeLangData(data) {
    mergeForce(data, {
      LANG: this.langData
    });
  }

  mergeTextData(data) {
    mergeForce(data, {
      TEXT: this.textData
    });
  }

  mergeLinkData(data) {
    mergeForce(data, {
      LINK: this.linkData
    });
  }

  mergeImgData(data) {
    mergeForce(data, {
      IMG: this.imgData
    });
  }
  
  runPluinEachArticle(rawDocument, articleInfo, cb) {
    R.values(this.plugins).forEach(plugin => {
      plugin.eachArticle(rawDocument, articleInfo, cb);
    });
  }

  runPluinAfter() {
    R.values(this.plugins).forEach(plugin => {
      plugin.after();
    })
  }
  
  async render(cb) {
    if (this.rendering) {
      return cb();
    }
    this.rendering = true;
    this.clearData();
    
    this.loadThemeConfig();
    this.loadTemplates();
    this.loadTextData();
    this.loadLangData();
    this.loadImgData();
    this.loadLinkData();
    
    await this.loadDir(this.inputPath, this.outputRoot, 'index');
    // TODO rename
    await this.copyStatic();
    await this.renderCategorys();
    // TODO check the f*ck 
    this.rendering = false;
    this.runPluinAfter();
    cb();
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
  
  async loadDir(dirPath, outputPath, category) {
    const paths = await pfs.readdirAsync(dirPath).filter(this.filterIgnores.bind(this));

    if (!fs.existsSync(outputPath)) {
      await fs.mkdir(outputPath);
    }

    this.addCategory(category, dirPath, outputPath);

    const [files, dirs] = _.partition(paths, pathName => isFile(path.resolve(dirPath, pathName)));
    const fileNames = files.filter(file => filterDotFiles(file) && R.values(parsers).some(parser => parser.check(file)));

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

  // add article info to category.articles array
  async addArticle(fileName, category) {
    const dateInfo = await getModifyDates(path.join(this.categorys[category].inputPath, fileName), this.inputPath);
    this.categorys[category].articles.push({
      fileName: fileName,
      dateInfo: dateInfo
    });
  }

  // clear data
  clearData() {
    this.categorys = [];
  }

  // init category data
  addCategory(name, inputPath, outputPath) {
    let configFilePath = path.join(inputPath, this.options.CONFIG.DIR_CONFIG_FILE);

    this.categorys[name] = {
      name: name,
      outputPath: outputPath,
      inputPath: inputPath,
      relativeOutputPath: getRelativePath(this.outputRoot, outputPath),
      articles: []
    };
    
    if (fs.existsSync(configFilePath)) {
      let dirConfig = loadConfig(configFilePath);
      mergeForce(this.categorys[name], dirConfig);
    }
  }
  
  // TODO
  // cut content for index and category display
  static fixArticleUrlAndCut(content, relativeOutputPath, cutLimit) {
    // let text = htmlToText.fromString(content, {
    //     wordwrap: 130
    // });
    //return text.substring(0, ARTICLE_SUMMARY_CHAR_NUMBER);
    let $ = cheerio.load(content);

    var appendRelativeFn = function(i, e) {
      let src = $(this).attr('src');
      
      if( !/^[http|//]/.test(src) ){
        src = path.join('/', relativeOutputPath, src);
      }
      $(this).attr('src', src);
    };
    
    $('img').each(appendRelativeFn);
    $('script').each(appendRelativeFn);

    let ps = $('h1, h2, h3, h4, h5, h6, p'),
    summary = '';

    for(let i = 0, max = ps.length; i < max; i++) {
      summary += $(ps[i]).text();
      if( summary.length > cutLimit ){
        summary = summary.substring(0, cutLimit);
        break;
      } else if(i !== max - 1) {
        summary += '<br/>';
      }
    }
    return [$.html(), summary];
  }


  static cutOffArticle(content, number) {
    let text = htmlToText.fromString(content, {
      wordwrap: number,
      ignoreImage: true,
      ignoreHref: true
    });
    return text.substring(0, number);
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
        const category = this.categorys[name];  
        await this.renderCategory(category);
      }
    }));
    await this.renderAllArticles();
    await this.renderIndex();
    await this.renderCategoryList();
  }

  renderTemp(key, data) {
    this.mergeLangData(data);
    this.mergeTextData(data);
    this.mergeImgData(data);
    this.mergeLinkData(data);
    return ejs.render(this.templates[key], data, {
      filename: path.join(this.tempPath, key + '.html')
    });
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
    const outputFilePath = path.join(this.outputRoot, 'category', 'index.html');
    await fsExtra.mkdirs(path.join(this.outputRoot, 'category'));
    await pfs.writeFile(outputFilePath, html);
  }

  // dispatch category or index
  async renderCategoryIndex(name, outputPath, articles, cb) {
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
    cb && cb();
  }
  

  async renderCategory(category, cb) {
    const outputPath = category.outputPath;
    const inputPath = category.inputPath;

    await Promise.all(category.articles.map(async (articleInfo) => {
      const filePath = path.join(inputPath, articleInfo.fileName);
      const articleRawData = await pfs.readFileAsync(filePath, 'utf-8');
      const articleDoc = parseToData(filePath, articleRawData);
      if (!articleDoc) {
        throw new Error('can not parse this document', filePath);
      }

      const fileNameWithoutSuffix = takeFileNameWithoutSuffix(articleInfo.fileName);
      const outputFilePath = path.join(outputPath, fileNameWithoutSuffix + '.html');
      const outputUrl = path.join('/', category.relativeOutputPath, fileNameWithoutSuffix + '.html');
      const relativeOutputPath = getRelativePath(this.outputRoot, outputPath);
      const [content, contentPart] = RenderController.fixArticleUrlAndCut(articleDoc.content, relativeOutputPath, this.options.BLOG.ARTICLE_SUMMARY_CHAR_NUMBER);
      
      mergeForce(articleInfo, {
        id: md5(filePath).substring(0, HashNum),
        title: articleDoc.title,
        content: content,
        category: category,
        createDate: articleInfo.dateInfo.create,
        author: this.options.AUTHOR.NAME,
        blogName: this.options.BLOG.NAME,
        blogDesc: this.options.BLOG.DESC,
        relativeOutputPath: relativeOutputPath,
        outputfilename: fileNameWithoutSuffix + '.html',
        outputUrl: outputUrl,
        contentPart: contentPart,
        type: articleDoc.type,
        showTime: articleInfo.dateInfo.create.format('long', this.options.LANG || this.themeConfig.LANG)
      });
      const result = this.renderTemp('article', articleInfo);
      this.runPluinEachArticle(articleRawData, articleInfo);
      await pfs.writeFile(outputFilePath, result);    
    }));
    await this.renderCategoryIndex(category.name, outputPath, category.articles, cb);
  }

  async renderIndex() {
    // TODO refactor function
    if (this.themeConfig.INDEX_TYPE !== 'one') {
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
      categorys: categorys,
      // TODO
      TEXT: this.textData
    });
    
    const outputFilePath = path.join(this.outputRoot, 'index.html');
    await pfs.writeFileAsync(outputFilePath, html);
  }

  async renderAllArticles(cb) {
    if (this.templates['allarticles']) {
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
        await pfs.mkdir(pageDirPath);
      }

      await Promise.all(_.chunk(allarticles, this.options.BLOG.ALL_PAGE_ARTICLE_NUMBER).map(async (articles, i) => {
        const html = this.renderTemp('allarticles', {
          title: this.options.BLOG.NAME,
          articles: articles,
          categorys: categorys,
          currentPageN: i,
          pageN: pageN,
          type: this.themeConfig.INDEX_TYPE
        });

        // TODO 优化
        let outputPath;
        if (i === 0) {
          if (this.themeConfig.INDEX_TYPE === 'one') {
            outputPath = this.outputRoot + '/page/' + (i + 1);
          } else {
            outputPath = this.outputRoot;
          }
        } else {
          outputPath = this.outputRoot + '/page/' + (i + 1);
        }

        if (!fs.existsSync(outputPath)) {
          await pfs.mkdir(outputPath);
        }
        const outputFilePath = path.join(outputPath, 'index.html');
        await fs.writeFileAsync(outputFilePath, html);
      })); 
    }
  }

  searchKeyWord() {
    
  }
  
  toHtml() {

  }
}
