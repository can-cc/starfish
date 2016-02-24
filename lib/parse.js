'use strict';

let org = require('org');

let parser = new org.Parser();

export function parse(orgCode) {
    let orgDocument = parser.parse(orgCode);
    let orgHTMLDocument = orgDocument.convert(org.ConverterHTML, {
        headerOffset: 1,
        exportFromLineNumber: false,
        suppressSubScriptHandling: false,
        suppressAutoLink: false
    });
    return orgHTMLDocument;
}
// console.dir(orgHTMLDocument); // => { title, contentHTML, tocHTML, toc }
// console.log(orgHTMLDocument.toString()) // => Rendered HTML
