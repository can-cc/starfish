import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';
import md5 from 'blueimp-md5';
import _ from 'lodash';
import cheerio from 'cheerio';
import { getRelativePath } from '../lib/util';

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

const execSync = require('child_process').execSync;

const HashNum = 7;

export default class Article {
  constructor(options, controller) {
    this.articleInputPath = options.inputPath;
    this.articleOutputPath = options.outputPath;
    this.options = options;
    this.controller = controller;

    this.assetPath = path.join(
      this.options.categoryInputPath,
      this.options.articleFileNameWithoutSuffix
    );
  }

  hasAsset() {
    return fs.existsSync(this.assetPath);
  }

  load() {
    const parsed = this.parseArticle(this.articleInputPath);
    const document = parsed.document;
    const relativeOutputPath = getRelativePath(
      this.options.outputRootPath,
      this.options.categoryOutputPath
    );
    const content = fixArticleUrlAndCut(document.content, relativeOutputPath);
    const outputDirPath = path.join(
      this.options.categoryOutputPath,
      this.options.articleFileNameWithoutSuffix
    );

    this.data = {
      // 抛弃
      inputPath: this.articleInputPath,
      outputPath: this.articleOutputPath,
      outputDirPath,
      outputFilePath: path.join(outputDirPath, 'index.html'),
      outputFileRelativePath: getRelativePath(
        this.options.outputRootPath,
        path.join(outputDirPath, 'index.html')
      ),
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
      categoryPathName: this.options.category,
      hasAsset: this.hasAsset(),
      categoryName: this.options.category.name,

      ...this.controller.getBlogInformation(),
      ...this.getArticleGitData(this.articleInputPath)
    };
  }

  getArticleGitData(filePath) {
    let dates = [];
    try {
      const stdout = execSync(
        `git log --follow --pretty=format:\'%ad\' ${path.relative(
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
      createTime: new Date(_.last(dates) || new Date()).getTime(), //TODO new Data 什么鬼 // TODO 可能是为了防止为空，这个以后优化吧
      modifyTime: new Date(_.head(dates) || new Date()).getTime(),
      showTime: new Date(_.last(dates) || new Date()).getTime()
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
    fsExtra.copySync(
      this.assetPath,
      path.join(this.options.categoryOutputPath, this.options.articleFileNameWithoutSuffix)
    );
  }

  render() {
    this.controller.renderPluginManager.runPluinBeforeArticleRender(this.data);
    const rendered = this.controller.renderThemer.renderTemplate('ARTICLE', this.data);

    if (this.hasAsset()) {
      this.copyArticleAsset();
    }
    if (!fs.existsSync(this.data.outputDirPath)) {
      fs.mkdirSync(this.data.outputDirPath);
    }

    fs.writeFileSync(this.data.outputFilePath, rendered);
    this.controller.renderPluginManager.runPluinAfterArticleRender(rendered, this.data);
  }
}
