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

export const takeFileNameWithoutSuffix = str => {
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
  return (fullPath.split(rootPath)[1] || './').replace(/\\/g, '/');
};

export let isSuffix = (suffix, str) => {
  let reg = new RegExp('\\.' + suffix + '$');
  return reg.test(str);
};

export let filterDotFiles = name => {
  return name[0] !== '.' && name[0] !== '~' && name[0] !== '#';
};
