import { error, log } from '../lib/message';
import { isDir, logCurrentTime } from '../lib/util';
import { RenderController } from '../modules/render/render';
import * as ora from 'ora';

export default class RenderCommand {
  name: string;
  constructor() {
    this.name = 'render';
  }

  getName() {
    return this.name;
  }

  async run(inputs, flags) {
    const inputPath = inputs[0];
    if (isDir(inputPath)) {
      // TODO fix
      let outputPath = 'build';

      const spinner = ora('Start render...').start();
      try {
        const renderControl = new RenderController(inputPath, outputPath);
        renderControl.render();
        spinner.succeed('Render completion...');
      } catch (error) {
        console.error(error);
        spinner.fail('Build Fail...');
      }
      logCurrentTime();
      log('Render completion!');
    } else {
      error('Invalid input!');
    }
  }
}
