import meow from 'meow';
import R from 'ramda';
import fs from 'fs';
import path from 'path';
import { filterDotFiles } from './util';
import Package from '../../package.json';


const cli = meow({
  help: ['Usage:', 'starfish <command>']
});

function searchCommands() {
  const buildInCommands = fs
    .readdirSync(path.resolve(__dirname, '../command'))
    .filter(filterDotFiles)
    .reduce((result, name) => {
      const module = new (require(path.resolve(__dirname, '../command', name))).default();
      result[module.getName()] = module;

      return result;
    }, {});

  const nodeModuleCommands = ['starfish-command-ssr']
    .filter(name => /^starfish-command/.test(name))
    .reduce((result, name) => {
      const module = new (require(name)).default();
      result[module.getName()] = module;
      return result;
    }, {});
  return { ...buildInCommands, ...nodeModuleCommands };
}

function showVersion() {
  console.log(Package.name, Package.version);
}

cli.run = function() {
  if (this.flags.v) {
    return showVersion();
  }

  const commandMap = searchCommands();
  if (!commandMap[this.input[0]]) {
    return this.showHelp();
  }
  commandMap[this.input[0]].run(R.drop(1, this.input), this.flags);

  // if (!runCommand(this.input, this.flags)) {
  //   this.showHelp();
  // }
};

export default cli;
