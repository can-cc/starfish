import { RenderPluginManager } from './render-plugin';
import { Blog } from '../../model/Blog';
import { FSReader } from '../reader/FSReader';
import { FSWriter } from '../writer/FSWriter';
import { RenderController } from './render-controller';
import { RenderThemer } from './render-themer';

// let renderController;

beforeEach(() => {
  //   const reader = new FSReader();
  //   const writer = new FSWriter();
  //   renderController = new RenderController('d/', '', {
  //     STYLE: {
  //         THEMEDIR: 'test/mock-source/@themes',
  //         THEME: 'mock-theme'
  //     },
  //   } as BlogConfigure, reader, writer);
});

test('render-themer load correctly', () => {
  const renderThemer = new RenderThemer({
    inputPath: '',
    outputPath: '',
    blogConfigure: {
      BLOG: {
        DOMAIN: 'xx'
      },
      STYLE: {
        THEMEDIR: 'test/mock-source/@themes',
        THEME: 'mock-theme',
        THEME_CONFIG_FILE: 'theme.config.yaml'
      }
    } as BlogConfigure
  });
  renderThemer.load();

  expect(renderThemer.templateContentMap.INDEX).toBeDefined();
  expect(renderThemer.templateContentMap.CATEGORY_LIST).toBeDefined();
  expect(renderThemer.templateContentMap.CATEGORY).toBeDefined();
  expect(renderThemer.templateContentMap.ARTICLE).toBeDefined();
  expect(renderThemer.templateContentMap.ALL_ARTICLE).toBeDefined();
});
