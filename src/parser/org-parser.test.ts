import OrgParser from './org-parser';

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
