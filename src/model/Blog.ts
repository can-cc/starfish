import * as path from 'path';
import R from 'ramda';
import { Category } from './Category';
import { BlogHome } from './Home';
import { CategoryList } from './CategoryList';
import { RenderController } from '../modules/render/render-controller';
import { RenderEntity } from './RenderEntity';

export class Blog implements RenderEntity {
  private categorys: Category[];
  private blogHome: BlogHome;
  private categoryList: CategoryList;

  constructor(
    private options: {
      blogInputPath: string;
      blogOutputPath: string;
      blogConfigure: BlogConfigure;
    },
    private controller: RenderController
  ) {}

  public load(): void {
    this.categorys = this.loadCategorys();
    this.categorys.forEach(c => c.load());

    this.blogHome = new BlogHome(
      {
        homeOutputPath: this.options.blogOutputPath
      },
      this.categorys,
      this.controller
    );

    this.categoryList = new CategoryList(
      {
        categoryListOutputPath: path.resolve(this.options.blogOutputPath, 'categorys'),
        blogInputPath: this.options.blogInputPath,
        blogOutputPath: this.options.blogOutputPath
      },
      this.categorys,
      this.controller
    );
    this.categoryList.load();
  }

  public render(): void {
    this.categorys.forEach(category => {
      category.render();
    });
    this.blogHome.render();
    this.categoryList.render();

    this.controller.renderPluginManager.runPluinAfterBlogRender(this);
  }

  public getAllArticle() {
    return R.compose(
      R.flatten,
      R.map(category => category.getAllArticles())
    )(this.categorys);
  }

  private loadCategorys(): Category[] {
    const categoryPaths: string[] = this.controller.reader.readCategoryPaths(
      path.join(this.options.blogInputPath, this.options.blogConfigure.BLOG.ARTICLES_DIR)
    );

    // fs
    //   .readdirSync(this.options.blogInputPath)
    //   .filter(p => isDir(path.join(this.options.blogInputPath, p)));

    return categoryPaths.map((categoryName: string) => {
      return new Category(
        {
          categoryInputPath: path.join(
            this.options.blogInputPath,
            this.options.blogConfigure.BLOG.ARTICLES_DIR,
            categoryName
          ),
          categoryOutputPath: path.join(this.options.blogOutputPath, categoryName),
          categoryName,
          blogOutputPath: this.options.blogOutputPath,
          blogInputPath: this.options.blogInputPath
        },
        this.controller
      );
    });
  }
}
