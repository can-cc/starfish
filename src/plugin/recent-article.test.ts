import StarFishRenderRecentArticle from './recent-article';

test('recent article afterBlogRender', () => {
  const writeFileSyncSpy = jest.fn();
  const renderController = {
    writer: {
      writeFileSync: writeFileSyncSpy
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
      return [];
    }
  } as any;

  starFishRenderRecentArticle.afterBlogRender(mockBlog);
  expect(writeFileSyncSpy).toBeCalledWith('/dreamplace/heart/recent-articles.json', '[]');
});
