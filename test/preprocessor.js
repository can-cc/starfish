const tsc = require('typescript');
const tsConfig = require('../tsconfig.json');

module.exports = {
  process: function(src, path) {
    if (path.endsWith('.ts')) {
      return tsc.transpile(src, tsConfig.compilerOptions, path, []);
    }
    return src;
  }
};
