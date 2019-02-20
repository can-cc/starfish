import { Article } from '../../model/Article';
import { CategoryList } from '../../model/CategoryList';
import { Category } from '../../model/Category';
import { Blog } from '../../model/Blog';

export abstract class StartFishRenderPlugin {
  public beforeArticleRender() {
    /*ignore*/
  }
  public afterArticleRender(renderedHtml: string, article: Article) {
    /*ignore*/
  }
  public afterCategoryRender(renderedHtml: string, category: Category) {
    /*ignore*/
  }
  public afterCategoryListRender(renderedHtml: string, categoryList: CategoryList) {
    /*ignore*/
  }
  public afterBlogRender(blog: Blog) {
    /*ignore*/
  }
}
