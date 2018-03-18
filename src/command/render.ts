import { isDir, logCurrentTime } from '../lib/util';
import { RenderController } from '../modules/render/render-controller';
import * as ora from 'ora';

export default class RenderCommand {
  public name = 'render';

  public getName(): string {
    return this.name;
  }

  public async run(inputs: string[], flags: boolean[]) {
    const inputPath = inputs[0];
    if (!inputPath) {
      return console.error('Please spec blog path.')
    }

    if (isDir(inputPath)) {
      // TODO fix
      const outputPath = 'build';

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
    }
  }
}
