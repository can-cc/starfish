import * as R from 'fw-ramda';

export class RenderPluginManager {
  plugins: any;

  constructor(options) {
    this.plugins = this.getPluginFromNodeMudules(options);
  }

  getPluginFromNodeMudules(options) {
    const plugins = {};
    ['nobbb-render-ajax', '../../plugin/sitemap', '../../plugin/recent-article'].forEach(name => {
      if (!plugins[name]) {
        const plugin = new (require(name)).default(options);
        plugins[plugin.getName()] = plugin;
      } else {
        throw new Error('duplicate plugin');
      }
    });
    return plugins;
  }

  getPlugin() {
    return this.plugins;
  }

  runPlugin() {}

  runPluinBeforeArticleRender(articleData) {
    R.values(this.plugins).forEach(plugin => {
      plugin.beforeArticleRender(articleData);
    });
  }

  runPluinAfterArticleRender(rawDocument, articleData) {
    R.values(this.plugins).forEach(plugin => {
      plugin.afterArticleRender(rawDocument, articleData);
    });
  }

  runPluinAfterRender(blog) {
    R.values(this.plugins).forEach(plugin => plugin.afterRender(blog));
  }

  runPluginAfterIndexRender(indexData) {
    R.values(this.plugins).forEach(plugin => plugin.afterIndexRender(indexData));
  }

  runPluinAfterwCategoryListRender(categorysData, options) {
    R.values(this.plugins).forEach(plugin => plugin.afterCategoryListRender(categorysData, options));
  }

  runPluinAfterCategoryRender(rendered, data) {
    R.values(this.plugins).forEach(plugin => plugin.afterCategoryRender(rendered, data));
  }
}

export default RenderPluginManager;
