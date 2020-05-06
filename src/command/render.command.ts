import ora from 'ora';
import rimraf from 'rimraf';
import { isDir } from '../lib/util';
import { RenderController } from '../modules/render/render-controller';
import { Command } from './command';
import printer from '../util/printer';
import { Reader } from '../modules/reader/Reader';
import { FSReader } from '../modules/reader/FSReader';
import { FSWriter } from '../modules/writer/FSWriter';
import { Writer } from '../modules/writer/Writer';

export default class RenderCommand implements Command {
  public name = 'render';
  public type = 'command';
  private spinner;

  public run(inputs: string[], flags: any[], blogConfigure: BlogConfigure): void {
    const inputPath = inputs[0];
    if (!inputPath) {
      return console.error('Please spec blog path.');
    }

    if (!isDir(inputPath)) {
      // TODO log it
      return;
    }

    const outputPath = flags['output'] || 'build';

    const startTime = new Date();

    this.cleanOutPutAssets(outputPath).then(() => {
      this.startSpin();

      try {
        const reader: Reader = new FSReader();
        const writer: Writer = new FSWriter();
        const renderControl = new RenderController(inputPath, outputPath, blogConfigure, reader, writer);
        renderControl.render();

        this.stopSpinSuccess();

        const endTime = new Date();
        const renderSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
        printer.log(`Rendering takes ${renderSeconds} seconds`);
      } catch (error) {
        console.log();
        console.error(error);
        this.stopSpinFail();
      }
    });
  }

  private startSpin() {
    this.spinner = ora('Start render...').start();
  }

  private stopSpinSuccess() {
    this.spinner.succeed('Render completion...');
  }

  private stopSpinFail() {
    this.spinner.fail('Build Fail...');
    process.exit(1)
  }

  private cleanOutPutAssets(outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      rimraf(outputPath, (error: Error) => {
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
  }
}
