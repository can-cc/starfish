import { RenderController } from '../../src/modules/render/render-controller';
import * as fs from 'fs';
import * as path from 'path';
import { readConfigure } from '../../src/lib/loadConfig';
import { FSBlogReader } from '../../src/modules/reader/FSBlogReader';

// const rimraf = require('rimraf');

const inputPath = 'test/mock-source/';
const outputPath = 'test/test-build/';

// const outputPathAbsolutelyPath = path.resolve(__dirname, '../../', outputPath);

// afterAll(() => {
//   rimraf(outputPathAbsolutelyPath, () => {
//     console.log('remove mock-build output success.');
//   });
// });

const reader = new FSBlogReader();

test('integrated test render index.html', () => {
  const renderCtrl = new RenderController(
    inputPath,
    outputPath,
    readConfigure(path.join(__dirname, '../mock-source')),
    reader
  );
  renderCtrl.render();

  expect(fs.existsSync(path.join(outputPath, 'index.html'))).toBe(true);
});

test('integrated test render articles json', () => {
  const renderCtrl = new RenderController(
    inputPath,
    outputPath,
    readConfigure(path.join(__dirname, '../mock-source')),
    reader
  );
  renderCtrl.render();

  expect(fs.existsSync(path.join(outputPath, 'articles/articles-0.json'))).toBe(true);
});

test('integrated test render category index', () => {
  const renderCtrl = new RenderController(
    inputPath,
    outputPath,
    readConfigure(path.join(__dirname, '../mock-source')),
    reader
  );
  renderCtrl.render();

  expect(fs.existsSync(path.join(outputPath, 'categorys/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'categorys/index.json'))).toBe(true);
});

test('integrated test render feather', () => {
  const renderCtrl = new RenderController(
    inputPath,
    outputPath,
    readConfigure(path.join(__dirname, '../mock-source')),
    reader
  );
  renderCtrl.render();

  expect(fs.existsSync(path.join(outputPath, 'javascript/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/index.json'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/metor/index.json'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/metor/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/metor/test.png'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'favicon.ico'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'sitemap.txt'))).toBe(true);
});

test('integrated test render javascript/hello-word', () => {
  const renderCtrl = new RenderController(
    inputPath,
    outputPath,
    readConfigure(path.join(__dirname, '../mock-source')),
    reader
  );
  renderCtrl.render();

  expect(fs.existsSync(path.join(outputPath, 'javascript/hello-word/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/hello-word/index.json'))).toBe(true);
});

test('integrated test render simemap.txt', () => {
  const renderCtrl = new RenderController(
    inputPath,
    outputPath,
    readConfigure(path.join(__dirname, '../mock-source')),
    reader
  );
  renderCtrl.render();

  expect(fs.readFileSync(path.join(outputPath, 'sitemap.txt'), 'utf8')).toBe(
    `http://test.starfish.org/javascript/hello-word/index.html
http://test.starfish.org/javascript/metor/index.html`
  );
});
