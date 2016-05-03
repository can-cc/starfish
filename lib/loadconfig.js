'use strict';

let yaml = require('js-yaml'),
    fs   = require('fs');

let loadConfig = (filepath) => {
    return yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));
};

export {loadConfig};
