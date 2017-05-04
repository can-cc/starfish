import {server} from '../lib/server';
import {TickProcess} from '../lib/tickProcess';
import {loadConfig, readConfigure} from '../lib/loadConfig';
import {output, error, log} from '../lib/message';
import {isFile, isDir, logCurrentTime, injectGlobal, filterDotFiles} from '../lib/util';
import {renderFile, RenderController, renderDir, writeFile, joinPwd} from '../lib/render';
import ora from 'ora';

import fs from 'fs';
import path from 'path';

export default class RenderCommand {
  constructor() {
    this.name = 'render';
  }

  getName() {
    return this.name;
  }

  async run(inputs, flags) {
    const inputPath = inputs[0];
    if( isDir(inputPath) ) {
      let outputPath = outputPath || 'build';


      const spinner = ora('Start render...').start();
      const options = readConfigure(inputPath);
      const renderControl = new RenderController(inputPath, outputPath, options);
      await renderControl.render();

      spinner.succeed('Build success...');
      logCurrentTime();
      log('Render completion!');
    } else {
      error('Invalid input!');
    }
  }
}
