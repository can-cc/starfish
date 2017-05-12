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

import Category from './Category';

export default class Index {
  constructor(meta, controller) {
    this.inputPath = meta.inputPath;
    this.outputPath = meta.outputPath;

    this.controller = controller;

    this.categorys = [];
  }

  addCategory(inputPath, outputPath, meta) {
    this.categorys.push(new Category(inputPath, outputPath, meta, this.controller));
  }

  async loadRootDir() {
    const categoryPaths = await pfs.readdirAsync(this.inputPath)
          .filter(this.controller.filterIgnores.bind(this.controller))
          .filter(p => isDir(path.resolve(this.inputPath, p)));
    categoryPaths.map(categoryName => this.addCategory(
      path.join(this.inputPath, categoryName),
      path.join(this.outputPath, categoryName),
      {
        name: categoryName,
        parsers: this.meta.parsers
      }
    ));
  }

  loadCategoryDir() {
    this.categorys.forEach(category => category.loadArticles());
  }
}
