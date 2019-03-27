jest.mock('../modules/render/render-themer');
jest.mock('../modules/render/render-plugin');
jest.mock('./Category');

import { RenderController } from '../modules/render/render-controller';
import { FSReader } from '../modules/reader/FSReader';
import { FSWriter } from '../modules/writer/FSWriter';
import { CategoryList } from './CategoryList';
import { Category } from './Category';

test('CategoryList load func', () => {
  const reader = new FSReader();
  const writer = new FSWriter();

  jest.spyOn(reader, 'readCategoryPaths').mockImplementation(() => {
    return ['/d/1', '/d/2'];
  });

  const category = {
    getData: () => ({
      path: './cate',
      categoryName: 'python'
    })
  } as Category;
  const categorys = [category];

  const renderController = new RenderController('', '', {} as BlogConfigure, reader, writer);
  const categoryList = new CategoryList(
    {
      categoryListOutputPath: '',
      blogInputPath: '',
      blogOutputPath: ''
    },
    categorys,
    renderController
  );

  categoryList.load();

  expect((<any>categoryList).data).toEqual({
    categoryList: [
      {
        categoryName: 'python',
        path: './cate'
      }
    ],
    path: './'
  });
});

test('CategoryList render func', () => {
  const category = {
    getData: () => ({
      path: './cate',
      categoryName: 'python'
    })
  } as Category;
  const categorys = [category];

  const runPluinAfterCategoryListRenderSpy = jest.fn();
  const renderTemplateSpy = jest.fn(() => 'HTMLLLL');
  const existsSyncSpy = jest.fn(() => false);
  const mkdirSyncSpy = jest.fn(() => {});

  const renderController = {
    writer: {
      writeFileSync: () => {},
      mkdirSync: mkdirSyncSpy
    } as any,
    reader: {
      existsSync: existsSyncSpy
    },
    renderPluginManager: {
      runPluinAfterCategoryListRender: runPluinAfterCategoryListRenderSpy
    },
    renderThemer: {
      renderTemplate: renderTemplateSpy
    } as any
  } as any;

  const categoryList = new CategoryList(
    {
      categoryListOutputPath: 'o-path',
      blogInputPath: '',
      blogOutputPath: ''
    },
    categorys,
    renderController
  );

  (<any>categoryList).data = {
    path: './'
  } as CategoryListData;

  categoryList.render();

  expect(existsSyncSpy).toHaveBeenCalled();
  expect(mkdirSyncSpy).toBeCalledWith('o-path');
  expect(renderTemplateSpy).toBeCalledWith('CATEGORY_LIST', {
    path: './'
  });
  expect(runPluinAfterCategoryListRenderSpy).toBeCalledWith('HTMLLLL', categoryList);
});
