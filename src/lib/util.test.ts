import { getRelativePath } from './util';

test('util takeFileName', () => {
  expect(getRelativePath('/d/star', '/d/star/xx/kl')).toEqual('/xx/kl');
});
