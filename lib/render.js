'use strict';

import {parseOrg, parseMarkDown} from './parse.js';
import {warning} from './message';
import * as fs from 'fs';

export function renderFile(filePath, cb) {
    if( /\.md$/.test(filePath) ){
        fs.readFile(filePath, 'utf-8', (data) => {
            return cb(parseMarkDown(data));
        });
    } else if( /\.org/.test(filePath) ){
        fs.readFile(filePath, 'utf-8', (data) => {
            return cb(parseOrg(data));
        });
    } else {
        // TODO relative path
        warning(`Cannot render ${filepath}`);
    }
}

export function renderDir(dirPath) {
    
}



