import { RenderController } from '../modules/render/render-controller';
import { Article } from './Article';

let controller;

beforeEach(() => {
  controller = {
    reader: {
      fileExist: () => true,
      readYaml: () => {},
      readDirPaths: () => [],
      readFileSync: () => {},
      existsSync: () => true
    } as any
  } as RenderController;
});

test('Article load', () => {
  const article = new Article(
    {
      articleInputPath: 'javascript/javascript-good.md',
      articleOutputPath: '',
      categoryInputPath: '',
      categoryOutputPath: '',
      rootInputPath: 'javascript',
      rootOutputPath: 'javascript',
      filename: 'javascript-good.md'
    },
    controller
  );

  jest.spyOn<any, any>(article, 'getArticleGitData').mockImplementation(() => ({
    createTime: 1552966034338,
    modifyTime: 1552966034338,
    showTime: 1552966034338
  }));

  jest.spyOn<Article, any>(article, 'parseArticle').mockImplementation(() => ({
    document: {
      title: 'hi',
      date: '2019-06-01',
      content: 'content',
      type: 'markdown',
    } as ArticleDocument,
    type: 'markdown'
  }));

  article.load();

  expect(article.filenameWithoutSuffix).toEqual('javascript-good');
  expect(article.assetPath.indexOf('javascript-good')).toBeGreaterThan(0);
  expect(article.outputDirPath.indexOf('javascript-good')).toBeGreaterThan(0);
  expect(article.data).toEqual({
    content: "<html><head></head><body>content</body></html>",
    createTime: 1552966034338,
    dirPath: "-good",
    hasAsset: true,
    id: "49f68a5",
    modifyTime: 1552966034338,
    path: "./",
    showTime: 1552966034338,
    title: "hi",
    type: "markdown"
  });
});
