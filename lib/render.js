'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';

//import * as path from 'path';


// import {INDEX_ARTICLE_NUMBER, ARTICLE_SUMMARY_CHAR_NUMBER, SORT_ARTICLE_BY,
//         BLOG_NAME} from '../config.js';

import {parseOrg, parseMarkDown} from './parse.js';
import {isFile, isDir, takeFileName, takeFileNameWithoutSuffix, getRelativePath, filterDotFiles, isSuffix} from './util';
import {warning, error} from './message';
import {MapDone} from './mapdone';
import {readConfigure} from './loadconfig.js';

let R = require('fw-ramda');
let async = require('async');

let htmlToText = require('html-to-text');
let dateFormat = require('dateformat');

var cheerio = require('cheerio');

const themePath = 'themes';


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


import {ignoreNames} from '../config';


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
    isMd = R.curry(isSuffix)('md');


export class RenderController {
    constructor(inputPath, outputRoot, options) {
        this.inputPath = inputPath;
        this.outputRoot = outputRoot;
        this.categorys = {};
        this.theme = options.STYLE.THEME;
        this.options = options;
        this.rendering = false;
    }

    static renderDir(dirPath, theme, outputPath, cb) {
        let renderController = new RenderController(dirPath, outputPath, theme);
        renderController.render(cb);
    }

    render(cb) {
        if( this.rendering ){
            return cb();
        }
        this.rendering = true;
        this.clearData();
        let self = this;
        
        this.loadDir(this.inputPath, this.outputRoot, 'index', () => {
            
            // TODO rename static
            fsExtra.copy(path.join(themePath, this.theme, 'static'),
                         path.join(this.outputRoot, 'static'), () => {
                             
                             self.renderCategorys(() => {
                                 this.rendering = false;
                                 cb();
                             });
                         }); 
        });
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
                    return ignoreNames.indexOf(file) < 0;
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
        this.categorys[name] = {
            name: name,
            outputPath: outputPath,
            inputPath: inputPath,
            relativeOutputPath: getRelativePath(this.outputRoot, outputPath),
            articles: []
        };
    }

