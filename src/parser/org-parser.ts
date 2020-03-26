import * as org from 'orgpr';
import { Parser } from './parser';

const parser = new org.Parser();

export default class OrgParser implements Parser {
  public name = 'org';

  public check(file: string): boolean {
    return /\.org$/.test(file);
  }

  public parse(orgCode: string) { 
    const orgDocument = parser.parse(orgCode);
    const orgHTMLDocument = orgDocument.convert(org.ConverterHTML, {
      headerOffset: 1,
      exportFromLineNumber: false,
      suppressSubScriptHandling: false,
      suppressAutoLink: false
    });
    return {
      title: orgHTMLDocument.title,
      content: orgHTMLDocument.tocHTML + orgHTMLDocument.contentHTML,
      date: orgHTMLDocument.date,
      type: this.name
    };
  }
}
