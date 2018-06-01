import * as bluebird from 'bluebird';
import * as fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import { isDir } from '../lib/util';

const pfs = bluebird.promisifyAll(fs);

import Category from './Category';
import { BlogHome } from './Home';
import { CategoryList } from './CategoryList';
import { RenderController } from '../modules/render/render-controller';

export default class Blog {
  private categorys: Category[];
  private blogHome: any;
  private categoryList: any;

  constructor(
    private options: {
      blogInputPath: string;
      blogOutputPath: string;
      blogConfigure: any;
    },
    private controller: RenderController
  ) {
    this.load();
  }

  // private renderAllArticles(): void {
  //   const articles = this.getAllArticle();
  //   const articlePages = R.splitEvery(5, articles);
  // }

  public load(): void {
    this.categorys = this.loadCategorys();

    this.blogHome = new BlogHome(
      {
        homeOutputPath: this.options.blogOutputPath
      },
      this.categorys,
      this.controller
    );

    this.categoryList = new CategoryList(
      {
        categoryListOutputPath: path.join(this.options.blogOutputPath, 'categorys'),
        blogInputPath: this.options.blogInputPath,
        blogOutputPath: this.options.blogOutputPath
      },
      this.categorys,
      this.controller
    );
  }

  public render(): void {
    this.categorys.forEach(category => {
      // TODO merge two function
      category.render();
    });
    this.blogHome.render();
    this.categoryList.render();

    this.controller.renderPluginManager.runPluinAfterBlogRender(this);
  }

  public getAllArticle() {
    return R.compose(R.flatten, R.map(category => category.getAllArticles()))(this.categorys);
  }

  private loadCategorys(): Category[] {
    const categoryPaths = fs
      .readdirSync(this.options.blogInputPath)
      .filter(p => isDir(path.join(this.options.blogInputPath, p)));

    return categoryPaths.map(
      categoryName =>
        new Category(
          {
            categoryInputPath: path.join(this.options.blogInputPath, categoryName),
            categoryOutputPath: path.join(this.options.blogOutputPath, categoryName),
            categoryName,
            blogOutputPath: this.options.blogOutputPath,
            blogInputPath: this.options.blogInputPath
          },
          this.controller
        )
    );
  }
}
