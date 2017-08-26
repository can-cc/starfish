import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import cheerio from 'cheerio';
import {
  isFile,
  isDir,
  takeFileName,
  takeFileNameWithoutSuffix,
  getRelativePath,
  filterDotFiles,
  isSuffix,
  mergeForce
} from '../../lib/util';

export async function syncMappingDirs(needMapping, mappingRules, dirPath, outputPath) {
  needMapping.map(async subDir => {
    if (mappingRules[subDir]) {
      await fsExtra.copy(path.join(dirPath, subDir), path.join(outputPath, mappingRules[subDir]));
    }
  });
}

// TODO
// cut content for index and category display
export function fixArticleUrlAndCut(content, relativeOutputPath, cutLimit) {
  // let text = htmlToText.fromString(content, {
  //     wordwrap: 130
  // });
  //return text.substring(0, ARTICLE_SUMMARY_CHAR_NUMBER);
  let $ = cheerio.load(content);

  var appendRelativeFn = function(i, e) {
    let src = $(this).attr('src');

    if (!/^[http|//]/.test(src)) {
      src = path.join('/', relativeOutputPath, src);
    }
    $(this).attr('src', src);
  };

  $('img').each(appendRelativeFn);
  $('script').each(appendRelativeFn);

  let ps = $('h1, h2, h3, h4, h5, h6, p'),
    summary = '';

  for (let i = 0, max = ps.length; i < max; i++) {
    summary += $(ps[i]).text();
    if (summary.length > cutLimit) {
      summary = summary.substring(0, cutLimit);
      break;
    } else if (i !== max - 1) {
      summary += '<br/>';
    }
  }
  return [$.html(), summary];
}

export function cutOffArticle(content, number) {
  const text = htmlToText.fromString(content, {
    wordwrap: number,
    ignoreImage: true,
    ignoreHref: true
  });
  return text.substring(0, number);
}

export function makeDocumentParserFn(parsers) {
  return (filePath, data) => {
    const fileName = takeFileName(filePath);
    for (const i in parsers) {
      if (parsers[i].check(fileName)) {
        const filenameWithoutSuffix = takeFileNameWithoutSuffix(filePath);
        const document = parsers[i].parse(data);
        return {
          fileName: fileName,
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
  return ['nobbb-parse-md', 'nobbb-parse-org'].map(
    moduleName => new (require(moduleName)).default()
  );
}
