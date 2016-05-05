'use strict';

let yaml = require('js-yaml'),
    fs   = require('fs');

import {DEFAULT_CONFIG_FILE} from '../config';

import * as path from 'path';

let loadConfig = (filepath) => {
    return yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));
};

let readConfigure = (inputPath) => {
    return loadConfig(path.join(inputPath, DEFAULT_CONFIG_FILE));
};

export {loadConfig, readConfigure};
