import RenderPlugin from '../../src/modules/render/render-plugin';

let renderPlugin;

beforeEach(function() {
  renderPlugin = new RenderPlugin();
});

test('adds 1 + 2 to equal 3', function() {
  const pluginNames = Object.values(renderPlugin.getPlugin()).map(function(p) {
    return p.getName();
  });
  expect(pluginNames).toEqual(['ajax', 'sitemap', 'recent-article']);
});
