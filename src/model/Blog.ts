import * as bluebird from 'bluebird';
import * as fs from 'fs';
import * as path from 'path';
import * as R from 'fw-ramda';
import { isDir } from '../lib/util';

const pfs = bluebird.promisifyAll(fs);

import Category from './Category';
import BlogHome from './Home';
import CategoryList from './CategoryList';
import { RenderController } from '../modules/render/render-controller';

export default class Blog {
  private categorys: Category[];
  private blogHome: any;
  private categoryList: any;

  constructor(
    private options: {
      blogInputPath: string;
      blogOutputPath: string;
      parsers: any; // TODO delete here
      blogConfigure: any;
    },
    private controller: RenderController
  ) {
    this.load();
  }

  public load(): void {
    this.categorys = this.loadCategorys();
    this.categorys.forEach(category => {
      // TODO move to constructor
      category.load();
    });

    this.blogHome = new BlogHome(this.options, this.categorys, this.controller);
    this.categoryList = new CategoryList(this.options, this.categorys, this.controller);
  }


  public render() {
    this.categorys.forEach(category => {
      // TODO merge two function
      category.render();
      category.renderAllArticle();
    });
    this.blogHome.render();
    this.categoryList.render();
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
            inputPath: path.join(this.options.blogInputPath, categoryName),
            outputPath: path.join(this.options.blogOutputPath, categoryName),
            name: categoryName,
            outputRootPath: this.options.blogOutputPath,
            inputRootPath: this.options.blogInputPath,
            parsers: this.options.parsers
          },
          this.controller
        )
    );
  }

}
