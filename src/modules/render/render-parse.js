const org = require('org');
const markdown = require('markdown').markdown;
import { getParsersFromModules, makeDocumentParserFn } from './render-util';

const parser = new org.Parser();

export function parseOrg(orgCode) {
  let orgDocument = parser.parse(orgCode);
  let orgHTMLDocument = orgDocument.convert(org.ConverterHTML, {
    headerOffset: 1,
    exportFromLineNumber: false,
    suppressSubScriptHandling: false,
    suppressAutoLink: false
  });
  return orgHTMLDocument;
}

export function parseMarkDown(mdCode) {
  return markdown.toHTML(mdCode);
}

export default class RenderParse {
  constructor() {
    this.parsers = getParsersFromModules();
    this.documentParserFn = makeDocumentParserFn(this.parsers);
  }
}
