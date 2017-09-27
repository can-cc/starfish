'use strict';

import * as fs from 'fs';
import * as path from 'path';

export let isFile = path => {
  return fs.lstatSync(path).isFile();
};

export let isDir = path => {
  return fs.lstatSync(path).isDirectory();
};

export let takeFileName = str => {
  return str.replace(/^.*[\\\/]/, '');
};

export let takeFileNameWithoutSuffix = str => {
  return takeFileName(str).replace(/\.\S+$/, '');
};

export let writeFile = (filePath, data, cb) => {
  fs.writeFile(filePath, data, () => {
    cb();
  });
};

export let injectGlobal = (key, object) => {
  global[key] = object;
};

export let joinPwd = filePath => {
  return path.resolve('.', filePath);
};

export let getRelativePath = (rootPath, fullPath) => {
  return fullPath.split(rootPath)[1] || './';
};

export let isSuffix = (suffix, str) => {
  let reg = new RegExp('\\.' + suffix + '$');
  return reg.test(str);
};

export let logCurrentTime = () => {
  let date = new Date();
  console.log(
    `Time: ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
  );
};

export let filterDotFiles = name => {
  return name[0] !== '.' && name[0] !== '~' && name[0] !== '#';
};

export let mergeForce = (o1, o2) => {
  for (let key in o2) {
    o1[key] = o2[key];
  }
};
