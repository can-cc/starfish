import fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as R from 'ramda';
import { isFile, takeFileNameWithoutSuffix, filterDotFiles, getRelativePath } from '../lib/util';
import { Article } from './Article';
import { getParsersFromModules } from '../modules/render/render-util';
import { RenderEntity } from './RenderEntity';
import { Reader } from '../modules/reader/Reader';
import { RenderController } from '../modules/render/render-controller';

export class Category implements RenderEntity {
  public path: string;

  private articles: Article[];

  // remove this map data
  // set in the Category instance this
  private categoryData: {
    path: string;
    categoryName: string;
    articles: any;
  };

  private categoryConfigure: CategoryConfigure;

  constructor(
    private options: {
      categoryInputPath: string;
      categoryOutputPath: string;
      blogInputPath: string;
      blogOutputPath: string;
      categoryName: string;
    },
    private controller: RenderController
  ) {}

  public load(): void {
    this.categoryConfigure = this.loadCategoryConfigure();
    this.articles = this.loadArtices();
    this.categoryData = this.loadCategoryData();
  }

  public getAllArticles(): Article[] {
    return this.articles;
  }

  public getData() {
    return this.categoryData;
  }

  public render() {
    if (!fs.existsSync(this.options.categoryOutputPath)) {
      // fs.mkdirSync(this.options.categoryOutputPath);
      this.controller.writer.mkdirSync(this.options.categoryOutputPath);
    }

    const outputHtmlContent = this.controller.renderThemer.renderTemplate(
      'CATEGORY',
      this.categoryData
    );

    const categoryIndexFilePath: string = path.join(this.options.categoryOutputPath, 'index.html');

    this.controller.writer.writeFileSync(categoryIndexFilePath, outputHtmlContent);

    this.controller.renderPluginManager.runPluinAfterCategoryRender(outputHtmlContent, this);

    this.renderAllArticle();
  }

  private renderAllArticle() {
    this.articles.forEach(article => {
      article.render();
    });
  }

  private loadCategoryConfigure(): CategoryConfigure {
    const categoryConfigureFilePath = path.join(this.options.categoryInputPath, '.category.yaml');

    const reader: Reader = this.controller.reader;
    return reader.fileExist(categoryConfigureFilePath)
      ? (reader.readYaml(categoryConfigureFilePath) as CategoryConfigure)
      : ({} as CategoryConfigure);
  }

  private loadCategoryData() {
    this.path = getRelativePath(this.options.blogOutputPath, this.options.categoryOutputPath);
    return {
      path: getRelativePath(this.options.blogOutputPath, this.options.categoryOutputPath),
      categoryName: this.options.categoryName,
      articles: this.articles.map(a => a.getData())
    };
  }

  private loadArtices(): Article[] {
    const parsers = getParsersFromModules();

    // const inCategorypaths = fs.readdirSync(this.options.categoryInputPath);
    const inCategorypaths: string[] = this.controller.reader.readDirPaths(
      this.options.categoryInputPath
    );

    // TODO remove lodash
    const [files] = _.partition(inCategorypaths, pathName =>
      // TODO
      isFile(path.resolve(this.options.categoryInputPath, pathName))
    );

    const articleFilenames: string[] = files.filter(
      file => filterDotFiles(file) && R.values(parsers).some(parser => parser.check(file))
    );

    return articleFilenames.map(
      (articleFile: string): Article => {
        const articleFileNameWithoutSuffix = takeFileNameWithoutSuffix(articleFile);
        return new Article(
          {
            articleInputPath: path.join(this.options.categoryInputPath, articleFile),
            articleOutputPath: path.join(
              this.options.categoryOutputPath,
              articleFileNameWithoutSuffix,
              'index.html'
            ),
            rootOutputPath: this.options.blogOutputPath,
            rootInputPath: this.options.blogInputPath,
            categoryInputPath: this.options.categoryInputPath,
            categoryOutputPath: this.options.categoryOutputPath,
            filename: articleFile
          },
          this.controller
        );
      }
    );
  }
}
