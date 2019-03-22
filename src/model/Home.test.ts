jest.mock('../modules/render/render-themer');
jest.mock('../modules/render/render-plugin');
jest.mock('./Category');

import { RenderController } from '../modules/render/render-controller';
import { FSReader } from '../modules/reader/FSReader';
import { FSWriter } from '../modules/writer/FSWriter';
import { BlogHome } from './Home';

test('Home load func', () => {
  const reader = new FSReader();
  const writer = new FSWriter();

  jest.spyOn(reader, 'readCategoryPaths').mockImplementation(() => {
    return ['/d/1', '/d/2'];
  });

  const categorys  = [];

  const renderController = new RenderController('', '', {} as BlogConfigure, reader, writer);
  const home = new BlogHome({ homeOutputPath: '' }, categorys, renderController);

  home.load();

  expect((<any>home).categorys).toEqual([]);
});

test('Home render func', () => {
    const renderTemplateSpy = jest.fn(() => 'HTMLLLLL');
    const writeFileSyncSpy = jest.fn(() => {});

    const categorys  = [];
    const renderController = {
        renderThemer: {
            renderTemplate: renderTemplateSpy
        },
        writer: {
            writeFileSync: writeFileSyncSpy
        } as any
    } as any;
  
    const home = new BlogHome({ homeOutputPath: '' }, categorys, renderController);
  
    home.render();

    expect(renderTemplateSpy).toHaveBeenCalledWith('INDEX', {});
    expect(writeFileSyncSpy).toHaveBeenCalledWith('index.html', 'HTMLLLLL');
  });
  