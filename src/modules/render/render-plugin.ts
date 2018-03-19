import * as R from 'ramda';

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

  public runPluinAfterArticleRender(rawDocument, articleData) {
    R.values(this.plugins).forEach(plugin => {
      plugin.afterArticleRender(rawDocument, articleData);
    });
  }

  public runPluinAfterRender(blog) {
    R.values(this.plugins).forEach(plugin => plugin.afterRender(blog));
  }

  public runPluginAfterIndexRender(indexData) {
    R.values(this.plugins).forEach(plugin => plugin.afterIndexRender(indexData));
  }

  public runPluinAfterwCategoryListRender(categorysData, options) {
    R.values(this.plugins).forEach(plugin =>
      plugin.afterCategoryListRender(categorysData, options)
    );
  }

  public runPluinAfterCategoryRender(rendered, data) {
    R.values(this.plugins).forEach(plugin => plugin.afterCategoryRender(rendered, data));
  }

  private getPluginFromNodeMudules(options) {
    const plugins = {};
    ['../../plugin/api', '../../plugin/sitemap', '../../plugin/recent-article'].forEach(name => {
      if (!plugins[name]) {
        const plugin = new (require(name)).default(options);
        plugins[plugin.getName()] = plugin;
      } else {
        throw new Error('duplicate plugin');
      }
    });
    return plugins;
  }
}
