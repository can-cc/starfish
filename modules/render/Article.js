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


export default class Article {
  constructor(meta, controller) {
    this.inputPath = meta.inputPath;
    this.outputPath = meta.outputPath;
    this.controller = controller;

  }

  load() {
    const document = this.parseArticle(this.inputPath);

    this.data = {
      document: document,
      title: document.title,
      content: document.content
    }
  }

  parseArticle(inputPath) {
    for (const i in this.meta.parsers) {
      if (this.meta.parsers[i].check(inputPath)) {
        const articleRawData = fs.readFileSync(inputPath, 'utf-8');
        return this.meta.parsers[i].parse(articleRawData);
      }
    }
    throw new Error(`Not Parser for ${inputPath}`);
  }

  render(outputPath) {

  }
}
