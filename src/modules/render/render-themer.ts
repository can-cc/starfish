import * as yaml from 'js-yaml';
import fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import * as ejs from 'ejs';
import * as shell from 'shelljs';

export class RenderThemer {
  public inputPath: string;
  public outputPath: string;
  public configure: BlogConfigure;
  public theme: string;
  public themePath: string;
  public templateContentMap: any;
  public themeConfigure: any;
  public themeTemplateRootPath: string;
  public templates: string;

  private loaded = false;

  constructor({ inputPath, outputPath, blogConfigure }) {
    this.inputPath = inputPath;
    this.outputPath = outputPath;
    this.configure = blogConfigure;

    this.theme = this.configure.STYLE.THEME;
  }

  public load() {
    this.loaded = true;
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

  private checkLoad() {
    if (!this.loaded) {
      throw new Error('RenderThemer not load.');
    }
  }

  public copyThemeAsset() {
    this.checkLoad();

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

  public renderTemplate(key: string, data: any): string {
    this.checkLoad();

    return ejs.render(this.getTemplate(key), data);
  }

  private loadTemplates() {
    try {
      const templatesConfigMap = this.themeConfigure.TEMPLATE;
      this.templateContentMap = R.compose(
        R.reduce((result, key) => {
          result[key] = fs.readFileSync(path.join(this.themePath, templatesConfigMap[key]), 'utf-8');
          return result;
        }, {}),
        R.keys
      )(templatesConfigMap);
    } catch (error) {
      console.error('Can not load theme file');
      throw error;
    }
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
