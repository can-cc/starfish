import path from 'path';
import R from 'ramda';
import fs from 'fs';

export default class Index {
  constructor() {
  }

  render() {
    const allarticles = this.concatAllArticle().sort((a, b) => {
      return b.data.createTime.getTime() - a.data.createTime.getTime();
    });

    const categorys = this.categorys.map(category => {
      return {
        name: category.name,
        indexUrl: path.join('/', category.data.relativeOutputPath, 'index.html'),
        number: category.articles.length
      };
    });

    const indexData = {
      ...this.controller.getBlogInformation(),
      articles: R.take(10, allarticles).map(a => a.data),
      categorys: categorys
    };

    const html = this.controller.renderThemer.renderTemplate('INDEX', indexData);
    const outputFilePath = path.join(this.outputPath, 'index.html');
    fs.writeFileSync(outputFilePath, html);
  }
}
