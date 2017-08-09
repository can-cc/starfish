import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';
import moment from 'moment';
import md5 from 'blueimp-md5';
import _ from 'lodash';
import R from 'ramda';
import cheerio from 'cheerio';
import {
  isFile,
  isDir,
  takeFileName,
  takeFileNameWithoutSuffix,
  getRelativePath,
  filterDotFiles,
  isSuffix,
  mergeForce
} from '../lib/util';

function fixArticleUrlAndCut(content, relativeOutputPath) {
  let $ = cheerio.load(content);

  var appendRelativeFn = function(i, e) {
    let src = $(this).attr('src');
    if (!/^[http|//]/.test(src)) {
      src = path.join('/', relativeOutputPath, src);
    }
    $(this).attr('src', src);
  };

  $('img').each(appendRelativeFn);
  $('script').each(appendRelativeFn);
  return $.html();
}

var execSync = require('child_process').execSync;

const HashNum = 7;

export default class Article {
  constructor(options, controller) {
    this.articleInputPath = options.inputPath;
    this.articleOutputPath = options.outputPath;
    this.options = options;
    this.controller = controller;
  }

  load() {
    const parsed = this.parseArticle(this.articleInputPath);
    const document = parsed.document;
    const relativeOutputPath = getRelativePath(
      this.options.outputRootPath,
      this.options.categoryOutputPath
    );
    const content = fixArticleUrlAndCut(document.content, relativeOutputPath);
    this.data = {
      // 抛弃
      inputPath: this.articleInputPath,
      outputPath: this.articleOutputPath,

      articleInputPath: this.articleInputPath,
      articleOutputPath: this.articleOutputPath,
      id: md5(document.content).substring(0, HashNum),
      document: document,
      title: document.title,
      content: content,
      type: parsed.type,
      categoryInputPath: this.options.categoryInputPath,
      categoryOutputPath: this.options.categoryOutputPath,
      articleFileNameWithoutSuffix: this.options.articleFileNameWithoutSuffix,

      ...this.controller.getBlogInformation(),
      ...this.getArticleGitData(this.articleInputPath)
    };
  }

  getArticleGitData(filePath) {
    let dates = [];
    try {
      const stdout = execSync(
        `git log --pretty=format:\'%ad\' ${path.relative(
          this.options.inputRootPath,
          filePath
        )} | cat`,
        {
          cwd: this.options.inputRootPath,
          encoding: 'utf-8'
        }
      );
      dates = stdout.split('\n');
    } catch (error) {
      console.warning('get file log datas fail', error.message);
    }

    return {
      createTime: new Date(_.last(dates) || new Date()), //TODO new Data 什么鬼
      modifyTime: new Date(_.head(dates) || new Date()),
      showTime: moment(new Date(_.last(dates) || new Date())).format('MMMM Do YYYY, h:mm')
    };
  }

  parseArticle(inputPath) {
    for (const i in this.options.parsers) {
      if (this.options.parsers[i].check(inputPath)) {
        const articleRawData = fs.readFileSync(inputPath, 'utf-8');
        return {
          document: this.options.parsers[i].parse(articleRawData),
          type: this.options.parsers[i].name
        };
      }
    }
    throw new Error(`Not Parser for ${inputPath}`);
  }

  copyArticleAsset() {
    const assetPath = path.join(
      this.options.categoryInputPath,
      this.options.articleFileNameWithoutSuffix
    );
    if (!fs.existsSync(assetPath)) {
      return;
    }
    fsExtra.copySync(
      assetPath,
      path.join(this.options.categoryOutputPath, this.options.articleFileNameWithoutSuffix)
    );
  }

  render() {
    this.controller.renderPluginManager.runPluinBeforeArticleRender(this.data);

    const rendered = this.controller.renderThemer.renderTemplate('ARTICLE', this.data);

    fs.writeFileSync(this.articleOutputPath, rendered);
    this.copyArticleAsset();
    this.controller.renderPluginManager.runPluinAfterArticleRender(rendered, this.data);
  }
}
