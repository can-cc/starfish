import { RenderPluginManager } from '../../src/modules/render/render-plugin';
import * as R from 'ramda';

let renderPlugin;

beforeEach(() => {
  renderPlugin = new RenderPluginManager({
    rootInputPath: '',
    rootOutputPath: ''
  });
});

test('adds 1 + 2 to equal 3', () => {
  const pluginNames = R.values(renderPlugin.getPlugin()).map(p => {
    return p.name;
  });
  expect(pluginNames).toEqual(['hg-api', 'sitemap', 'recent-article']);
});
