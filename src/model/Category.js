import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import R from 'fw-ramda';
import { isFile, takeFileNameWithoutSuffix, filterDotFiles } from '../lib/util';

import Article from './Article';

export default class Category {
  constructor(options, controller) {
    this.name = options.name;
    this.options = options;
    this.parsers = options.parsers;
    this.inputPath = options.inputPath;
    this.outputPath = options.outputPath;
    this.controller = controller;

    this.articles = [];

    this.loadCategoryConfigure();
  }

  load() {
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
        // TODO why merge this.options
        Object.assign({}, this.options, {
          inputPath: path.join(this.inputPath, articleFile),
          outputPath: path.join(this.outputPath, articleFileNameWithoutSuffix, 'index.html'),
          articleFileNameWithoutSuffix,
          categoryInputPath: this.inputPath,
          categoryOutputPath: this.outputPath,
          name: articleFileNameWithoutSuffix,
          category: this.options
        }),
        this.controller
      );
      article.load();
      this.addArticle.call(this, article);
    });
    this.data.articleNumber = articleFiles.length;
  }

  loadCategoryConfigure() {
    // TODO
    this.categoryConfigure = {};
    const categoryConfigureFilePath = path.join(this.inputPath, '.wdconfig.yaml');
  }

  getAllArticles() {
    return this.articles;
  }

  addArticle(article) {
    this.articles.push(article);
  }

  render() {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath);
    }

    const sortedArticles = this.articles.sort((a, b) => {
      return b.data.createTime.getTime() - a.data.createTime.getTime();
    });

    const pageN = Math.ceil(sortedArticles.length / 10);
    _.chunk(sortedArticles, 10).forEach((articleChunk, i) => {
      const outputDir = i === 0 ? this.outputPath : path.join(this.outputPath, 'page', i + 1 + '/');
      const outputFilePath = path.join(outputDir, 'index.html');
      const data = {
        outputPath: this.outputPath,
        categoryPath: outputDir,
        inputPath: this.inputPath,
        title: this.name,
        name: this.name,
        articles: articleChunk.map(a => a.data),
        pageN: i,
        currentPageN: pageN
      };

      const html = this.controller.renderThemer.renderTemplate('CATEGORY', data);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      fs.writeFileSync(outputFilePath, html);
      this.controller.renderPluginManager.runPluinAfterCategoryRender(html, data);
    });
  }

  renderAllArticle() {
    this.articles.forEach(article => {
      article.render();
    });
  }
}
