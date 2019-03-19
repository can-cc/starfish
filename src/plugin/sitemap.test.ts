import StarFishRenderSiteMap from './sitemap';
import { FSReader } from '../modules/reader/FSReader';
import { FSWriter } from '../modules/writer/FSWriter';
import { RenderController } from '../modules/render/render-controller';

let renderController;

beforeEach(() => {
  const reader = new FSReader();
  const writer = new FSWriter();
  renderController = new RenderController(
    '',
    '',
    {
      BLOG: {
        DOMAIN: 'xx'
      },
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

test('sitemap afterBlogRender fileURLToPath', () => {
  const starFishRenderSiteMap = new StarFishRenderSiteMap(
    {
      blogConfigure: {
        BLOG: {
          DOMAIN: 'xx'
        }
      }
    } as PluginOptions,
    renderController
  );

  expect((<any>starFishRenderSiteMap).fileURLToPath(`\\asdasdas\\asdasd\\asd`)).toEqual(
    '/asdasdas/asdasd/asd'
  );
});
