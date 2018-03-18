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
  configure: any;
  blogConfigure: any;
  renderPluginManager: any;
  renderThemer: any;
  parsers: any;

  constructor(private rootInputPath: string, private outputPath: string) {
    this.configure = readConfigure(rootInputPath); // TODO rename
    this.blogConfigure = this.configure;

    this.renderThemer = new RenderThemer(rootInputPath, outputPath, this.configure);
    this.renderPluginManager = new RenderPluginManager({
      inputRootPath: rootInputPath,
      outputPath: outputPath,
      blogConfigure: this.configure
    });
  }

  public render(): void {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath);
    }

    const blog = new Blog(
      {
      blogInputPath: path.join(this.rootInputPath, this.configure.BLOG.BLOGDIR),
      blogOutputPath: this.outputPath,
      parsers: this.parsers,
      blogConfigure: this.blogConfigure
    },
      this
    );

    blog.render();

    this.renderPluginManager.runPluinAfterRender(blog);
    this.renderThemer.copyThemeAsset();
    this.copySpec();
  }

  private copySpec() {
    const mapping = this.configure.MAPPING;
    R.keys(mapping).forEach(sourcePath => {
      const targetPath = mapping[sourcePath];
      shell.cp(
        '-R',
        path.join(this.rootInputPath, sourcePath),
        path.join(this.outputPath, targetPath)
      );
    });
  }

  getBlogInformation() {
    return {
      author: this.configure.AUTHOR.NAME,
      blogTitle: this.configure.BLOG.NAME,
      blogDesc: this.configure.BLOG.DESC,
      blogName: this.configure.BLOG.NAME
    };
  }
}