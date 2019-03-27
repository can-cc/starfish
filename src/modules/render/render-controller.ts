import * as fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import * as shell from 'shelljs';

import { RenderThemer } from './render-themer';
import { Blog } from '../../model/Blog';
import { RenderPluginManager } from './render-plugin';
import { Reader } from '../reader/Reader';
import { Writer } from '../writer/Writer';

export class RenderController {
  public renderPluginManager: RenderPluginManager;
  public renderThemer: RenderThemer;

  constructor(
    private rootInputPath: string,
    private rootOutputPath: string,
    private blogConfigure: BlogConfigure,
    public reader: Reader,
    public writer: Writer
  ) {
    this.renderThemer = new RenderThemer({
      inputPath: rootInputPath,
      outputPath: rootOutputPath,
      blogConfigure: this.blogConfigure
    });
    this.renderThemer.load();

    this.renderPluginManager = new RenderPluginManager(
      {
        rootInputPath,
        rootOutputPath,
        blogConfigure: this.blogConfigure
      },
      this
    );
  }

  public render(): void {
    this.insureOutputExist();

    const blog = new Blog(
      {
        blogInputPath: path.resolve(this.rootInputPath), // unix like is "/blog/category", Windows is "\blog\category"
        blogOutputPath: path.resolve(this.rootOutputPath),
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

  private insureOutputExist(): void {
    if (!fs.existsSync(this.rootOutputPath)) {
      fs.mkdirSync(this.rootOutputPath);
    }
  }

  public getBlogInformation() {
    return {
      author: this.blogConfigure.AUTHOR.NAME,
      blogTitle: this.blogConfigure.BLOG.NAME,
      blogDesc: this.blogConfigure.BLOG.DESC,
      blogName: this.blogConfigure.BLOG.NAME
    };
  }

  private copySpec() {
    const mapping = this.blogConfigure.MAPPING;
    R.keys(mapping).forEach(sourcePath => {
      const targetPath = mapping[sourcePath];
      shell.cp('-R', path.join(this.rootInputPath, sourcePath), path.join(this.rootOutputPath, targetPath));
    });
  }
}
