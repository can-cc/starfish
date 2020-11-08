import * as path from "path";
import md5 from "blueimp-md5";
import * as cheerio from "cheerio";
import { getRelativePath, takeFileNameWithoutSuffix } from "../lib/util";
import { RenderController } from "../modules/render/render-controller";
import { getParsersFromModules } from "../modules/render/render-util";
import { RenderEntity } from "./RenderEntity";

function fixArticleUrlAndCut(content, relativeOutputPath) {
  const $ = cheerio.load(content);

  const appendRelativeFn = function(i, e) {
    let src = $(this).attr("src");
    if (!/^[http|//]/.test(src)) {
      src = path.resolve("/", relativeOutputPath, src);
    }
    $(this).attr("src", src);
  };

  $("img").each(appendRelativeFn);
  $("script").each(appendRelativeFn);
  return $.html();
}


const HashNum = 7;

export class Article implements RenderEntity {
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
    this.assetPath = path.resolve(this.options.categoryInputPath, this.filenameWithoutSuffix);
    this.outputDirPath = path.resolve(this.options.categoryOutputPath, this.filenameWithoutSuffix);
  }

  public load() {
    this.data = this.loadArticleData();
  }

  public getData() {
    return this.data;
  }

  public render() {
    this.controller.renderPluginManager.runPluginBeforeArticleRender(this.data);
    const renderedHtml = this.controller.renderThemer.renderTemplate("ARTICLE", this.data);

    if (this.hasAsset()) {
      this.copyArticleAsset();
    }

    if (!this.controller.reader.existsSync(this.outputDirPath)) {
      this.controller.writer.mkdirSync(this.outputDirPath);
    }

    this.controller.writer.writeFileSync(this.options.articleOutputPath, renderedHtml);
    this.controller.renderPluginManager.runPluginAfterArticleRender(renderedHtml, this);
  }

  private hasAsset() {
    return this.controller.reader.existsSync(this.assetPath);
    // return fs.existsSync(this.assetPath);
  }

  private loadArticleData() {
    let parsed;
    try {
      parsed = this.parseArticle(this.options.articleInputPath);
    } catch (error) {
      console.error(`Parse article error, fileName = [${this.options.articleInputPath}]`, error);
    }

    const document: ArticleDocument = parsed.document;

    this.id = md5(document.title).substring(0, HashNum);

    const relativeOutputPath = getRelativePath(this.options.rootOutputPath, this.options.categoryOutputPath);

    const content = fixArticleUrlAndCut(document.content, relativeOutputPath);

    return {
      id: this.id,
      type: parsed.type,
      path: getRelativePath(this.options.rootOutputPath, this.options.articleOutputPath),
      dirPath: getRelativePath(this.options.rootOutputPath, this.outputDirPath),
      title: document.title,
      content,
      hasAsset: this.hasAsset(),
      ...this.getArticleDate(document)
    };
  }

  private getArticleDate(
    document: ArticleDocument
  ): {
    createTime: number;
    showTime: number;
  } {
    const createTime = new Date(document.date).getTime();
    return {
      createTime,
      showTime: createTime
    };
  }

  private parseArticle(
    inputPath
  ): {
    document: ArticleDocument;
    type: string;
  } {
    const parsers = getParsersFromModules();
    for (const i in parsers) {
      if (parsers[i].check(inputPath)) {
        const articleRawData = this.controller.reader.readFileSync(inputPath);

        return {
          document: parsers[i].parse(articleRawData),
          type: parsers[i].name
        };
      }
    }
    throw new Error(`Not Parser for ${inputPath}`);
  }

  private copyArticleAsset() {
    this.controller.writer.copySync(
      this.assetPath,
      path.resolve(this.options.categoryOutputPath, takeFileNameWithoutSuffix(this.options.filename))
    );
  }
}
