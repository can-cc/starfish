import * as fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import * as shell from 'shelljs';

import { getParsersFromModules, makeDocumentParserFn } from './render-util';
import RenderThemer from './render-themer';
import { readConfigure } from '../../lib/loadConfig';

import Blog from '../../model/Blog';

import { RenderPluginManager } from './render-plugin';

export class RenderController {
  pluginType: string;
  inputPath: string;
  outputPath: string;
  configure: any;
  blogConfigure: any;
  renderPluginManager: any;
  renderThemer: any;
  parsers: any;

  constructor(inputPath, outputPath) {
    this.pluginType = 'render';
    this.inputPath = inputPath;
    this.outputPath = outputPath;

    this.configure = readConfigure(this.inputPath); // TODO rename
    this.blogConfigure = this.configure;

    this.renderThemer = new RenderThemer(inputPath, outputPath, this.configure);
    this.renderPluginManager = new RenderPluginManager({
      inputRootPath: inputPath,
      outputPath: outputPath,
      blogConfigure: this.configure
    });
    this.parsers = getParsersFromModules();
  }

  render() {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath);
    }

    const blog = new Blog(
      {
        inputPath: path.join(this.inputPath, this.configure.BLOG.BLOGDIR),
        outputPath: this.outputPath,
        parsers: this.parsers,
        blogConfigure: this.blogConfigure
      },
      this
    );

    blog.load();
    blog.render();

    this.renderPluginManager.runPluinAfterRender(blog);
    this.renderThemer.copyThemeAsset();
    this.copySpec();
  }

  copySpec() {
    const mapping = this.configure.MAPPING;
    R.keys(mapping).forEach(sourcePath => {
      const targetPath = mapping[sourcePath];
      shell.cp('-R', path.join(this.inputPath, sourcePath), path.join(this.outputPath, targetPath));
    });
  }

  getBlogInformation() {
    return {
      author: this.configure.AUTHOR.NAME,
      blogTitle: this.configure.BLOG.NAME,
      blogDesc: this.configure.BLOG.DESC,
      blogName: this.configure.BLOG.NAME,
    };
  }
}

export default RenderController;
