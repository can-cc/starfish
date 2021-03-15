import { RenderController } from '../../src/modules/render/render-controller';
import * as fs from 'fs';
import * as path from 'path';
import { BlogConfigureLoader } from '../../src/lib/BlogConfigureLoader';
import { FSReader } from '../../src/modules/reader/FSReader';
import { FSWriter } from '../../src/modules/writer/FSWriter';

const rimraf = require('rimraf');

const inputPath = 'test/mock-source/';
const outputPath = 'test/test-build/';
const blogConfigureLoader = new BlogConfigureLoader();
blogConfigureLoader.read(path.join(__dirname, '../mock-source'));

const outputPathAbsolutelyPath = path.resolve(__dirname, '../../', outputPath);


beforeAll(() => {
  const renderCtrl = new RenderController(
    inputPath,
    outputPath,
    blogConfigureLoader.getConfigure(),
    reader,
    writer
  );
  renderCtrl.render();
});

afterAll(() => {
  rimraf(outputPathAbsolutelyPath, () => {});
});

const reader = new FSReader();
const writer = new FSWriter();

test('integrated test render index.html', () => {
  expect(fs.existsSync(path.join(outputPath, 'index.html'))).toBe(true);
});

test('integrated test render articles json', () => {
  expect(fs.existsSync(path.join(outputPath, 'articles/articles-0.json'))).toBe(true);
});

test('integrated test render category index', () => {
  expect(fs.existsSync(path.join(outputPath, 'category/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'category/index.json'))).toBe(true);
});

test('integrated test render archive index', () => {
  expect(fs.existsSync(path.join(outputPath, 'archive/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'archive/index.json'))).toBe(true);
});

test('integrated test render feather', () => {
  expect(fs.existsSync(path.join(outputPath, 'javascript/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/index.json'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/metor/index.json'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/metor/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/metor/test.png'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'favicon.ico'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'sitemap.txt'))).toBe(true);
});

test('integrated test render javascript/hello-word', () => {
  expect(fs.existsSync(path.join(outputPath, 'javascript/hello-word/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputPath, 'javascript/hello-word/index.json'))).toBe(true);
});

test('integrated test render simemap.txt', () => {
  expect(fs.readFileSync(path.join(outputPath, 'sitemap.txt'), 'utf8')).toBe(
    `http://test.starfish.org/javascript/hello-word/index.html
http://test.starfish.org/javascript/metor/index.html`
  );
});

test('integrated test render rencent-articles.json', () => {
  const articles = JSON.parse(fs.readFileSync(path.join(outputPath, 'recent-articles.json'), 'utf8'));
  const articlesPage0 = JSON.parse(fs.readFileSync(path.join(outputPath, 'recent-articles-0.json'), 'utf8'));
  expect(articles.map(a => a.title)).toEqual(['hello world', 'metor']);
  expect(articlesPage0.articles.map(a => a.title)).toEqual(['hello world', 'metor']);
  expect(articlesPage0.total).toEqual(2);
  expect(articlesPage0.pageSize).toEqual(10);
});
