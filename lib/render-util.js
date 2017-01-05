'use strict';
import path from 'path';
import fsExtra from 'fs-extra';

export async function syncMappingDirs(needMapping, mappingRules, dirPath, outputPath) {
  needMapping.map(async (subDir) => {
    if (mappingRules[subDir]) {
      await fsExtra.copy(path.join(dirPath, subDir), path.join(outputPath, mappingRules[subDir]));
    }
  });
}
