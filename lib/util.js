'use strict';

import * as fs from 'fs';
import * as path from 'path';

export let isFile = (path) => {
    return fs.lstatSync(path).isFile();
};

export let isDir = (path) => {
    return fs.lstatSync(path).isDirectory();
};

export let takeFileName = (str) => {
    return str.replace(/^.*[\\\/]/, '');
};

export let takeFileNameWithoutSuffix = (str) => {
    return takeFileName(str).replace(/\.\S+$/, '');
};

export let writeFile = (filePath, data, cb) => {
    fs.writeFile(filePath, data, () => {
        cb();
    });
};

export let joinPwd = (filePath) => {
    return path.resolve('.', filePath);
};
