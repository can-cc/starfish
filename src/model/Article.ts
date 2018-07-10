import * as fs from 'fs';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import * as md5 from 'blueimp-md5';
import * as _ from 'lodash';
import * as cheerio from 'cheerio';
import { getRelativePath, takeFileNameWithoutSuffix } from '../lib/util';
import { RenderController } from '../modules/render/render-controller';
import { getParsersFromModules } from '../modules/render/render-util';

function fixArticleUrlAndCut(content, relativeOutputPath) {
  const $ = cheerio.load(content);

  const appendRelativeFn = function(i, e) {
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

export class Article {
  public outputDirPath: string;
  public filenameWithoutSuffix: string;
  public assetPath: string;
  public id: string;
  public data: ArticleData;

  constructor(
    private options: {
      articleInputPath: string;
      articleOutputPath: string;
      categoryInputPath: string;
      categoryOutputPath: string;
      rootInputPath: string;
      rootOutputPath: string;
      filename: string;
    },
    private controller: RenderController
  ) {
    this.filenameWithoutSuffix = takeFileNameWithoutSuffix(options.articleInputPath);
    this.assetPath = path.join(this.options.categoryInputPath, this.filenameWithoutSuffix);
    this.outputDirPath = path.join(this.options.categoryOutputPath, this.filenameWithoutSuffix);

    this.data = this.loadArticleData();
  }

  public getData() {
    return this.data;
  }

  public render() {
    this.controller.renderPluginManager.runPluinBeforeArticleRender(this.data);
    const renderedHtml = this.controller.renderThemer.renderTemplate('ARTICLE', this.data);

    if (this.hasAsset()) {
      this.copyArticleAsset();
    }

    if (!fs.existsSync(this.outputDirPath)) {
      fs.mkdirSync(this.outputDirPath);
    }

    fs.writeFileSync(this.options.articleOutputPath, renderedHtml);
    this.controller.renderPluginManager.runPluinAfterArticleRender(renderedHtml, this);
  }

  private hasAsset() {
    return fs.existsSync(this.assetPath);
  }

  private loadArticleData() {
    const parsed = this.parseArticle(this.options.articleInputPath);

    const document: ArticleDocument = parsed.document;

    this.id = md5(document.title).substring(0, HashNum);

    const relativeOutputPath = getRelativePath(
      this.options.rootOutputPath,
      this.options.categoryOutputPath
    );

    const content = fixArticleUrlAndCut(document.content, relativeOutputPath);

    const outputDirPath = path.join(
      this.options.categoryOutputPath,
      takeFileNameWithoutSuffix(this.options.filename)
    );

    return {
      id: this.id,
      type: parsed.type,
      path: getRelativePath(this.options.rootOutputPath, this.options.articleOutputPath),
      dirPath: getRelativePath(this.options.rootOutputPath, this.outputDirPath),
      title: document.title,
      content,
      hasAsset: this.hasAsset(),
      ...this.getArticleGitData(document)
    };
  }

  private getArticleGitData(document: ArticleDocument) {
    const filePath = this.options.articleInputPath;
    let dates = [];
    try {
      const stdout = execSync(
        `git log --follow --pretty=format:\'%ad\' ${path.relative(
          this.options.rootInputPath,
          filePath
        )} | cat`,
        {
          cwd: this.options.rootInputPath,
          encoding: 'utf-8'
        }
      );
      dates = stdout.split('\n');
    } catch (error) {
      console.warn('get file log datas fail', error.message);
    }

    const createTime = document.date
      ? new Date(document.date).getTime()
      : _.last(dates) ? new Date(_.last(dates)).getTime() : new Date().getTime();

    return {
      createTime,
      modifyTime: new Date(_.head(dates) || new Date()).getTime(),
      showTime: createTime
    };
  }

  private parseArticle(inputPath) {
    const parsers = getParsersFromModules();

    for (const i in parsers) {
      if (parsers[i].check(inputPath)) {
        const articleRawData = fs.readFileSync(inputPath, 'utf-8');
        return {
          document: parsers[i].parse(articleRawData),
          type: parsers[i].name
        };
      }
    }
    throw new Error(`Not Parser for ${inputPath}`);
  }

  private copyArticleAsset() {
    fsExtra.copySync(
      this.assetPath,
      path.join(this.options.categoryOutputPath, takeFileNameWithoutSuffix(this.options.filename))
    );
  }
}
