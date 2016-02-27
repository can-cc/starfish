'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as ejs from 'ejs';
import * as fsExtra from 'fs-extra';
//import * as path from 'path';

import {parseOrg, parseMarkDown} from './parse.js';
import {isFile, isDir, takeFileName, takeFileNameWithoutSuffix} from './util';
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
    } else if( /\.org/.test(filePath) ){
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
                            cb(result, article.fileName); 
                        });
        }
    });
};

import {ignoreNames} from '../config';
export let renderDir = (dirPath, theme, outputPath, cb) => {
    fs.readdir(dirPath, (err, paths) => {
        fs.mkdir(outputPath, () => {
            
            let mapdone = new MapDone(() => {
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
                renderFile(path.join(dirPath, file), theme, (data) => {
                    fs.writeFile(path.join(outputPath, fileNameWithoutSuffix + '.html'), data, (err) => {
                        if( err ){
                            Error(err);
                        }
                        done();
                    });
                });
                return fileNameWithoutSuffix;
            });

            let [articleAsserts, subDirs] = _.partition(dirs, (dir) => {
                return fileNames.indexOf(dir) >= 0;
            });

            articleAsserts.map((articleAssert) => {
                let done = mapdone.reg();
                
                fsExtra.copy(path.join(dirPath, articleAssert),
                             path.join(outputPath, articleAssert), () => {
                                 done();
                             });
            });
            
            subDirs.map((subDir) => {
                let done = mapdone.reg();
                renderDir(path.join(dirPath, subDir), theme,
                          path.join(outputPath, subDir), () => {
                              done();
                          });
            });

            mapdone.done();
        });
    });
};



