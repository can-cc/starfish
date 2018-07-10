import * as org from 'orgpr';

const parser = new org.Parser();

export default class NobbbParseOrg {
  public name = 'org';

  public check(file) {
    return /\.org$/.test(file);
  }

  public parse(orgCode) {
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
      createdDate: null,
      type: this.name
    };
  }
}
