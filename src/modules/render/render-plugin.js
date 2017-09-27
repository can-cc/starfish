import R from 'fw-ramda';

export class RenderPluginManager {
  constructor(options) {
    this.plugins = this.getPluginFromNodeMudules(options);
  }

  getPluginFromNodeMudules(options) {
    const plugins = {};
    ['nobbb-render-ajax', '../../plugin/sitemap'].forEach(name => {
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

  runPluinAfterRender() {
    R.values(this.plugins).forEach(plugin => plugin.afterRender());
  }

  runPluginAfterIndexRender(indexData) {
    R.values(this.plugins).forEach(plugin => plugin.afterIndexRender(indexData));
  }

  runPluinAfterwCategoryListRender(categorysData, options) {
    R.values(this.plugins).forEach(plugin => plugin.afterCategoryListRender(...arguments));
  }

  runPluinAfterCategoryRender(rendered, data) {
    R.values(this.plugins).forEach(plugin => plugin.afterwCategoryRender(rendered, data));
  }
}

export default RenderPluginManager;
