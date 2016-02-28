'use strict';

import {INDEX_ARTICLE_NUMBER, ARTICLE_SUMMARY_CHAR_NUMBER} from '../config.js';
import {getRelativePath} from './util';

export class PickUp {
    constructor(outputRoot) {
        this.outputRoot = outputRoot;
    }

    addArticle(outputFilePath, article) {
        let relativePath = getRelativePath(this.outputRoot, outputFilePath);
        
        
    }

    cutOffArticle(content) {
        return content.substring(0, ARTICLE_SUMMARY_CHAR_NUMBER);
    }

    searchKeyWord() {
        
    }

    toHtml() {
        
    }
}
