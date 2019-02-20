import * as ora from 'ora';
import * as rimraf from 'rimraf';
import { isDir, logCurrentTime } from '../lib/util';
import { RenderController } from '../modules/render/render-controller';
import { Command } from './command';

export default class InitCommand implements Command {
  public name = 'init';
  public type = 'command';

  public run(inputs: string[], flags: boolean[], blogConfigure: any) {}
}
