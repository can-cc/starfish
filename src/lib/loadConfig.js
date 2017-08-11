import yaml from 'js-yaml';
import R from 'ramda';
import fs from 'fs';

import * as path from 'path';

let loadConfig = filepath => {
  return yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));
};

const readConfigure = inputPath => {
  const userConfigure = loadConfig(path.join(inputPath, 'config.yaml'));
  const defaultConfigure = loadConfig(
    path.join(__dirname, '../../config.default.yaml')
  );
  return R.merge(defaultConfigure, userConfigure);
};

export { loadConfig, readConfigure };
