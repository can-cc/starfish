import {server} from '../lib/server';
import {TickProcess} from '../lib/tickProcess';
import {loadConfig, readConfigure} from '../lib/loadConfig';
import {output, error, log} from '../lib/message';
import {isFile, isDir, logCurrentTime, injectGlobal, filterDotFiles} from '../lib/util';
import {renderFile, RenderController, renderDir, writeFile, joinPwd} from '../lib/render';

import fs from 'fs';
import path from 'path';

export default class RenderCommand {
  constructor() {
    this.name = 'render';
  }

  getName() {
    return this.name;
  }
  
  run(inputs, flags) {
    const inputPath = inputs[0];
    if( isDir(inputPath) ) {
      let outputPath = outputPath || 'build';

      let tickProcess = new TickProcess();
      tickProcess.start();

      let options = readConfigure(inputPath);
      let renderControl = new RenderController(inputPath,
                                               outputPath,
                                               options);
      
      renderControl.render(() => {
        tickProcess.stop();
        logCurrentTime();
        log('Render completion!');
      });
    } else {
      error('Invalid input!');
    }
  }
}
