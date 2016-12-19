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

const HashNum = 7;

const R = require('fw-ramda');
const async = require('async');
const globToRegExp = require('glob-to-regexp');
const md5 = require('blueimp-md5');

// for date util
require('sugar');

let htmlToText = require('html-to-text');
let dateFormat = require('dateformat');

var cheerio = require('cheerio');

let makeParse = (parsers) => {
  let modules = fs.readdirSync(path.resolve(__dirname, '../node_modules'))
      .filter((moduleName) => {
        return /^nobbb-parse/.test(moduleName);
      })
      .forEach((moduleName) => {
        parsers[moduleName] = (new (require(moduleName).default)());
      });
  
  return (filePath, data, cb) => {
    R.values(parsers).forEach((parseModule) => {
      let fileName = takeFileName(filePath)

      if( parseModule.check(fileName) ) {
        let filenameWithoutSuffix = takeFileNameWithoutSuffix(filePath);
        let document = parseModule.parse(data);
        return cb(null, {
          fileName: fileName,
          title: document.title,
          content: document.content,
          type: parseModule.name
        });
      }
    });
  };
};

const getPlugin = function(type) {
  let plugins = [];
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

const parsers = [];
const parseToData = makeParse(parsers);

var exec = require('child_process').exec;
const getModifyDates = (filePath, rootInputPath, cb) => {
  exec(`git log --pretty=format:\'%ad\' ${filePath} | cat`, {
    cwd: rootInputPath
  }, function (error, stdout, stderr) {
    let dates =  stdout.split('\n');
    cb({
      create: new Date(_.last(dates) || new Date()),
      modify: new Date(_.head(dates) || new Date())
    });
  });
};

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
    
    const themeDir = options.STYLE.THEMEDIR[0] === '/' ? options.STYLE.THEMEDIR :
        path.resolve(inputPath, options.STYLE.THEMEDIR);
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
    let tempPath = this.tempPath = path.join(this.themePath, 'templates');
    let self = this;
    fs.readdirSync(tempPath)
      .filter(filterDotFiles)
      .filter((f) => {
        return isFile(path.join(tempPath, f));
      })
      .forEach((filePath) => {
        let key = takeFileNameWithoutSuffix(filePath);
        self.templates[key] = fs.readFileSync(path.join(tempPath, filePath), 'utf-8');
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

  copyStatic(cb) {
    let self = this;
    fsExtra.copy(path.join(this.themePath, 'static'),
                 path.join(this.outputRoot, 'static'), () => {
                   self.renderCategorys(() => {
                     this.rendering = false;
                     cb();
                   });
                 });
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
  
  render(cb) {
    if( this.rendering ){
      return cb();
    }
    const self = this;
    this.rendering = true;
    this.clearData();
    
    this.loadThemeConfig();
    this.loadTemplates();
    this.loadTextData();
    this.loadLangData();
    this.loadImgData();
    this.loadLinkData();
    
    this.loadDir(this.inputPath, this.outputRoot, 'index', () => {
      // TODO 优化 同步
      this.copyStatic(function(){
        // RUN plugin after
        self.runPluinAfter();
        cb();
      });
    });
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
  
  loadDir(dirPath, outputPath, category, cb) {
    let self = this;
    
    return new Promise((resolve, reject) => {
      fs.readdir(dirPath, (err, paths) => {
        err && reject(err);
        fs.mkdir(outputPath, (err) => {
          return resolve(paths);
        });
      });
    }).then((paths) => {
      self.addCategory(category, dirPath, outputPath);
      
      //paths = paths.filter()
      let [files, dirs] = _.partition(paths, pathName => isFile(path.resolve(dirPath, pathName)));
      
      let mapdone = new MapDone(cb);
      
      //async.each()  
      let fileNames = files
          .filter(self.filterIgnores.bind(self))
          .filter((file) => {
          return filterDotFiles(file) &&
            R.values(parsers).some(parser => parser.check(file));
        }).map((file) => {
          let fileNameWithoutSuffix = takeFileNameWithoutSuffix(file);
          self.addArticle(file, category, mapdone.reg());
          return fileNameWithoutSuffix;
        });
      
      let [articleAsserts, subDirs] = _.partition(dirs, (dir) => {
        return fileNames.indexOf(dir) >= 0;
      });

      let shouldCopyArticleAssertNames = articleAsserts.filter((articleAssert) => {
        return fileNames.indexOf(articleAssert) >= 0;
      });

      // FIXME
      let d = mapdone.reg();
      async.each(shouldCopyArticleAssertNames, (shouldCopyArticleAssertName, asyncCb) => {
        fsExtra.copy(path.join(dirPath, shouldCopyArticleAssertName),
                     path.join(outputPath, shouldCopyArticleAssertName), asyncCb);
      }, (error) => {
        if( error ){
          throw error;
        }
        d();
      });
      
      const mappingDirs = self.options.MAPPING || {};
      const [needMapping, subCateDirs] = R.splitIf(dir => Object.keys(mappingDirs).indexOf(dir) >= 0, subDirs);
      
      subDirs.filter((subDir) => {
        if( subDir === '@root-assert' ){
          fsExtra.copy(path.join(dirPath, subDir),
                       path.join(outputPath), mapdone.reg());
        }

        // TODO remove
        if( subDir === '@image' ){
          fsExtra.copy(path.join(dirPath, subDir),
                       path.join(outputPath, 'static/image'), mapdone.reg());
        }

        if( subDir === '@demo' ){
          fsExtra.copy(path.join(dirPath, subDir),
                       path.join(outputPath, 'demo'), mapdone.reg());
        }
        
        return subDir[0] !== '@';
        
      }).map((subDir) => {
        self.loadDir(path.join(dirPath, subDir), 
                     path.join(outputPath, subDir), subDir, mapdone.reg());
      });
      
      mapdone.done();
    }).catch(error => {throw new Error(error)});
    
  }

  // add article info to category.articles array
  addArticle(fileName, category, cb){
    let self = this;
    getModifyDates(path.join(this.categorys[category].inputPath, fileName), this.inputPath, (dateInfo) => {
      self.categorys[category].articles.push({
        fileName: fileName,
        dateInfo: dateInfo
      });
      cb();
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
  renderCategorys(cb) {
    if( !this.categorys ){
      return cb();
    }

    let self = this;
    async.each(Object.keys(this.categorys), (name, callback) => {
      
      // if articles lenght === 0; drop it
      if( self.categorys[name].articles.length === 0 ){
        return callback();
      } else {
        let category = self.categorys[name];
        
        self.renderCategory(category, () => {
          return callback();
        });
      }
    }, (err) => {
      if( err ){
        throw err;
      }
      self.renderAllArticles();
      self.renderIndex(cb);
      self.renderCategoryList();
    });
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

  renderCategoryList(cb) {
    let self = this;
    var categorys = R.values(self.categorys).map((category) => {
      return {
        name: category.aliasName || category.name,
        indexUrl: path.join('/', category.relativeOutputPath, 'index.html'),
        number: category.articles.length
      };
    }).filter((category) => {
      return category.number > 0;
    });

    var html = this.renderTemp('categorylist', {
      title: self.options.BLOG.NAME,
      categorys: categorys
    });
    
    let outputFilePath = path.join(self.outputRoot, 'category', 'index.html');
    fsExtra.mkdirs(path.join(self.outputRoot, 'category'), (err) => {
      if( err ){
        return Error(err);
      }
      fs.writeFile(outputFilePath, html, (err) => {
        if( err ){
          return Error(err);
        }
        cb && cb();
      });
    });
    
  }

  // dispatch category or index
  renderCategoryIndex(name, outputPath, articles, cb) {
    let self = this;

    let sorted = this.sortArticles(articles);
    
    let pageN = Math.ceil(sorted.length / this.options.BLOG.CATEGORY_ARTICLE_NUMBER);
    
    let mapdone = new MapDone(cb);
    _.chunk(sorted, this.options.BLOG.CATEGORY_ARTICLE_NUMBER).map((articleChunk, i) => {
      let done = mapdone.reg();
      
      let data = {
        title: self.categorys[name].aliasName || name,
        articles: articleChunk,
        currentPageN: i,
        pageN: pageN,
        // FIXME
        type: 'category'
      };
      
      let html = self.renderTemp('category', data);

      
      let outputDir = i === 0 ? outputPath : path.join(outputPath, 'page', i + 1 + '/');
      
      fsExtra.mkdirs(outputDir, (err) => {
        if( err ){
          Error(err);
        }

        let outputFilePath = path.join(outputDir, 'index.html');

        fs.writeFile(outputFilePath, html, (err) => {
          done();
        });
      });
    });
    
  }
  

  renderCategory(category, cb) {
    let self = this;
    let outputPath = category.outputPath,
    inputPath = category.inputPath;
    
    
    async.each(category.articles, (articleInfo, asyncCb) => {
      
      let filePath = path.join(inputPath, articleInfo.fileName);

      new Promise((resovle) => {
        fs.readFile(filePath, 'utf-8', (error, data) => {
          error && asyncCb(error);
          resovle(data);
        });
      }).then(articleRawData => {

        
        
        parseToData(filePath, articleRawData, (err, articleDoc) => {
          
          if( err ){
            return asyncCb(err);
          }
          
          let fileNameWithoutSuffix = takeFileNameWithoutSuffix(articleInfo.fileName);
          let outputFilePath = path.join(outputPath, fileNameWithoutSuffix + '.html'),
              outputUrl = path.join('/', category.relativeOutputPath, fileNameWithoutSuffix + '.html');
          
          let relativeOutputPath = getRelativePath(self.outputRoot, outputPath);
          
          let [content, contentPart] = RenderController.fixArticleUrlAndCut(articleDoc.content, relativeOutputPath, self.options.BLOG.ARTICLE_SUMMARY_CHAR_NUMBER);
          
          //contentPart = RenderController.cutOffArticle(articleDoc.content, this.options.BLOG.ARTICLE_SUMMARY_CHAR_NUMBER);
          
          mergeForce(articleInfo, {
            id: md5(filePath).substring(0, HashNum),
            title: articleDoc.title,
            content: content,
            category: category,
            createDate: articleInfo.dateInfo.create,
            author: self.options.AUTHOR.NAME,
            blogName: self.options.BLOG.NAME,
            blogDesc: self.options.BLOG.DESC,
            relativeOutputPath: relativeOutputPath,
            outputfilename: fileNameWithoutSuffix + '.html',
            outputUrl: outputUrl,
            contentPart: contentPart,
            type: articleDoc.type,
            showTime: articleInfo.dateInfo.create.format('long', this.options.LANG || this.themeConfig.LANG)
          });
          
          var result = self.renderTemp('article', articleInfo);

          // Run plugins
          self.runPluinEachArticle(articleRawData, articleInfo);
          
          fs.writeFile(outputFilePath, result, (err) => {
            asyncCb(err);                    
          });
          
        });
      });
      
    }, (err) => {
      if( err ){
        throw err;
      }
      let outputPath = category.outputPath;
      self.renderCategoryIndex(category.name, outputPath, category.articles, cb);
    });        
  }

  renderIndex(cb) {
    if( this.themeConfig.INDEX_TYPE !== 'one' ){
      return cb();
    }

    let allarticles = Object.keys(this.categorys).reduce((result, categoryName) => {
      return result.concat(this.categorys[categoryName].articles);
    }, []).sort((a, b) => {
      return b.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime() -
        a.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime();
    });
    
    let self = this;

    var categorys = R.values(self.categorys).map((category) => {
      return {
        name: category.aliasName || category.name,
        indexUrl: path.join('/', category.relativeOutputPath, 'index.html'),
        number: category.articles.length
      };
    }).filter((category) => {
      return category.number > 0;
    });


    var html = this.renderTemp('index', {
      title: self.options.BLOG.NAME,
      blogDesc: self.options.BLOG.DESC,
      articles: R.take(self.options.BLOG.INDEX_ARTICLE_NUMBER, allarticles),
      categorys: categorys,
      // TODO
      TEXT: self.textData
    });
    
    let outputFilePath = path.join(self.outputRoot, 'index.html');
    fs.writeFile(outputFilePath, html, (err) => {
      if( err ){
        throw err;
      }
      cb();
    });
    
  }

  renderAllArticles(cb) {
    if( this.templates['allarticles'] ){
      let allarticles = Object.keys(this.categorys).reduce((result, categoryName) => {
        return result.concat(this.categorys[categoryName].articles);
      }, []).sort((a, b) => {
        return b.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime() -
          a.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime();
      });

      let mapdone = new MapDone(cb);

      let self = this;
      
      let pageN = Math.ceil(allarticles.length / this.options.BLOG.ALL_PAGE_ARTICLE_NUMBER);

      var categorys = R.values(self.categorys).map((category) => {
        return {
          name: category.name,
          number: category.articles.length
        };
      }).filter((category) => {
        return category.number > 0;
      });
      
      _.chunk(allarticles, this.options.BLOG.ALL_PAGE_ARTICLE_NUMBER).map((articles, i) => {
        let done = mapdone.reg();
        
        let html = self.renderTemp('allarticles', {
          title: self.options.BLOG.NAME,
          articles: articles,
          categorys: categorys,
          currentPageN: i,
          pageN: pageN,
          //offsetN: self.themeConfig.PAGING_START_N
          type: self.themeConfig.INDEX_TYPE
        });

        let outputPath;
        if( i === 0 ){
          if( self.themeConfig.INDEX_TYPE === 'one' ){
            outputPath = this.outputRoot + '/page/' + (i + 1);
          } else {
            outputPath = this.outputRoot;
          }
        } else {
          outputPath = this.outputRoot + '/page/' + (i + 1);
        }
        
        fsExtra.mkdirs(outputPath, (err) => {
          if( err ){
            Error(err);
          }

          let outputFilePath = path.join(outputPath, 'index.html');
          fs.writeFile(outputFilePath, html, (err) => {
            if( err ){
              Error(err);
            }
            done();
          });
        });

      }); 
    }
  }

  searchKeyWord() {
    
  }
  
  toHtml() {

  }
}
