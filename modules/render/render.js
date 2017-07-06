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
  constructor(inputPath, outputPath, options) {
    // TODO merge inputPath, outputPath
    this.inputPath = inputPath;
    this.outputPath = outputPath;
    this.theme = options.STYLE.THEME;
    this.options = options;

    this.categorys = {};

    this.pluginType = 'render';

    // TODO remove
    const themeDir = path.isAbsolute(options.STYLE.THEMEDIR)
      ? options.STYLE.THEMEDIR
      : path.resolve(inputPath, options.STYLE.THEMEDIR);
    this.themePath = path.join(themeDir, this.theme);

    // methods
    this.loadRootIgnore();

    this.renderLoader = new RenderLoader(inputPath, outputPath, options);
    this.renderThemer = new RenderThemer(inputPath, outputPath, options);
    this.renderPluginManager = new RenderPluginManager({
      inputRootPath: inputPath,
      outputPath: outputPath
    });

    this.parsers = getParsersFromModules();
    this.documentParserFn = makeDocumentParserFn(this.parsers);
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

    await index.loadRootDir();
    await index.loadCategoryDir();

    await index.render();
    await index.renderCategoryList();
    await index.renderEachCategory();

    await this.copyStatic();
  }

  // TODO move
  loadRootIgnore() {
    this.rootIgnoreRegs = [];
    let self = this;
    let ignoreFilePath = path.join(
      this.inputPath,
      this.options.CONFIG.IGNORE_FILE
    );
    if (fs.existsSync(ignoreFilePath)) {
      fs.readFileSync(ignoreFilePath, 'utf-8').split('\n').forEach(globStr => {
        self.rootIgnoreRegs.push(globToRegExp(globStr));
      });
    }
    const mappingRules = this.options.MAPPING || {};
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
      author: this.options.AUTHOR.NAME,
      blogName: this.options.BLOG.NAME,
      blogDesc: this.options.BLOG.DESC
    };
  }

  renderArticle(data) {
    return this.renderTemplate('article', data);
  }
}
