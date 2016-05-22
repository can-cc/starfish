'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';

//import * as path from 'path';

import {parseOrg, parseMarkDown} from './parse.js';
import {isFile, isDir, takeFileName, takeFileNameWithoutSuffix,
        getRelativePath, filterDotFiles, isSuffix, mergeForce} from './util';
import {warning, error} from './message';
import {MapDone} from './mapdone';
import {loadConfig} from './loadconfig.js';

let R = require('fw-ramda');
let async = require('async');
let globToRegExp = require('glob-to-regexp');


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
    return (filePath, cb) => {
        R.values(parsers).forEach((parseModule) => {
            if( parseModule.check(filePath) ) {
                let fileName = takeFileName(filePath),
                    filenameWithoutSuffix = takeFileNameWithoutSuffix(filePath);
                
                fs.readFile(filePath, 'utf-8', (err, data) => {
                    if( err ){
                        throw err;
                    } else {
                        let document = parseModule.parse(data);                        
                        return cb(null, {
                            fileName: fileName,
                            title: document.title,
                            content: document.content,
                            type: parseModule.name
                        });
                    }
                });
            }
        });
    };
};

let parsers = [];
let parseToData = makeParse(parsers);

var exec = require('child_process').exec;
let getModifyDates = (filePath, rootInputPath, cb) => {
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

let isOrg = R.curry(isSuffix)('org'),
    isMd = R.curry(isSuffix)('md'),
    isYaml = R.curry(isSuffix)('yaml');

export class RenderController {
    constructor(inputPath, outputRoot, options) {
        this.inputPath = inputPath;
        this.outputRoot = outputRoot;
        this.categorys = {};
        this.theme = options.STYLE.THEME;
        this.options = options;
        this.rendering = false;
        
        let themeDir = options.STYLE.THEMEDIR[0] === '/' ? options.STYLE.THEMEDIR :
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
        let lang = this.lang = this.options.LANG || this.themeConfig.LANG;
        let langFiles = fs.readdirSync(path.join(this.themePath, 'lang'))
            .filter(filterDotFiles)
            .filter(isYaml);

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
        let ignoreFilePath = path.join(this.outputRoot, this.options.CONFIG.IGNORE_FILE);
        if (fs.existsSync(ignoreFilePath)) {
            fs.readFileSync(ignoreFilePath).split('\n').forEach((globStr) => {
                this.rootIgnoreRegs.push(globToRegExp(globStr));
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
    
    render(cb) {
        if( this.rendering ){
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
        
        this.loadDir(this.inputPath, this.outputRoot, 'index', () => {            
            this.copyStatic(cb);
        });
    }

    checkIgnore() {
        
    }
    
    loadDir(dirPath, outputPath, category, cb) {
        let self = this;
        fs.readdir(dirPath, (err, paths) => {
            fs.mkdir(outputPath, () => {
                
                self.addCategory(category, dirPath, outputPath);

                let [files, dirs] = _.partition(paths, (pathName) => {
                    return isFile(path.resolve(dirPath, pathName));
                });

                let mapdone = new MapDone(cb);
                
                let fileNames = files.filter((file) => {
                    return self.rootIgnoreRegs.every((reg) => {
                        return !reg.rest(file);
                    });
                }).filter((file) => {
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

                articleAsserts.filter((articleAssert) => {
                    return fileNames.indexOf(articleAssert) >= 0;
                }).map((articleAssert) => {
                    fsExtra.copy(path.join(dirPath, articleAssert),
                                 path.join(outputPath, articleAssert), mapdone.reg());
                });
                
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
            });
        });
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
                a.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime();;
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
            parseToData(path.join(inputPath, articleInfo.fileName), (err, articleDoc) => {
                
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
                    title: articleDoc.title,
                    content: content,
                    category: category,
                    createDate: articleInfo.dateInfo.create,
                    author: self.options.AUTHOR.NAME,
                    blogName: self.options.BLOG.NAME,
                    relativeOutputPath: relativeOutputPath,
                    outputfilename: fileNameWithoutSuffix + '.html',
                    outputUrl: outputUrl,
                    contentPart: contentPart,
                    type: articleDoc.type,
                    showTime: articleInfo.dateInfo.create.format('long', this.options.LANG || this.themeConfig.LANG)
                });
                
                var result = self.renderTemp('article', articleInfo);
                
                fs.writeFile(outputFilePath, result, (err) => {
                    asyncCb(err);                    
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
            articles: R.take(self.options.BLOG.INDEX_ARTICLE_NUMBER, allarticles),
            categorys: categorys
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
