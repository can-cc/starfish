import { filterDotFiles } from './util';

test('util filterDotFiles', () => {
  expect(filterDotFiles(['.sdsd', 'file'])).toEqual(['file']);
});
