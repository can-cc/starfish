import { Article } from '../../model/Article';
import { CategoryList } from '../../model/CategoryList';
import { Category } from '../../model/Category';
import { Blog } from '../../model/Blog';
import { RenderController } from '../../modules/render/render-controller';

export abstract class StartFishRenderPlugin {
  constructor(protected options: PluginOptions, protected renderController: RenderController) {}

  public beforeArticleRender() {}

  public afterArticleRender(renderedHtml: string, article: Article) {}

  public afterCategoryRender(renderedHtml: string, category: Category) {}

  public afterCategoryListRender(renderedHtml: string, categoryList: CategoryList) {}

  public afterBlogRender(blog: Blog) {}
}
