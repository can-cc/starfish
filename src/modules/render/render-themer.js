import { loadConfig } from '../../lib/loadConfig';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import R from 'fw-ramda';
import ejs from 'ejs';
import fsExtra from 'fs-extra';
import {
  isFile,
  isDir,
  takeFileName,
  takeFileNameWithoutSuffix,
  getRelativePath,
  filterDotFiles,
  isSuffix,
  mergeForce
} from '../../lib/util';

const isYaml = R.curry(isSuffix)('yaml');

export default class RenderThemer {
  constructor(inputPath, outputRoot, configure) {
    this.inputPath = inputPath;
    this.outputPath = outputRoot;
    this.configure = configure;

    this.theme = this.configure.STYLE.THEME;
    this.themePath = path.join(
      path.isAbsolute(this.configure.STYLE.THEMEDIR)
        ? this.configure.STYLE.THEMEDIR
        : path.resolve(this.inputPath, this.configure.STYLE.THEMEDIR),
      this.theme
    );

    this.themeConfigure = yaml.safeLoad(
      fs.readFileSync(path.join(this.themePath, this.configure.CONFIG.CONFIG_FILE), 'utf8')
    );
    this.loadTemplates();
  }

  async copyThemeAsset() {
    const templatesAssetMap = this.themeConfigure.THEME_MAPPING;
    await Promise.all(
      Object.keys(templatesAssetMap).map(targetName => {
        const sourcePath = path.join(this.themePath, templatesAssetMap[targetName]);
        return fsExtra.copy(sourcePath, path.join(this.outputPath, targetName));
      })
    );
  }

  renderTemplate(key, data) {
    return ejs.render(this.getTemplate(key), data);
  }

  loadTemplates() {
    const templatesConfigMap = this.themeConfigure.TEMPLATE;
    this.templateContentMap = R.compose(
      R.reduce((result, key) => {
        result[key] = fs.readFileSync(path.join(this.themePath, templatesConfigMap[key]), 'utf-8');
        return result;
      }, {}),
      R.keys
    )(templatesConfigMap);
  }

  getThemeConfigure() {
    return this.themeConfigure;
  }

  getTemplate(key) {
    return this.templateContentMap[key];
  }

  getThemeTemplateRootPath() {
    return this.themeTemplateRootPath;
  }

  hasAllArticles() {
    return !!this.templates['allarticles'];
  }
}
