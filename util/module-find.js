'use strict';

let fs = require('fs');

export function getModule(reg) {
  fs.readdirSync(path.resolve(__dirname, '../node_modules'))
    .filter((moduleName) => {
      return /^nobbb-parse/.test(moduleName);
    })
    .forEach((moduleName) => {
      parsers[moduleName] = (new (require(moduleName).default)());
    });
}
