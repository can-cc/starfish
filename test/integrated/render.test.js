import RenderController from '../../modules/render/render';
import fs from 'fs';
import path from 'path';

test('integrated test render feather', async done => {
  const inputPath = 'test/mock-source/';
  const outputPath = 'test/test-build/';
  const renderCtrl = new RenderController(inputPath, outputPath);
  await renderCtrl.render();
  expect(fs.existsSync(path.join(outputPath, 'index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'categorys/index.html'))).toBe(
    true
  );
  expect(fs.existsSync(path.join(outputPath, 'categorys/index.json'))).toBe(
    true
  );
  expect(fs.existsSync(path.join(outputPath, 'articles/hello-word.json'))).toBe(
    true
  );
  expect(fs.existsSync(path.join(outputPath, 'articles/hello-word.html'))).toBe(
    true
  );
  expect(fs.existsSync(path.join(outputPath, 'articles/index.html'))).toBe(
    true
  );
  expect(fs.existsSync(path.join(outputPath, 'articles/index.json'))).toBe(
    true
  );
  done();
});
