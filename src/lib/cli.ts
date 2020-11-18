import meow from 'meow';
import * as R from 'ramda';
import * as fs from 'fs';
import * as path from 'path';
import { filterDotFiles } from './util';
import { BlogConfigureLoader } from './BlogConfigureLoader';

const Package = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json')).toString());

const cli = meow({
  help: ['Usage:', 'starfish <command>']
});

function searchCommands() {
  const buildInCommands = fs
    .readdirSync(path.resolve(__dirname, '../command'))
    .filter(filterDotFiles)
    .filter(filename => {
      return /\.command.(js|ts)$/.test(filename);
    })
    .reduce((result, name) => {
      const module = new (require(path.resolve(__dirname, '../command', name))).default();
      result[module.name] = module;

      return result;
    }, {});

  return { ...buildInCommands };
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
  const rootInputPath: string = this.input[1];
  const blogConfigureLoader = new BlogConfigureLoader();
  blogConfigureLoader.read(rootInputPath);

  commandMap[this.input[0]].run(R.drop(1, this.input), this.flags, blogConfigureLoader.getConfigure());
};

export default cli;
