import * as _ from 'lodash';

import { Article } from '../Article';
import { RenderEntity } from '../RenderEntity';

export class Category implements RenderEntity {
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
  ) {}

  public load = jest.fn();

  public render(): void {}

  public getData(): any {
    return {};
  }
}
