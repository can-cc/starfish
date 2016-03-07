'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';
//import * as path from 'path';

import {INDEX_ARTICLE_NUMBER, ARTICLE_SUMMARY_CHAR_NUMBER, SORT_ARTICLE_BY} from '../config.js';
import {parseOrg, parseMarkDown} from './parse.js';
import {isFile, isDir, takeFileName, takeFileNameWithoutSuffix, getRelativePath} from './util';
import {warning, error} from './message';
import {MapDone} from './mapdone';


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
                    content: parseMarkDown(data)
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
                    content: orgHTMLDocument.toString()
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
        cb( {
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
    }

    static renderDir(dirPath, theme, outputPath, cb) {

        let renderController = new RenderController(dirPath, outputPath, theme);
        renderController.render(() => {
            
            console.log('done2');
        });
    }

    static renderFile() {

    }

    render(cb) {
        let self = this;
        console.log('hihihihihihihihi');
        this.loadDir(this.inputPath, this.outputRoot, 'index', () => {
            console.log('start render');
            self.renderCategorys(() => {
                console.log('fuck');
                cb();
            });
        });
    }

    loadDir(dirPath, outputPath, category, cb) {
        let self = this;

        fs.readdir(dirPath, (err, paths) => {
            fs.mkdir(outputPath, () => {

                self.addCategory(category, dirPath, outputPath);
                
                let mapdone = new MapDone(() => {
                    console.log('shit');
                    cb();
                });
                
                let [files, dirs] = _.partition(paths, (pathName) => {
                    return isFile(path.resolve(dirPath, pathName));
                });

                
                let fileNames = files.filter((file) => {
                    return ignoreNames.indexOf(file) < 0;
                }).map((file) => {
                    
                    let done = mapdone.reg();
                    
                    let fileNameWithoutSuffix = takeFileNameWithoutSuffix(file);

                    self.addArticle(file, category, done);
                    
                    // renderFile(path.join(dirPath, file), theme, (data, article) => {
                    //     let outputFilePath = path.join(outputPath, fileNameWithoutSuffix + '.html');
                    //     fs.writeFile(outputFilePath, data, (err) => {
                    //         if( err ){
                    //             Error(err);
                    //         }
                    
                    //         done();
                    //     });
                    // });
                    return fileNameWithoutSuffix;
                });



                let [articleAsserts, subDirs] = _.partition(dirs, (dir) => {
                    return fileNames.indexOf(dir) >= 0;
                });



                articleAsserts.filter((articleAssert) => {
                    return fileNames.indexOf(articleAssert) >= 0;
                }).map((articleAssert) => {
                    let done = mapdone.reg();
                    fsExtra.copy(path.join(dirPath, articleAssert),
                                 path.join(outputPath, articleAssert), done);
                });
                
                subDirs.map((subDir) => {
                    let done = mapdone.reg();
                    self.loadDir(path.join(dirPath, subDir), 
                                 path.join(outputPath, subDir), subDir, done);
                });

                mapdone.done();
            });
        });
    }

    addArticle(fileName, category, cb){
        //let relativePath = getRelativePath(this.outputRoot, outputFilePath);
        let self = this;

        getModifyDates(path.join(this.categorys[category].inputPath, fileName), (dateInfo) => {

            self.categorys[category].articles.push({
                fileName: fileName,
                dateInfo: dateInfo
            });
            cb();
        });

    }

    addCategory(name, inputPath, outputPath) {
        this.categorys[name] = {
            outputPath: outputPath,
            inputPath: inputPath,
            articles: []
        };
    }

    cutOffArticle(content) {
        return content.substring(0, ARTICLE_SUMMARY_CHAR_NUMBER);
    }

    renderCategorys(cb) {
        if( !this.categorys ){
            console.log('EMptty');
            return cb();
        }
        let self = this;

        let mapdone = new MapDone(() => {
            console.log('oh my god');
            cb();
        });
        _.values(this.categorys).map((category) => {

            let done = mapdone.reg();
            self.renderCategory(category, () => {
                console.log('sssshitt');
                done()
            });
        });
        mapdone.done();
    }

    renderCategory(category, cb) {
        let self = this;
        let outputPath = category.outputPath,
            inputPath = category.inputPath;
        
        let mapdone = new MapDone(cb);

        category.articles.sort((a, b) => {
            return a.dateInfo[SORT_ARTICLE_BY] - b.dateInfo[SORT_ARTICLE_BY];
        }).map((articleInfo) => {

            parseCode2Html(path.join(inputPath, articleInfo.fileName), (err, article) => {
                if( !err ){
                    let done = mapdone.reg();
                    fs.readFile(path.resolve(__dirname, '..', themePath, self.theme, 'article.html'),
                                'utf-8', (err, data) => {

                                    var result = ejs.render(data, {
                                        title: article.title,
                                        content: article.content,
                                        createDate: articleInfo.dateInfo.create
                                    });
                                    let fileNameWithoutSuffix = takeFileNameWithoutSuffix(articleInfo.fileName);
                                    let outputFilePath = path.join(outputPath, fileNameWithoutSuffix + '.html');
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
        mapdone.done();
    }

    renderIndex() {

    }

    searchKeyWord() {

    }

    toHtml() {

    }
}
