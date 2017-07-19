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
import {
  isFile,
  isDir,
  takeFileName,
  takeFileNameWithoutSuffix,
  getRelativePath,
  filterDotFiles,
  isSuffix,
  mergeForce
} from '../../lib/util';
import { warning, error } from '../../lib/message';
import { loadConfig } from '../../lib/loadConfig.js';
import { getModifyDates } from '../../util/git-date';

export class RenderPluginManager {
  constructor(options) {
    this.plugins = this.getPluginFromNodeMudules({
      // meta infomation
      ...options
    });
  }

  getPlugin() {
    return this.plugins;
  }

  runPlugin() {}

  runPluinBeforeArticleRender(articleData) {
    R.values(this.plugins).forEach(plugin => {
      plugin.beforeArticleRender(articleData);
    });
  }

  runPluinAfterArticleRender(rawDocument, articleData) {
    R.values(this.plugins).forEach(plugin => {
      plugin.afterArticleRender(rawDocument, articleData);
    });
  }

  runPluinAfterRender() {
    R.values(this.plugins).forEach(plugin => plugin.afterRender());
  }

  runPluginAfterIndexRender(indexData) {
    R.values(this.plugins).forEach(plugin =>
      plugin.afterIndexRender(indexData)
    );
  }

  runPluinAfterwCategoryListRender(categorysData, options) {
    R.values(this.plugins).forEach(plugin =>
      plugin.afterwCategoryListRender(...arguments)
    );
  }

  runPluinAfterCategoryRender(rendered, data) {
    R.values(this.plugins).forEach(plugin =>
      plugin.afterwCategoryRender(rendered, data)
    );
  }

  getPluginFromNodeMudules(options) {
    const plugins = {};
    fs
      .readdirSync(path.resolve(__dirname, '../../node_modules'))
      .map(name => {
        return name;
      })
      .filter(filterDotFiles)
      .filter(name => new RegExp(`^nobbb-render`).test(name))
      .forEach(name => {
        if (!plugins[name]) {
          const plugin = new (require(path.resolve(
            __dirname,
            '../../node_modules/',
            name
          ))).default(options);
          plugins[plugin.getName()] = plugin;
        } else {
          throw new Error('duplicate plugin');
        }
      });
    return plugins;
  }
}

export default RenderPluginManager;
