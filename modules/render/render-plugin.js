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
import { RenderLoader } from './render-loader';

export class RenderPluginManager {
  getPlugin(type, options) {
    const plugins = [];
    fs
      .readdirSync(path.resolve(__dirname, '../../node_modules'))
      .map(name => {
        return name;
      })
      .filter(filterDotFiles)
      .filter(name => new RegExp(`^nobbb-${type}`).test(name))
      .forEach(name => {
        if (!plugins[name]) {
          const plugin = new (require(path.resolve(
            __dirname,
            '../../node_modules/',
            name
          ))).default(options);
          if (plugin.type === type) {
            plugins[plugin.getName()] = plugin;
          }
        } else {
          throw new Error('duplicate plugin');
        }
      });
    return plugins;
  }

  constructor(options) {
    this.plugins = this.getPlugin('render', {
      // meta infomation
      ...options
    });
  }

  runPlugin() {}

  runPluinAfterArticleRender(rawDocument, articleData, cb) {
    R.values(this.plugins).forEach(plugin => {
      plugin.afterArticleRender(rawDocument, articleData, cb);
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

  runPluinAfterwCategoryListRender(...args) {
    R.values(this.plugins).forEach(plugin =>
      plugin.afterwCategoryListRender(...args)
    );
  }

  runPluinAfterCategoryRender(rendered, data) {
    R.values(this.plugins).forEach(plugin =>
      plugin.afterwCategoryRender(rendered, data)
    );
  }
}
