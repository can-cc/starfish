import * as ora from 'ora';
import * as rimraf from 'rimraf';
import { isDir, logCurrentTime } from '../lib/util';
import { RenderController } from '../modules/render/render-controller';
import { Command } from './command';

export default class RenderCommand implements Command {
  public name = 'render';
  public type = 'command';

  public run(inputs: string[], flags: boolean[], blogConfigure: any) {
    const inputPath = inputs[0];
    if (!inputPath) {
      return console.error('Please spec blog path.');
    }

    if (isDir(inputPath)) {
      // TODO fix
      const outputPath = 'build';

      // TODO 做一个theme检查
      rimraf(outputPath, () => {
        const spinner = ora('Start render...').start();
        try {
          const renderControl = new RenderController(inputPath, outputPath, blogConfigure);
          renderControl.render();
          spinner.succeed('Render completion...');
        } catch (error) {
          console.error(error);
          spinner.fail('Build Fail...');
        }
        logCurrentTime();
      });
    }
  }
}
