import {loadConfig} from './loadConfig';
import fs from 'fs';
import path from 'path';
import R from 'fw-ramda';
import {isFile, isDir, takeFileName, takeFileNameWithoutSuffix, getRelativePath, filterDotFiles, isSuffix, mergeForce} from './util';

const isYaml = R.curry(isSuffix)('yaml');

export class RenderManager {
  constructor(inputPath, outputRoot, configure) {
    this.inputPath = inputPath;
    this.outputPath = outputRoot;
    this.configure = configure;

    this.setup();
    this.load();
  }

  setup() {
    this.theme = this.configure.STYLE.THEME;
    this.themePath = path.join(this.getThemeDir(), this.theme);
  }

  loadLangData() {
    const lang = this.lang = this.configure.LANG || this.themeConfigure.LANG;
    const langFiles = fs.readdirSync(path.join(this.themePath, 'lang')).filter(filterDotFiles).filter(isYaml);

    if (langFiles.indexOf(lang + '.yaml') > 0) {
      this.langData = loadConfig(path.join(this.themePath, 'lang', lang + '.yaml'));
    } else {
      this.langData = loadConfig(path.join(this.themePath, 'lang', 'default.yaml'));
    }
  }

  loadTemplates() {
    const themeTemplateRootPath = this.themeTemplateRootPath = path.join(this.themePath, 'templates'); // TODO configure dir name ?
    this.templates = fs.readdirSync(themeTemplateRootPath)
      .filter(filterDotFiles)
      .filter(f => isFile(path.join(themeTemplateRootPath, f)))
      .reduce((templates, filePath) => {
        const key = takeFileNameWithoutSuffix(filePath);
        templates[key] = fs.readFileSync(path.join(themeTemplateRootPath, filePath), 'utf-8');
        return templates
      }, {});
  }

  load() {
    this.themeConfigure = loadConfig(path.join(this.themePath, this.configure.CONFIG.CONFIG_FILE));
    this.textData = this.themeConfigure.TEXT || {};
    this.linkData = this.themeConfigure.LINK || {};
    this.imgData = this.themeConfigure.IMG;

    this.loadLangData();
    this.loadTemplates();
  }

  getThemeDir() {
    return path.isAbsolute(this.configure.STYLE.THEMEDIR) ?
      this.configure.STYLE.THEMEDIR : path.resolve(this.inputPath, this.configure.STYLE.THEMEDIR);
  }

  getThemeConfigure() {
    return this.themeConfigure;
  }

  getTemplate(key) {
    return this.templates[key];
  }

  getThemeTemplateRootPath() {
    return this.themeTemplateRootPath;
  }

  hasAllArticles() {
    return !!this.templates['allarticles'];
  }

  mergeTemplateData(data) {
    return R.compose(R.merge({TEXT: this.textData}),
                R.merge({LINK: this.linkData}),
                R.merge({IMG: this.imgData}),
                R.merge({LANG: this.langData}))(data);
  }
}
