import * as R from 'ramda';
import { CategoryList } from '../../model/CategoryList';
import { Category } from '../../model/Category';
import { Blog } from '../../model/Blog';
import { Article } from '../../model/Article';

export class RenderPluginManager {
  private plugins: any;

  constructor(options) {
    this.plugins = this.getPluginFromNodeMudules(options);
  }

  public getPlugin() {
    return this.plugins;
  }

  public runPlugin() {
    /*ignore*/
  }

  public runPluinBeforeArticleRender(articleData) {
    R.values(this.plugins).forEach(plugin => {
      plugin.beforeArticleRender(articleData);
    });
  }

  public runPluinAfterArticleRender(renderedHtml: string, article: Article) {
    R.values(this.plugins).forEach(plugin => {
      plugin.afterArticleRender(renderedHtml, article);
    });
  }

  public runPluinAfterRender(blog: Blog) {
    R.values(this.plugins).forEach(plugin => plugin.afterBlogRender(blog));
  }

  public runPluinAfterCategoryListRender(renderedHtml: string, categoryList: CategoryList): void {
    R.values(this.plugins).forEach(plugin =>
      plugin.afterCategoryListRender(renderedHtml, categoryList)
    );
  }

  public runPluinAfterCategoryRender(renderedHtml: string, category: Category) {
    R.values(this.plugins).forEach(plugin => plugin.afterCategoryRender(renderedHtml, category));
  }

  public runPluinAfterBlogRender(blog: Blog) {
    R.values(this.plugins).forEach(plugin => plugin.afterBlogRender(blog));
  }

  private getPluginFromNodeMudules(options) {
    const plugins = {};
    ['../../plugin/hg-api', '../../plugin/sitemap', '../../plugin/recent-article'].forEach(name => {
      if (!plugins[name]) {
        const plugin = new (require(name)).default(options);
        plugins[plugin.name] = plugin;
      } else {
        throw new Error('duplicate plugin');
      }
    });
    return plugins;
  }
}
