'use strict';

let org = require('org');
let markdown = require('markdown').markdown;

let parser = new org.Parser();

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
// console.dir(orgHTMLDocument); // => { title, contentHTML, tocHTML, toc }
// console.log(orgHTMLDocument.toString()) // => Rendered HTML

export function parseMarkDown(mdCode) {
    return markdown.toHTML(mdCode);
}
