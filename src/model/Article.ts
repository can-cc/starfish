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

export class Article {
  private assetPath: string;
  public data: any;
  private id: string;

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
    this.assetPath = takeFileNameWithoutSuffix(options.articleInputPath);

    this.load();
  }

  public render() {
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

  private hasAsset() {
    return fs.existsSync(this.assetPath);
  }

  private load() {
    const parsed = this.parseArticle(this.options.articleInputPath);

    const document = parsed.document;

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

    const articleData = {
      id: this.id,
      type: parsed.type,
      path: '',
      title: document.title,
      content,
      hasAsset: this.hasAsset(),
      ...this.getArticleGitData(this.options.articleInputPath)
    };

    this.data = articleData;
  }

  private getArticleGitData(filePath) {
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

    return {
      createTime: new Date(_.last(dates) || new Date()).getTime(), //TODO new Data 什么鬼 // TODO 可能是为了防止为空，这个以后优化吧
      modifyTime: new Date(_.head(dates) || new Date()).getTime(),
      showTime: new Date(_.last(dates) || new Date()).getTime()
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
