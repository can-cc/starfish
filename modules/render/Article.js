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

const HashNum = 7;

export default class Article {
  constructor(meta, controller) {
    this.inputPath = meta.inputPath;
    this.outputPath = meta.outputPath;
    this.meta = meta;
    this.controller = controller;
  }

  load() {
    const parsed = this.parseArticle(this.inputPath);
    const document = parsed.document;
    const relativeOutputPath = getRelativePath(this.meta.outputRootPath, this.meta.categoryPath);
    const [content, contentPart] = fixArticleUrlAndCut(document.content, relativeOutputPath, 200);
    this.data = {
      id: md5(document.content).substring(0, HashNum),
      document: document,
      title: document.title,
      content: content,
      summary: contentPart,
      type: parsed.type,
      categoryPath: this.meta.categoryPath
    };
    Object.assign(this.data, this.controller.getBlogInformation());
  }

  parseArticle(inputPath) {
    for (const i in this.meta.parsers) {
      if (this.meta.parsers[i].check(inputPath)) {
        const articleRawData = fs.readFileSync(inputPath, 'utf-8');
        return {
          document: this.meta.parsers[i].parse(articleRawData),
          type: this.meta.parsers[i].name
        };
      }
    }
    throw new Error(`Not Parser for ${inputPath}`);
  }

  render() {
    const rendered = this.controller.renderArticle(this.data);

  }
}
