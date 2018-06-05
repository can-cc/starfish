import { RenderController } from '../../src/modules/render/render-controller';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { readConfigure } from '../../src/lib/loadConfig';

const inputPath = 'test/mock-source/';
const outputPath = 'test/test-build/';
const outputPathAbsolutelyPath = path.resolve(__dirname, '../../', outputPath);

test('integrated test render feather', async () => {
  const renderCtrl = new RenderController(inputPath, outputPath, readConfigure(path.join(__dirname, '../mock-source')));
  await renderCtrl.render();

  expect(fs.existsSync(path.join(outputPath, 'index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'categorys/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'categorys/index.json'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/hello-word/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/hello-word/index.json'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/index.json'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/metor/index.json'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/metor/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/metor/test.png'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'favicon.ico'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'sitemap.txt'))).toBe(true);
  expect(fs.readFileSync(path.join(outputPath, 'sitemap.txt'), 'utf8')).toBe(
`//test.starfish.org/javascript/hello-word/index.html
//test.starfish.org/javascript/metor/index.html`
  );
});