    // TODO
    // cut content for index and category display
    static cutOffArticle(content, relativeOutputPath) {
        // let text = htmlToText.fromString(content, {
        //     wordwrap: 130
        // });
        //return text.substring(0, ARTICLE_SUMMARY_CHAR_NUMBER);


        let $ = cheerio.load(content);

        var appendRelativeFn = function(i, e) {
            let src = $(this).attr('src');
            
            if( !/^[http|//]/.test(src) ){
                src = path.join(relativeOutputPath, src);
            }
            
            $(this).attr('src', src);
        };
        
        $('img').each(appendRelativeFn);
        $('script').each(appendRelativeFn);
        
        //$('link').each(appendRelativeFn);
        return $.html();
    }

    // dispatch task for every dir
    renderCategorys(cb) {
        // TODO remove
        if( !this.categorys ){
            return cb();
        }
        let self = this;
        // let mapdone = new MapDone(() => {
        //     self.renderIndex(cb);
        // });

        async.each(Object.keys(this.categorys), (name, callback) => {
            // TODO remove
            if( name === 'index' ){
                return callback();
            }

            // if articles lenght === 0; drop it
            if( self.categorys[name].articles.length === 0 ){
                return callback();
            } else {
                let category = self.categorys[name];

                self.renderCategory(category, () => {
                    let outputPath = category.outputPath;
                    self.renderCategoryIndex(name, outputPath, category.articles, R.noop);
                    return callback();
                });
            }
        }, (err) => {
            if( err ){
                throw err;
            }
            self.renderIndex(cb);
        });
        // Object.keys(this.categorys).map((name) => {
        //     // TODO remove
        //     if( name === 'index' ){
        //         return;
        //     }

        //     // if articles lenght === 0; drop it
        //     if( this.categorys[name].articles.length === 0 ){
        //         return;
        //     }


        //     let category = this.categorys[name];
        //     let done = mapdone.reg();

        //     self.renderCategory(category, () => {
        //         let outputPath = category.outputPath;

        //         done();
        //         self.renderCategoryIndex(name, outputPath, category.articles, () => {
                    
        //         });
        //     });
        // });
    }

    // dispatch category or index
    renderCategoryIndex(name, outputPath, articles, cb) {
        let self = this;
        fs.readFile(path.resolve(__dirname, '..', themePath, self.theme, 'category.html'),
                    'utf-8', (err, data) => {
                        var html = ejs.render(data, {
                            title: name,
                            articles: articles
                        });
                        let outputFilePath = path.join(outputPath, 'index.html');
                        fs.writeFile(outputFilePath, html, (err) => {
                            if( err ){
                                Error(err);
                            }
                        });
                        
        });
    }

    renderCategory(category, cb) {
        let self = this;
        let outputPath = category.outputPath,
            inputPath = category.inputPath;

        
        let mapdone = new MapDone(cb);
        
        category.articles.sort((a, b) => {
            return a.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime() -
                b.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime();
        }).map((articleInfo) => {
            let done = mapdone.reg();
            
            parseToData(path.join(inputPath, articleInfo.fileName), (err, article) => {
                if( !err ){

                    fs.readFile(path.resolve(__dirname, '..', themePath, self.theme, 'article.html'),
                                'utf-8', (err, data) => {

                                    let renderData = {
                                        title: article.title,
                                        content: article.content,
                                        createDate: articleInfo.dateInfo.create,
                                        type: article.type,
                                        author: self.options.AUTHOR.NAME,
                                        blogName: self.options.BLOG.NAME
                                    };
                                    var result = ejs.render(data, renderData);

                                    articleInfo.title = article.title;
                                    articleInfo.content = article.content;
                                    
                                    
                                    let fileNameWithoutSuffix = takeFileNameWithoutSuffix(articleInfo.fileName);
                                    let outputFilePath = path.join(outputPath, fileNameWithoutSuffix + '.html');

                                    let relativeOutputPath = getRelativePath(self.outputRoot, outputPath);
                                    
                                    let contentPart = RenderController.cutOffArticle(article.content, relativeOutputPath);

                                    articleInfo.relativeOutputPath = relativeOutputPath;
                                    articleInfo.outputfilename = fileNameWithoutSuffix + '.html';
                                    articleInfo.contentPart = contentPart;
                                    
                                    articleInfo.showTime = dateFormat(articleInfo.dateInfo.create,
                                                                      "dddd, mmmm dS, yyyy, h:MM:ss");
                                    
                                    
                                    fs.writeFile(outputFilePath, result, (err) => {
                                        if( err ){
                                            Error(err);
                                        }
                                        done();
                                    });
                                });
                }
            });
        });

    }

    renderIndex(cb) {
        let allarticles = Object.keys(this.categorys).reduce((result, categoryName) => {
            this.categorys[categoryName].articles.map((article) => {
                article.outputfilename = categoryName + '/' + article.outputfilename;
            });
            return result.concat(this.categorys[categoryName].articles);
        }, []).sort((a, b) => {

            return a.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime() -
                b.dateInfo[this.options.BLOG.SORT_ARTICLE_BY].getTime();
        });

        let mapdone = new MapDone(cb);

        let self = this;
        let pageN = Math.ceil(allarticles.length / this.options.BLOG.INDEX_ARTICLE_NUMBER);

        var categorys = Object.keys(self.categorys).map((categoryName) => {
            return {
                name: categoryName,
                indexUrl: path.join('/', self.categorys[categoryName].relativeOutputPath, 'index.html'),
                number: self.categorys[categoryName].articles.length
            };
        });
        
        _.chunk(allarticles, this.options.BLOG.INDEX_ARTICLE_NUMBER).map((articles, i) => {
            let done = mapdone.reg();

            fs.readFile(path.resolve(__dirname, '..', themePath, self.theme, 'index.html'),
                        'utf-8', (err, data) => {
                            
                            var html = ejs.render(data, {
                                title: self.options.BLOG.NAME,
                                articles: articles,
                                categorys: categorys,
                                currentPageN: i,
                                pageN: pageN
                            });
                            
                            let outputPath = i === 0 ? this.outputRoot : this.outputRoot + '/page/' + i;

                            fsExtra.mkdirs(outputPath, (err) => {
                                
                                let outputFilePath = path.join(outputPath, 'index.html');
                                
                                fs.writeFile(outputFilePath, html, (err) => {
                                    if( err ){
                                        Error(err);
                                    }
                                    done();
                                });
                            });
                        });
        });
    }

    searchKeyWord() {

    }
    
    toHtml() {

    }
}
