import * as path from 'path';
import * as fs from 'fs';
import Category from './Category';
import { RenderController } from '../modules/render/render-controller';

export class BlogHome {
  constructor(
    private options: {
      homeOutputPath: string;
    },
    private categorys: Category[],
    private controller: RenderController
  ) {}

  public render(): void {
    // const allarticles = this.concatAllArticle().sort((a, b) => {
    //   return b.data.createTime.getTime() - a.data.createTime.getTime();
    // });

    // const categorys = this.categorys.map(category => {
    //   return {
    //     name: category.name,
    //     indexUrl: path.join('/', category.data.relativeOutputPath, 'index.html'),
    //     number: category.articles.length
    //   };
    // });

    const indexData = {
      // ...this.controller.getBlogInformation(),
      // articles: R.take(10, allarticles).map(a => a.data),
      // categorys: categorys
    };

    const html = this.controller.renderThemer.renderTemplate('INDEX', indexData);
    const outputFilePath = path.join(this.options.homeOutputPath, 'index.html');
    fs.writeFileSync(outputFilePath, html);
  }
}
