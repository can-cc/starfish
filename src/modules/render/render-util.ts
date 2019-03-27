import * as path from 'path';
import * as fsExtra from 'fs-extra';
import { takeFileName } from '../../lib/util';

export async function syncMappingDirs(needMapping, mappingRules, dirPath, outputPath) {
  needMapping.map(async subDir => {
    if (mappingRules[subDir]) {
      await fsExtra.copy(path.join(dirPath, subDir), path.join(outputPath, mappingRules[subDir]));
    }
  });
}

export function makeDocumentParserFn(parsers) {
  return (filePath, data) => {
    const fileName = takeFileName(filePath);
    for (const i in parsers) {
      if (parsers[i].check(fileName)) {
        // const filenameWithoutSuffix = takeFileNameWithoutSuffix(filePath);
        const document = parsers[i].parse(data);
        return {
          fileName,
          title: document.title,
          content: document.content,
          type: parsers[i].name
        };
      }
    }
    return null;
  };
}

export function getParsersFromModules() {
  return ['../../parser/md-parser', '../../parser/org-parser'].map(moduleName => new (require(moduleName)).default());
}
