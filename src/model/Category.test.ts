import { Category } from './Category';
import { RenderController } from '../modules/render/render-controller';
import { Article } from './Article';

let controller;

beforeEach(() => {
  controller = {
    reader: {
      fileExist: () => true,
      readYaml: () => ({}),
      readDirPaths: () => []
    } as any,
    writer: {
      writeFileSync: () => {},
      mkdirSync: () => {}
    } as any,
    renderThemer: {
      renderTemplate: () => 'IAMHTML'
    } as any,
    renderPluginManager: {
      runPluinAfterCategoryRender: () => {}
    } as any
  } as RenderController;
});

test('Category load', () => {
  const category = new Category(
    {
      categoryInputPath: '',
      categoryOutputPath: '',
      blogInputPath: '',
      blogOutputPath: '',
      categoryName: 'javascript'
    },
    controller
  );

  category.load();

  expect((<any>category).categoryConfigure).toEqual({});
  expect((<any>category).articles).toEqual([]);
  expect((<any>category).categoryData).toEqual({
    articles: [],
    categoryName: 'javascript',
    path: './'
  });
});

test('Category render', () => {
  const category = new Category(
    {
      categoryInputPath: '',
      categoryOutputPath: 'test-output',
      blogInputPath: '',
      blogOutputPath: '',
      categoryName: 'javascript'
    },
    controller
  );

  const mockCategoryData = {
    path: '/path',
    categoryName: 'javascript',
    articles: []
  };

  (<any>category).categoryData = mockCategoryData;

  const mkdirSyncSpy = jest.spyOn(controller.writer, 'mkdirSync');
  const renderTemplateSpy = jest.spyOn(controller.renderThemer, 'renderTemplate');
  const writeFileSyncSpy = jest.spyOn(controller.writer, 'writeFileSync');
  const runPluinAfterCategoryRenderSpy = jest.spyOn(controller.renderPluginManager, 'runPluinAfterCategoryRender');
  const renderAllArticleSpy = jest.spyOn<any, any>(category, 'renderAllArticle').mockImplementation(() => {});

  category.render();

  expect(mkdirSyncSpy).toBeCalledWith('test-output');
  expect(renderTemplateSpy).toBeCalledWith('CATEGORY', mockCategoryData);
  expect(writeFileSyncSpy.mock.calls[0][0].replace('\\', '/')).toEqual('test-output/index.html');
  expect(writeFileSyncSpy.mock.calls[0][1].replace('\\', '/')).toEqual('IAMHTML');
  expect(runPluinAfterCategoryRenderSpy).toBeCalledWith('IAMHTML', category);
  expect(renderAllArticleSpy).toBeCalled();
});

test('Category renderAllArticle', () => {
  const category = new Category(
    {
      categoryInputPath: '',
      categoryOutputPath: '',
      blogInputPath: '',
      blogOutputPath: '',
      categoryName: 'javascript'
    },
    controller
  );

  const article = new Article(
    {
      articleInputPath: '',
      articleOutputPath: '',
      categoryInputPath: '',
      categoryOutputPath: '',
      rootInputPath: 'javascript',
      rootOutputPath: 'javascript',
      filename: 'javascript-good.md'
    },
    controller
  );

  const articleRenderSpy = jest.spyOn(article, 'render').mockImplementation(() => {});

  (<any>category).articles = [article];
  (<any>category).renderAllArticle();

  expect(articleRenderSpy).toBeCalled();
});

test('Category getAllArticles', () => {
  const category = new Category(
    {
      categoryInputPath: '',
      categoryOutputPath: '',
      blogInputPath: '',
      blogOutputPath: '',
      categoryName: 'javascript'
    },
    controller
  );
  (<any>category).articles = [];

  expect(category.getAllArticles()).toEqual([]);
});
