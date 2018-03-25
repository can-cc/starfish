import * as fs from 'fs';
import * as path from 'path';
import * as ora from 'ora';
import yaml from 'js-yaml';
import glob from 'glob';

import { readConfigure } from '../lib/loadConfig';

const TMPFILE = './temp.js';

export default class StarFishSSRCommand {
  public name = 'angular-ssr';
  public type = 'command';

  public run(inputs, flags, blogConfigure) {
    const inputPath = path.resolve(inputs[0]);
    if (!inputPath) {
      return console.error('Please spec blog path.');
    }

    const spinner = ora('Start angular ssr render...').start();

    try {
      const themePath = path.join(
        inputPath,
        blogConfigure.STYLE.THEMEDIR,
        blogConfigure.STYLE.THEME
      );
      const renderFn = require(path.join(themePath, 'ssr/ssr.js')).default;
      renderFn(inputPath);
      spinner.succeed('Angular ssr completion...');
    } catch (error) {
      console.error(error);
      spinner.fail('Render Fail...');
    }
  }
}
