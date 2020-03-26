import OrgParser from './org-parser';
import { ParseResult } from './parser';

test('org mode parser check filename', () => {
  const parser = new OrgParser();

  expect(parser.check('/d/workspace/mock.org')).toEqual(true);
  expect(parser.check('/d/workspace/mock.m')).toEqual(false);
  expect(parser.check('/d/workspace/mock.mdx')).toEqual(false);
});

test('org mode parser check filename', () => {
  const parser = new OrgParser();

  expect(parser.check('/d/workspace/mock.org')).toEqual(true);
  expect(parser.check('/d/workspace/mock.m')).toEqual(false);
  expect(parser.check('/d/workspace/mock.mdx')).toEqual(false);
});


test('org parser parser meta header data', () => {
  const parser = new OrgParser();

  const parsedResult: ParseResult = parser.parse(`
#+TITLE: metor
#+DATE: 2019-09-11
#+AUTHOR: rebot

metor  
`);
  expect(parsedResult.title).toEqual(`metor`);
  expect(parsedResult.date).toEqual(`2019-09-11`);
  expect(parsedResult.type).toEqual('org');
});