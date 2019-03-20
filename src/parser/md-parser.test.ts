import MarkdownParser from './md-parser';
import { ParseResult } from './parser';

test('markdown parser check filename', () => {
  const parser = new MarkdownParser();

  expect(parser.check('/d/workspace/mock.md')).toEqual(true);
  expect(parser.check('/d/workspace/mock.m')).toEqual(false);
  expect(parser.check('/d/workspace/mock.mdx')).toEqual(false);
});

test('markdown parser parser meta header data', () => {
  const parser = new MarkdownParser();

  const parseredResult: ParseResult = parser.parse(`
hiasd
  `);
  expect(parseredResult.content).toEqual('ads');
});
