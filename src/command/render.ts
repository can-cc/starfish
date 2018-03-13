import { isDir, logCurrentTime } from '../lib/util';
import { RenderController } from '../modules/render/render-controller';
import * as ora from 'ora';

export default class RenderCommand {
  name = 'render';

  constructor() {
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
      console.log('Render completion!');
    } else {
      console.log('Invalid input!');
    }
  }
}
