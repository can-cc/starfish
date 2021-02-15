import StarFishRenderRecentArticle from './recent-article';

test('recent article afterBlogRender', () => {
  const writeFileSyncSpy = jest.fn();
  const renderController = {
    writer: {
      writeFileSync: writeFileSyncSpy,
      existsSync: () => true
    }
  } as any;
  const starFishRenderRecentArticle: StarFishRenderRecentArticle = new StarFishRenderRecentArticle(
    {
      rootOutputPath: '/dreamplace/heart'
    } as PluginOptions,
    renderController
  );

  const mockBlog = {
    getAllArticle: () => {
      return [{data: 'mock'}];
    }
  } as any;

  starFishRenderRecentArticle.afterBlogRender(mockBlog);
  expect(writeFileSyncSpy).toHaveBeenCalledTimes(2);
  expect(writeFileSyncSpy).toBeCalledWith('/dreamplace/heart/recent-articles.json', '[\"mock\"]');
  expect(writeFileSyncSpy).toBeCalledWith('/dreamplace/heart/recent-articles-0.json', '{\"pageSize\":10,\"total\":1,\"articles\":[\"mock\"]}');
});
