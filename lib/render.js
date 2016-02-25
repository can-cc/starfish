'use strict';

import {parseOrg, parseMarkDown} from './parse.js';
import {warning} from './message';
import * as fs from 'fs';
import {error} from './message';
//import * as path from 'path';

let ejs = require('ejs');

let parseCode2Html = function(filePath, cb){
    if( /\.md$/.test(filePath) ){
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if( err ){
                error(err);
            } else {
                return cb(parseMarkDown(data));
            }
        });
    } else if( /\.org/.test(filePath) ){
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if( err ){
                error(err);
            } else {
                return cb(parseOrg(data));
            }
        });
    } else {
        // TODO relative path
        warning(`Cannot render ${filepath}`);
    }
};

export function renderFile(filePath, theme, cb) {
    parseCode2Html(filePath, cb);
}

export function renderDir(dirPath, theme, outputPath, cb) {
    fs.readdir(dirPath, (err, files) => {
        //let  choices = makeChoices(boilPath, files);
        //cb(choices);
        
    });
}



