import MarkdownParser from './md-parser';

test('markdown parser check filename', () => {
  const parser = new MarkdownParser();

  expect(parser.check('/d/workspace/mock.md')).toEqual(true);
  expect(parser.check('/d/workspace/mock.m')).toEqual(false);
  expect(parser.check('/d/workspace/mock.mdx')).toEqual(false);
});
