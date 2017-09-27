import fs from 'fs';
import path from 'path';
import R from 'ramda';
import shell from 'shelljs';
const globToRegExp = require('glob-to-regexp');

import { getParsersFromModules, makeDocumentParserFn } from './render-util';
import RenderThemer from './render-themer';
import { readConfigure } from '../../lib/loadConfig';

import Blog from '../../model/Blog';

import { RenderPluginManager } from './render-plugin';

export class RenderController {
  constructor(inputPath, outputPath) {
    this.pluginType = 'render';
    this.inputPath = inputPath;
    this.outputPath = outputPath;

    this.configure = readConfigure(this.inputPath);

    this.loadRootIgnore();
    this.renderThemer = new RenderThemer(inputPath, outputPath, this.configure);
    this.renderPluginManager = new RenderPluginManager({
      inputRootPath: inputPath,
      outputPath: outputPath,
      blogConfigure: this.configure
    });
    this.parsers = getParsersFromModules();
  }

  async render() {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath);
    }

    const blog = new Blog(
      {
        inputPath: path.join(this.inputPath, this.configure.BLOG.BLOGDIR),
        outputPath: this.outputPath,
        parsers: this.parsers
      },
      this
    );

    await blog.loadCategorys();
    await blog.loadCategoryDir();

    await blog.render();
    await blog.renderCategoryList();
    await blog.renderEachCategory();

    this.renderPluginManager.runPluinAfterRender();

    await this.renderThemer.copyThemeAsset();
    this.copySpec();
  }

  copySpec() {
    const mapping = this.configure.MAPPING;
    R.keys(mapping).forEach(sourcePath => {
      const targetPath = mapping[sourcePath];
      shell.cp('-R', path.join(this.inputPath, sourcePath), path.join(this.outputPath, targetPath));
    });
  }

  // TODO move
  loadRootIgnore() {
    this.rootIgnoreRegs = [];
    let self = this;
    let ignoreFilePath = path.join(this.inputPath, this.configure.CONFIG.IGNORE_FILE);
    if (fs.existsSync(ignoreFilePath)) {
      fs.readFileSync(ignoreFilePath, 'utf-8').split('\n').forEach(globStr => {
        self.rootIgnoreRegs.push(globToRegExp(globStr));
      });
    }
    const mappingRules = this.configure.MAPPING || {};
    R.keys(mappingRules).forEach(toMapPath => this.rootIgnoreRegs.push(globToRegExp(toMapPath)));
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
