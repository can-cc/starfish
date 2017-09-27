import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import R from 'fw-ramda';
import ejs from 'ejs';

import shell from 'shelljs';

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
      fs.readFileSync(path.join(this.themePath, this.configure.STYLE.THEME_CONFIG_FILE), 'utf8')
    );
    this.loadTemplates();
  }

  async copyThemeAsset() {
    const templatesAssetMaps = this.themeConfigure.THEME_MAPPING;
    templatesAssetMaps.forEach(templatesAssetMap => {
      const targetName = R.keys(templatesAssetMap)[0];
      const sourceExpress = R.values(templatesAssetMap)[0];
      const targetPath = path.join(this.outputPath, targetName);
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
      }
      shell.cp('-R', path.join(this.themePath, sourceExpress), targetPath);
    });
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
