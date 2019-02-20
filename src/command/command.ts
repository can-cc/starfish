export interface Command {
  name: string;
  type: string;
  run(inputs: string[], flags: boolean[], blogConfigure: any): void;
}
