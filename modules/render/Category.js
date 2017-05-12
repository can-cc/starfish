import bluebird from 'bluebird';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import ejs from 'ejs';
import fsExtra from 'fs-extra';
import moment from 'moment';
import md5 from 'blueimp-md5';
import R from 'fw-ramda';
import { parseOrg, parseMarkDown } from './render-parse.js';
import { isFile, isDir, takeFileName, takeFileNameWithoutSuffix,
         getRelativePath, filterDotFiles, isSuffix, mergeForce } from '../../lib/util';
import { syncMappingDirs, fixArticleUrlAndCut, getParsersFromModules, makeDocumentParserFn, getPlugin } from './render-util';
import { warning, error } from '../../lib/message';
import { loadConfig } from '../../lib/loadConfig.js';
import { getModifyDates } from '../../util/git-date';
import { RenderLoader } from './render-loader';
const pfs = bluebird.promisifyAll(fs);

export default class Category {
  constructor(inputPath, outputPath, meta, controller) {
    this.name = meta.name;
    this.inputPath = inputPath;
    this.outputPath = outputPath;

    this.controller = controller;
  }

  async loadArticles() {
    const paths = await pfs.readdirAsync(this.inputPath).filter(this.filterIgnores.bind(this));

    const [files, dirs] = _.partition(paths, pathName => isFile(path.resolve(this.inputPath, pathName)));
    const fileNames = files.filter(file => filterDotFiles(file) && R.values(this.parsers).some(parser => parser.check(file)));

    await Promise.all(fileNames.map(async (fileName) => await this.addArticle(fileName, category)));

    const fileNameWithoutSuffixs = fileNames.map(file => takeFileNameWithoutSuffix(file));
    const [articleAsserts, subDirs] = _.partition(dirs, (dir) => fileNameWithoutSuffixs.indexOf(dir) >= 0);
    const shouldCopyArticleAssertNames = articleAsserts.filter((articleAssert) => fileNameWithoutSuffixs.indexOf(articleAssert) >= 0);

    await Promise.all(shouldCopyArticleAssertNames.map(async (shouldCopyArticleAssertName) => {
      await fsExtra.copy(path.join(dirPath, shouldCopyArticleAssertName), path.join(outputPath, shouldCopyArticleAssertName));
    }));

    const mappingRules = this.options.MAPPING || {};
    const [needMapping, subCateDirs] = R.splitIf(dir => Object.keys(mappingRules).indexOf(dir) >= 0, subDirs);
    syncMappingDirs(needMapping, mappingRules, dirPath, outputPath)

    await Promise.all(subCateDirs.map(async (subDir) => {
      await this.load(path.join(dirPath, subDir), path.join(outputPath, subDir), subDir);
    }));

  }

  render() {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath);
    }
  }
}
