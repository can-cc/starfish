import * as R from 'ramda';
import { CategoryList } from '../../model/CategoryList';
import { Category } from '../../model/Category';
import { Blog } from '../../model/Blog';
import { Article } from '../../model/Article';
import { StartFishRenderPlugin } from '../../plugin/interface/render-plugin';
import { RenderController } from './render-controller';

export class RenderPluginManager {
  private plugins: { [name: string]: StartFishRenderPlugin[] };

  constructor(
    private options: {
      rootInputPath: string;
      rootOutputPath: string;
      blogConfigure: BlogConfigure;
    },
    private renderController: RenderController
  ) {
    this.plugins = this.getPluginFromNodeMudules(options);
  }

  public getPlugin() {
    return this.plugins;
  }

  public runPlugin() {}

  public runPluginBeforeArticleRender(articleData) {
    R.values(this.plugins).forEach(plugin => {
      plugin.beforeArticleRender(articleData);
    });
  }

  public runPluginAfterArticleRender(renderedHtml: string, article: Article) {
    R.values(this.plugins).forEach(plugin => {
      plugin.afterArticleRender(renderedHtml, article);
    });
  }

  public runPluginAfterRender(blog: Blog) {}

  public runPluinAfterCategoryListRender(renderedHtml: string, categoryList: CategoryList): void {
    R.values(this.plugins).forEach(plugin => plugin.afterCategoryListRender(renderedHtml, categoryList));
  }

  public runPluinAfterCategoryRender(renderedHtml: string, category: Category) {
    R.values(this.plugins).forEach(plugin => plugin.afterCategoryRender(renderedHtml, category));
  }

  public runPluinAfterBlogRender(blog: Blog) {
    R.values(this.plugins).forEach(plugin => plugin.afterBlogRender(blog));
  }

  private getPluginFromNodeMudules(options): { [name: string]: StartFishRenderPlugin[] } {
    const plugins = {};
    ['../../plugin/hg-api', '../../plugin/sitemap', '../../plugin/recent-article'].forEach(name => {
      if (!plugins[name]) {
        const plugin = new (require(name)).default(options, this.renderController);
        plugins[plugin.name] = plugin;
      } else {
        throw new Error('duplicate plugin');
      }
    });
    return plugins;
  }
}
