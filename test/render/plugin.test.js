import RenderPlugin from '../../src/modules/render/render-plugin';

let renderPlugin;

beforeEach(() => {
  renderPlugin = new RenderPlugin();
});

test('adds 1 + 2 to equal 3', () => {
  const pluginNames = Object.values(renderPlugin.getPlugin()).map(p => p.getName());
  expect(pluginNames).toEqual(['ajax', 'sitemap', 'recent-article']);
});
