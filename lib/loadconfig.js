'use strict';

let yaml = require('js-yaml'),
    R = require('fw-ramda'),
    fs   = require('fs');


import * as path from 'path';

let loadConfig = (filepath) => {
    return yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));
};

let readConfigure = (inputPath) => {
    let userConfigure = loadConfig(path.join(inputPath, 'config.yaml')),
        defaultConfigure = loadConfig(path.join(__dirname, '../config.default.yaml'));
    return R.merge(defaultConfigure, userConfigure);
};

export {loadConfig, readConfigure};
