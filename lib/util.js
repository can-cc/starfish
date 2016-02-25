'use strict';

import * as fs from 'fs';

export function isFile(path) {
    return fs.lstatSync(path).isFile();
}

export function isDir(path) {
    return fs.lstatSync(path).isDirectory();
}
