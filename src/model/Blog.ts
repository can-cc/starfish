import path from 'path';
import R from 'ramda';
import { Category } from './Category';
import { BlogHome } from './Home';
import { CategoryList } from './CategoryList';
import { RenderController } from '../modules/render/render-controller';
import { RenderEntity } from './RenderEntity';
import { Archive } from './Archive';

export class Blog implements RenderEntity {
  private categorys: Category[];
  private blogHome: BlogHome;
  private archive: Archive;
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
        categoryListOutputPath: path.resolve(this.options.blogOutputPath, 'category'),
        blogInputPath: this.options.blogInputPath,
        blogOutputPath: this.options.blogOutputPath
      },
      this.categorys,
      this.controller
    );
    this.categoryList.load();

    this.archive = new Archive(
      {
        archiveOutputPath: path.resolve(this.options.blogOutputPath, 'category'),
        blogInputPath: this.options.blogInputPath,
        blogOutputPath: this.options.blogOutputPath
      },
      this.categorys,
      this.controller
    );
    this.archive.load();
  }

  public render(): void {
    this.categorys.forEach(category => {
      category.render();
    });
    this.blogHome.render();
    this.categoryList.render();
    this.archive.render();

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
