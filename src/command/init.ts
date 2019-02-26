import { Command } from './command';

export default class InitCommand implements Command {
  public name = 'init';
  public type = 'command';

  public run(inputs: string[], flags: boolean[], blogConfigure: any) {}
}
