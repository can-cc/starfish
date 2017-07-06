import bluebird from 'bluebird';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import ejs from 'ejs';
import fsExtra from 'fs-extra';
import R from 'fw-ramda';
import { getRelativePath, filterDotFiles, isSuffix } from '../../lib/util';
import { getParsersFromModules, makeDocumentParserFn } from './render-util';
import { warning, error } from '../../lib/message';
import { loadConfig } from '../../lib/loadConfig.js';
import { getModifyDates } from '../../util/git-date';
import { RenderLoader } from './render-loader';
import RenderThemer from './render-themer';

const globToRegExp = require('glob-to-regexp');

import Index from '../../model/Index';

import { RenderPluginManager } from './render-plugin';

export class RenderController {
  constructor(inputPath, outputPath, configure) {
    // TODO merge inputPath, outputPath
    this.inputPath = inputPath;
    this.outputPath = outputPath;
    // this.theme = configure.STYLE.THEME;
    this.configure = configure;

    this.categorys = {};

    this.pluginType = 'render';

    // methods
    this.loadRootIgnore();

    this.renderLoader = new RenderLoader(inputPath, outputPath, configure);
    this.renderThemer = new RenderThemer(inputPath, outputPath, configure);
    this.renderPluginManager = new RenderPluginManager({
      inputRootPath: inputPath,
      outputPath: outputPath
    });

    this.parsers = getParsersFromModules();
    // this.documentParserFn = makeDocumentParserFn(this.parsers);
  }

  async render() {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath);
    }

    const index = new Index(
      {
        inputPath: this.inputPath,
        outputPath: this.outputPath,
        parsers: this.parsers
      },
      this
    );

    await index.loadCategorys();
    await index.loadCategoryDir();

    await index.render();
    await index.renderCategoryList();
    await index.renderEachCategory();

    await this.renderThemer.copyThemeAsset();
    // await this.copyStatic();
  }

  // TODO move
  loadRootIgnore() {
    this.rootIgnoreRegs = [];
    let self = this;
    let ignoreFilePath = path.join(
      this.inputPath,
      this.configure.CONFIG.IGNORE_FILE
    );
    if (fs.existsSync(ignoreFilePath)) {
      fs.readFileSync(ignoreFilePath, 'utf-8').split('\n').forEach(globStr => {
        self.rootIgnoreRegs.push(globToRegExp(globStr));
      });
    }
    const mappingRules = this.configure.MAPPING || {};
    R.keys(mappingRules).forEach(toMapPath =>
      this.rootIgnoreRegs.push(globToRegExp(toMapPath))
    );
  }

  async copyStatic() {
    await fsExtra.copy(
      path.join(this.themePath, 'static'),
      path.join(this.outputPath, 'static')
    );
  }

  filterIgnores(name) {
    return this.rootIgnoreRegs.every(reg => !reg.test(name));
  }

  // TODO delete
  renderTemplate(key, data) {
    const mergedTemplateData = this.renderThemer.mergeTemplateData(data);
    return ejs.render(this.renderLoader.getTemplate(key), mergedTemplateData, {
      filename: path.join(
        this.renderLoader.getThemeTemplateRootPath(),
        key + '.html'
      )
    });
  }

  getBlogInformation() {
    return {
      title: this.configure.BLOG.NAME,
      blogDesc: this.configure.BLOG.DESC,
      author: this.configure.AUTHOR.NAME,
      blogName: this.configure.BLOG.NAME,
      blogDesc: this.configure.BLOG.DESC
    };
  }

  renderArticle(data) {
    return this.renderTemplate('article', data);
  }
}
