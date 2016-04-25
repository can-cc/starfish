'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';
//import * as path from 'path';

import {INDEX_ARTICLE_NUMBER, ARTICLE_SUMMARY_CHAR_NUMBER, SORT_ARTICLE_BY,
        BLOG_NAME} from '../config.js';
import {parseOrg, parseMarkDown} from './parse.js';
import {isFile, isDir, takeFileName, takeFileNameWithoutSuffix, getRelativePath, isSuffix} from './util';
import {warning, error} from './message';
import {MapDone} from './mapdone';

let R = require('fw-ramda');

let htmlToText = require('html-to-text');
let dateFormat = require('dateformat');

const themePath = 'themes';

let parseCode2Html = function(filePath, cb){
    let fileName = takeFileName(filePath),
        filenameWithoutSuffix = takeFileNameWithoutSuffix(filePath);

    if( /\.md$/.test(filePath) ){
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if( err ){
                error(err);
            } else {
                return cb(null, {
                    fileName: fileName,
                    title: filenameWithoutSuffix,
                    content: parseMarkDown(data),
                    type: 'makrdonw'
                });
            }
        });
    } else if( /\.org$/.test(filePath) ){
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if( err ){
                error(err);
            } else {
                let orgHTMLDocument = parseOrg(data);
                return cb(null, {
                    fileName: fileName,
                    title: orgHTMLDocument.title,
                    content: orgHTMLDocument.toString(),
                    type: 'org'
                });
            }
        });
    } else {
        // TODO relative path
        warning(`Cannot render ${filePath}`);
    }
};

export let renderFile = (filePath, theme, cb) =>  {

    parseCode2Html(filePath, (err, article) => {
        if( !err ){
            
            fs.readFile(path.resolve(__dirname, '..', themePath, theme, 'article.html'),
                        'utf-8', (err, data) => {
                            var result = ejs.render(data, {
                                title: article.title,
                                content: article.content
                            });
                            cb(result, article); 
                        });
        }
    });
};

import {ignoreNames} from '../config';



var exec = require('child_process').exec;
let getModifyDates = (filePath, cb) => {

    exec('git log --pretty=format:\'%ad\' ${filePath} | cat', function (error, stdout, stderr) {
        let dates =  stdout.split('\n');
        cb({
            create: new Date(_.head(dates)),
            modify: new Date(_.last(dates))
        });
    });
};


export class RenderController {
    constructor(inputPath, outputRoot, theme) {
        this.inputPath = inputPath;
        this.outputRoot = outputRoot;
        this.categorys = {};
        this.theme = theme;
        
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
                
                let mapdone = new MapDone(cb);
                
                let [files, dirs] = _.partition(paths, (pathName) => {
                    return isFile(path.resolve(dirPath, pathName));
                });

                
                let fileNames = files.filter((file) => {
                    return ignoreNames.indexOf(file) < 0;
                }).filter((file) => {
                    return !isSuffix('hide', file);
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
                
                subDirs.map((subDir) => {
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
        getModifyDates(path.join(this.categorys[category].inputPath, fileName), (dateInfo) => {
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
            outputPath: outputPath,
            inputPath: inputPath,
            articles: []
        };
    }

    // TODO
    // cut content for index and category display
    static cutOffArticle(content) {
        let text = htmlToText.fromString(content, {
            wordwrap: 130
        });
        return text.substring(0, ARTICLE_SUMMARY_CHAR_NUMBER);
    }

    // dispatch task for every dir
    renderCategorys(cb) {
        if( !this.categorys ){
            return cb();
        }
        let self = this;
        let mapdone = new MapDone(() => {
            self.renderIndex(cb);
        });


        Object.keys(this.categorys).map((name) => {
            if( name === 'index' ){
                return;
            }

            let category = this.categorys[name];
            let done = mapdone.reg();

            self.renderCategory(category, () => {
                let outputPath = category.outputPath;

                done();
                self.renderCategoryIndex(name, outputPath, category.articles, () => {
                    
                });
            });
        });
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
            return a.dateInfo[SORT_ARTICLE_BY].getTime() - b.dateInfo[SORT_ARTICLE_BY].getTime();
        }).map((articleInfo) => {
            let done = mapdone.reg();
            
            parseCode2Html(path.join(inputPath, articleInfo.fileName), (err, article) => {
                if( !err ){

                    fs.readFile(path.resolve(__dirname, '..', themePath, self.theme, 'article.html'),
                                'utf-8', (err, data) => {

                                    let renderData = {
                                        title: article.title,
                                        content: article.content,
                                        createDate: articleInfo.dateInfo.create,
                                        type: article.type
                                    };
                                    var result = ejs.render(data, renderData);

                                    articleInfo.title = article.title;
                                    articleInfo.content = article.content;
                                    
                                    
                                    let fileNameWithoutSuffix = takeFileNameWithoutSuffix(articleInfo.fileName);
                                    let outputFilePath = path.join(outputPath, fileNameWithoutSuffix + '.html');

                                    let contentPart = RenderController.cutOffArticle(article.content);

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

            return a.dateInfo[SORT_ARTICLE_BY].getTime() - b.dateInfo[SORT_ARTICLE_BY].getTime();
        });

        let mapdone = new MapDone(cb);

        let self = this;
        let pageN = Math.ceil(allarticles.length / INDEX_ARTICLE_NUMBER);
        _.chunk(allarticles, INDEX_ARTICLE_NUMBER).map((articles, i) => {
            let done = mapdone.reg();

            fs.readFile(path.resolve(__dirname, '..', themePath, self.theme, 'index.html'),
                        'utf-8', (err, data) => {
                            var html = ejs.render(data, {
                                title: BLOG_NAME,
                                articles: articles,
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
