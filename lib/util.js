'use strict';

import * as fs from 'fs';

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
