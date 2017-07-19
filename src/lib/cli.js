import meow from 'meow';

import { filterDotFiles } from './util';
import * as path from 'path';

let R = require('fw-ramda');
let fs = require('fs');

let cli = meow({
  help: ['Usage:', 'wing <command>']
});

let needHelp = flags => {
  if (flags['h'] || flags['help']) {
    cli.help();
    process.exit();
  }
};

let showVersion = flags => {
  if (flags['v'] || flags['version']) {
    cli.version();
    process.exit();
  }
};

let makeCommand = commands => {
  // TODO: node_modules
  fs
    .readdirSync(path.resolve(__dirname, '../command'))
    .filter(name => {
      return filterDotFiles(name) && name !== 'command.js';
    })
    .forEach(name => {
      if (!commands[name]) {
        let command = new (require(path.resolve(__dirname, '../command', name)))
          .default();
        commands[command.getName()] = command;
      } else {
        throw new Error('duplicate command');
      }
    });

  return (inputs, flags) => {
    if (!commands[inputs[0]]) {
      return false;
    } else {
      commands[inputs[0]].run(R.drop(1, inputs), flags);
      return true;
    }
  };
};

cli.run = function() {
  let cmd = this.input[0] || '',
    flags = this.flags,
    isThere = !!(flags['t'] || flags['there']),
    outputPath = flags['output'];

  needHelp(flags);
  showVersion(flags);

  let runCommand = makeCommand({});

  // fixme
  switch (cmd) {
    case 'render':
      runCommand(this.input, this.flags);
      break;
    case 'serve':
      runCommand(this.input, this.flags);
      break;
    case 'init':
      break;
    case 'new':
      break;
    case 'deploy':
      break;
    case 'help':
      this.help();
      break;
    case 'version':
      cli.version();
      break;
    default:
      this.help();
  }
};

cli.help = () => {
  cli.showHelp();
};

export default cli;
