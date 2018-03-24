import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as R from 'fw-ramda';
import * as yaml from 'js-yaml';
import { isFile, takeFileNameWithoutSuffix, filterDotFiles, getRelativePath } from '../lib/util';

import { Article } from './Article';
import { getParsersFromModules } from '../modules/render/render-util';

export default class Category {
  private articles: Article[];
  private categoryData;
  private categoryConfigure: CategoryConfigure;

  constructor(
    private options: {
      categoryInputPath: string;
      categoryOutputPath: string;
      blogInputPath: string;
      blogOutputPath: string;
      categoryName;
    },
    private controller
  ) {
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
      fs.mkdirSync(this.options.categoryOutputPath);
    }

    const outputHtmlContent = this.controller.renderThemer.renderTemplate(
      'CATEGORY',
      this.categoryData
    );

    const categoryIndexFilePath: string = path.join(this.options.categoryOutputPath, 'index.html');

    // TODO move to hg-api handle
    // fs.writeFileSync(categoryIndexFilePath, outputHtmlContent);
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
    return fs.existsSync(categoryConfigureFilePath)
      ? yaml.safeLoad(fs.readFileSync(categoryConfigureFilePath, 'utf8')) as CategoryConfigure
      : {};
  }

  private loadCategoryData() {
    return {
      path: getRelativePath(this.options.blogOutputPath, this.options.categoryOutputPath),
      categoryName: this.options.categoryName,
      articles: this.articles.map(a => a.getData())
    };
  }

  private loadArtices(): Article[] {
    const parsers = getParsersFromModules();
    const inCategorypaths = fs.readdirSync(this.options.categoryInputPath);

    // TODO remove loadsh
    const [files] = _.partition(inCategorypaths, pathName =>
      isFile(path.resolve(this.options.categoryInputPath, pathName))
    );

    const articleFilenames: string[] = files.filter(
      file => filterDotFiles(file) && R.values(parsers).some(parser => parser.check(file))
    );

    return articleFilenames.map((articleFile: string): Article => {
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
    });
  }
}
