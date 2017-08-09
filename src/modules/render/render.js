import bluebird from 'bluebird';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import ejs from 'ejs';
import fsExtra from 'fs-extra';
import R from 'fw-ramda';

import { getParsersFromModules, makeDocumentParserFn } from './render-util';
import RenderThemer from './render-themer';
import { readConfigure } from '../../lib/loadConfig';

const globToRegExp = require('glob-to-regexp');

import Index from '../../model/Index';

import { RenderPluginManager } from './render-plugin';

export class RenderController {
  constructor(inputPath, outputPath) {
    this.inputPath = inputPath;
    this.outputPath = outputPath;

    this.configure = readConfigure(this.inputPath);

    this.categorys = {};

    this.pluginType = 'render';
    this.loadRootIgnore();
    this.renderThemer = new RenderThemer(inputPath, outputPath, this.configure);

    this.renderPluginManager = new RenderPluginManager({
      inputRootPath: inputPath,
      outputPath: outputPath
    });

    this.parsers = getParsersFromModules();
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

  getBlogInformation() {
    return {
      author: this.configure.AUTHOR.NAME,
      blogTitle: this.configure.BLOG.NAME,
      blogDesc: this.configure.BLOG.DESC,
      blogName: this.configure.BLOG.NAME,
      blogDesc: this.configure.BLOG.DESC
    };
  }
}

export default RenderController;
