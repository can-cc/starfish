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

function fixArticleUrlAndCut(content, relativeOutputPath, cutLimit) {
  // let text = htmlToText.fromString(content, {
  //     wordwrap: 130
  // });
  //return text.substring(0, ARTICLE_SUMMARY_CHAR_NUMBER);
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

  let ps = $('h1, h2, h3, h4, h5, h6, p'),
    summary = '';

  for (let i = 0, max = ps.length; i < max; i++) {
    summary += $(ps[i]).text();
    if (summary.length > cutLimit) {
      summary = summary.substring(0, cutLimit);
      break;
    } else if (i !== max - 1) {
      summary += '<br/>';
    }
  }
  return [$.html(), summary];
}

var execSync = require('child_process').execSync;

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
    const relativeOutputPath = getRelativePath(
      this.meta.outputRootPath,
      this.meta.categoryOutputPath
    );
    const [content, contentPart] = fixArticleUrlAndCut(
      document.content,
      relativeOutputPath,
      200
    );
    this.data = {
      inputPath: this.inputPath,
      outputPath: this.outputPath,
      id: md5(document.content).substring(0, HashNum),
      document: document,
      title: document.title,
      content: content,
      summary: contentPart,
      type: parsed.type,
      categoryInputPath: this.meta.categoryInputPath,
      categoryOutputPath: this.meta.categoryOutputPath,
      articleFileNameWithoutSuffix: this.meta.articleFileNameWithoutSuffix,
      ...this.controller.getBlogInformation(),
      ...this.getArticleGitData(this.inputPath)
    };
  }

  getArticleGitData(filePath) {
    const stdout = execSync(
      `git log --pretty=format:\'%ad\' ${filePath} | cat`,
      {
        cwd: this.meta.inputRootPath,
        encoding: 'utf-8'
      }
    );
    const dates = stdout.split('\n');
    return {
      createTime: new Date(_.last(dates) || new Date()),
      modifyTime: new Date(_.head(dates) || new Date()),
      showTime: moment(new Date(_.last(dates) || new Date())).format(
        'dddd, MMMM Do YYYY, h:mm:ss a'
      )
    };
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

  copyArticleAsset() {
    const assetPath = path.join(
      this.meta.categoryInputPath,
      this.meta.articleFileNameWithoutSuffix
    );
    if (!fs.existsSync(assetPath)) {
      return;
    }
    fsExtra.copySync(
      assetPath,
      path.join(
        this.meta.categoryOutputPath,
        this.meta.articleFileNameWithoutSuffix
      )
    );
  }

  render() {
    this.controller.renderPluginManager.runPluinBeforeArticleRender(this.data);
    const rendered = this.controller.renderArticle(this.data);
    fs.writeFileSync(this.outputPath, rendered);
    this.copyArticleAsset();
    this.controller.renderPluginManager.runPluinAfterArticleRender(
      rendered,
      this.data
    );
  }
}
