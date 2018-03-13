import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as R from 'fw-ramda';
import { isFile, takeFileNameWithoutSuffix, filterDotFiles, getRelativePath } from '../lib/util';

import { Article } from './Article';

export default class Category {
  name: string;
  parsers: any;
  articles = [];
  data: any;
  aliasName: string;
  categoryConfigure: any;

  constructor(
    private options: {
      categoryInputPath: string;
      categoryOutputPath: string;
      rootInputPath: string;
      rootOutputPath: string;
      categoryName;
      parsers: any;
    },
    private controller
  ) {
    this.parsers = options.parsers;
    this.controller = controller;

    this.loadCategoryConfigure();

    this.load();
  }

  private load() {
    this.data = {
      relativeOutputPath: this.name,
      name: this.name || this.aliasName
    };

    const paths = fs.readdirSync(this.inputPath);

    const [files, dirs] = _.partition(paths, pathName =>
      isFile(path.resolve(this.inputPath, pathName))
    );
    const articleFiles = files.filter(
      file => filterDotFiles(file) && R.values(this.parsers).some(parser => parser.check(file))
    );

    articleFiles.forEach(articleFile => {
      const articleFileNameWithoutSuffix = takeFileNameWithoutSuffix(articleFile);
      const article = new Article(
        {
          articleInputPath: path.join(this.options.categoryInputPath, articleFile),
          articleOutputPath: path.join(
            this.options.categoryOutputPath,
            articleFileNameWithoutSuffix,
            'index.html'
          ),
          rootOutputPath: this.options.rootOutputPath,
          rootInputPath: this.options.rootInputPath,
          categoryInputPath: this.options.categoryInputPath,
          categoryOutputPath: this.options.categoryOutputPath,
          filename: articleFile
        },
        this.controller
      );
      this.addArticle.call(this, article);
    });
    this.data.articleNumber = articleFiles.length;
  }

  loadCategoryConfigure() {
    // TODO
    this.categoryConfigure = {};
    const categoryConfigureFilePath = path.join(this.options.categoryInputPath, '.wdconfig.yaml');
  }

  getAllArticles() {
    return this.articles;
  }

  addArticle(article) {
    this.articles.push(article);
  }

  render() {
    if (!fs.existsSync(this.options.categoryOutputPath)) {
      fs.mkdirSync(this.options.categoryOutputPath);
    }

    const sortedArticles = this.articles.sort((a, b) => {
      return b.data.createTime - a.data.createTime;
    });
    
    const categoryData = {
      path: getRelativePath(this.options.rootOutputPath, this.options.categoryOutputPath)
    }
    // const data = {
    //   outputPath: this.outputPath,
    //   categoryPath: outputDir,
    //   inputPath: this.inputPath,
    //   title: this.name,
    //   name: this.name,
    //   articles: articleChunk.map(a => a.data),
    //   pageN: i,
    //   currentPageN: pageN
    // };

    const html = this.controller.renderThemer.renderTemplate('CATEGORY', data);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    fs.writeFileSync(outputFilePath, html);
    this.controller.renderPluginManager.runPluinAfterCategoryRender(html, data);
  }

  renderAllArticle() {
    this.articles.forEach(article => {
      article.render();
    });
  }
}
