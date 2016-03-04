'use strict';

import * as _ from 'lodash';

let isPrefix = (pattern, i, len) => {
    let start = 0;
    for(let j = i; j < len; ++start, ++j) {
        console.log('-');
        if( pattern[j] !== pattern[start] ){
            return false;
        }
    }
    return true;
};

let getSuffixLength = (pattern, i, len) => {
    let j = 0,
        start = i;
    for(let end = len - 1; start >= 0 && pattern[start] === pattern[end]; --start, --end) {
        j++;
    }
    return j;
};

let makeBadRule = (pattern) => {
    let n = pattern.length;
    return _.dropRight(pattern.split('')).reduce((res, char, i) => {
        res[char] = n - i;
        return res;
    }, {});
};

let makeGoodSuffixTable = (pattern) => {
    let len = pattern.length;
    console.log('len', len);
    
    let goodSuffixArray = new Array(len);

    let lastPrefixSuffixIndex = len;
    for(let j = len - 2; j >= 0; --j) {
        console.log(j);
        if( isPrefix(pattern, j + 1, len) ){
            console.log('s');
            lastPrefixSuffixIndex = j - (len - j);
        }
        goodSuffixArray[len - 1 - j] = lastPrefixSuffixIndex;
        console.log(goodSuffixArray[len - 1 - j]);
        console.log(lastPrefixSuffixIndex);
        console.log('-----');
    }

    for (let j = 0; j < len; ++j) {
        let suffixLength = getSuffixLength(pattern, j, len);
        goodSuffixArray[suffixLength] = len - j + suffixLength;
    }
    return goodSuffixArray;  
};

export class BoyerMooreCount {
    constructor(string, pattern) {
        let badRule = makeBadRule(pattern),
            goodSuffixTable = makeGoodSuffixTable(pattern);
        
        console.log("badRule = ", badRule);
        console.log("goodSuffixTable = ", goodSuffixTable);
    }
}

new BoyerMooreCount('it\'s a example!', 'example');


