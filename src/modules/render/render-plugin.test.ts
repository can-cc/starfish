import { RenderPluginManager } from './render-plugin';
import { FSReader } from '../reader/FSReader';
import { FSWriter } from '../writer/FSWriter';
import { RenderController } from './render-controller';

let renderController;

beforeEach(() => {
  const reader = new FSReader();
  const writer = new FSWriter();
  renderController = new RenderController(
    '',
    '',
    {
      BLOG: {},
      STYLE: {
        THEMEDIR: 'test/mock-source/@themes',
        THEME: 'mock-theme',
        THEME_CONFIG_FILE: 'theme.config.yaml'
      }
    } as BlogConfigure,
    reader,
    writer
  );
});

test('RenderPluginManager getPlugin', () => {
  const renderPluginManager = new RenderPluginManager(
    {
      rootInputPath: '',
      rootOutputPath: '',
      blogConfigure: {
        BLOG: {
          DOMAIN: 'xx'
        }
      } as BlogConfigure
    },
    renderController
  );

  expect(renderPluginManager.getPlugin()['hg-api']).toBeDefined();
  expect(renderPluginManager.getPlugin()['recent-article']).toBeDefined();
  expect(renderPluginManager.getPlugin()['sitemap']).toBeDefined();
});
