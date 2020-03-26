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
title: hello
date: 2019-04-01
---
`);
  expect(parseredResult.title).toEqual(`hello`);
  expect(parseredResult.date).toEqual(`2019-04-01`);
  expect(parseredResult.type).toEqual('markdown');
});

test('markdown parser parser markdown content', () => {
  const parser = new MarkdownParser();

  const parseredResult: ParseResult = parser.parse(`
title: hello
date: 2019-04-01
---
# hi
- first
- second
  `);
  expect(parseredResult.content).toEqual(`<h1 id="hi">hi</h1>
<ul>
<li>first</li>
<li>second</li>
</ul>
`);
});
