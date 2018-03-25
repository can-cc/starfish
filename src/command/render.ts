import * as ora from 'ora';
import { isDir, logCurrentTime } from '../lib/util';
import { RenderController } from '../modules/render/render-controller';

export default class RenderCommand {
  public name = 'render';
  public type = 'command';

  public async run(inputs: string[], flags: boolean[], blogConfigure: any) {
    const inputPath = inputs[0];
    if (!inputPath) {
      return console.error('Please spec blog path.');
    }

    if (isDir(inputPath)) {
      // TODO fix
      const outputPath = 'build';

      const spinner = ora('Start render...').start();
      try {
        const renderControl = new RenderController(inputPath, outputPath, blogConfigure);
        renderControl.render();
        spinner.succeed('Render completion...');
      } catch (error) {
        spinner.fail('Build Fail...');
      }
      logCurrentTime();
    }
  }
}
