import * as yaml from 'js-yaml';
import * as R from 'ramda';
import * as fs from 'fs';

import * as path from 'path';

const loadConfig = filepath => {
  return yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));
};

class BlogConfigureLoader {
  private configure: BlogConfigure;

  constructor() {}

  read(inputPath: string) {
    const userConfigure = loadConfig(path.join(inputPath, 'config.yaml'));
    const defaultConfigure = loadConfig(path.join(__dirname, '../../config.default.yaml'));
    this.configure = R.merge(defaultConfigure, userConfigure);
  }

  getConfigure() {
    return this.configure;
  }
}

export { 
  loadConfig, 
  BlogConfigureLoader
};