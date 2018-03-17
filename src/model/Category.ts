import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as R from 'fw-ramda';
import { isFile, takeFileNameWithoutSuffix, filterDotFiles, getRelativePath } from '../lib/util';

import { Article } from './Article';
import { getParsersFromModules } from '../modules/render/render-util';

export default class Category {
  private articles: Article[];
  private categoryData;

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
    this.loadCategoryConfigure();

    this.load();
  }

  public getAllArticles(): Article[] {
    return this.articles;
  }

  public getCategoryData() {
    return this.categoryData;
  }

  public render() {
    if (!fs.existsSync(this.options.categoryOutputPath)) {
      fs.mkdirSync(this.options.categoryOutputPath);
    }

    const sortedArticles = this.articles.sort((a, b) => {
      return b.data.createTime - a.data.createTime;
    });

    const categoryData = {
      path: getRelativePath(this.options.blogOutputPath, this.options.categoryOutputPath),
      categoryName: this.options.categoryName,
      articles: this.articles.map(a => a.data)
    };


    const html = this.controller.renderThemer.renderTemplate('CATEGORY', categoryData);

    if (!fs.existsSync(this.options.categoryOutputPath)) {
      fs.mkdirSync(this.options.categoryOutputPath);
    }

    const categoryIndexFilePath: string = path.join(this.options.categoryOutputPath, 'index.html');

    fs.writeFileSync(categoryIndexFilePath, html);
    this.controller.renderPluginManager.runPluinAfterCategoryRender(html, categoryData);


    this.renderAllArticle();
  }

  private renderAllArticle() {
    this.articles.forEach(article => {
      article.render();
    });
  }

  private loadCategoryConfigure() {
    const categoryConfigureFilePath = path.join(this.options.categoryInputPath, '.category.yaml');
  }

  private load() {
    const parsers = getParsersFromModules();
    const paths = fs.readdirSync(this.options.categoryInputPath);

    const [files, dirs] = _.partition(paths, pathName =>
      isFile(path.resolve(this.options.blogInputPath, pathName))
    );

    const articleFilenames: string[] = files.filter(
      file => filterDotFiles(file) && R.values(parsers).some(parser => parser.check(file))
    );

    this.articles =  articleFilenames.map((articleFile: string) => {
      const articleFileNameWithoutSuffix = takeFileNameWithoutSuffix(articleFile);
      const article = new Article(
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

      return article;
    });
  }
}
