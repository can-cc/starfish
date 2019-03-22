import * as path from 'path';
import { Category } from './Category';
import { RenderController } from '../modules/render/render-controller';
import { RenderEntity } from './RenderEntity';

export class BlogHome implements RenderEntity {
  constructor(
    private options: {
      homeOutputPath: string;
    },
    private categorys: Category[],
    private controller: RenderController
  ) {}

  public load() {}

  public render(): void {
    const indexData = {
      // ...this.controller.getBlogInformation(),
      // articles: R.take(10, allarticles).map(a => a.data),
      // categorys: categorys
    };

    const html = this.controller.renderThemer.renderTemplate('INDEX', indexData);
    const outputFilePath = path.join(this.options.homeOutputPath, 'index.html');
    this.controller.writer.writeFileSync(outputFilePath, html);
  }
}
