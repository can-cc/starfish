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

const globToRegExp = require('glob-to-regexp');

let htmlToText = require('html-to-text');
let dateFormat = require('dateformat');

const isOrg = R.curry(isSuffix)('org');
const isMd = R.curry(isSuffix)('md');
const isYaml = R.curry(isSuffix)('yaml');

import Index from './Index';


export class RenderPluginManager {
  constructor(meta) {

    this.plugins = getPlugin('render', {
      // meta infomation
      ...meta
    });
  }

  runPlugin() {

  }

  runPluinAfterArticleRender(rawDocument, articleData, cb) {
    R.values(this.plugins).forEach(plugin => {
      plugin.afterArticleRender(rawDocument, articleData, cb);
    });
  }

  runPluinAfterRender() {
    R.values(this.plugins).forEach(plugin => plugin.afterRender())
  }

  runPluginAfterIndexRender(indexData) {
    R.values(this.plugins).forEach(plugin => plugin.afterIndexRender(indexData));
  }

  runPluinAfterwCategoryListRender(data) {
    R.values(this.plugins).forEach(plugin => plugin.afterwCategoryListRender(data));
  }

  runPluinAfterCategoryRender(rendered, data) {
    R.values(this.plugins).forEach(plugin => plugin.afterwCategoryRender(rendered, data));
  }

}
