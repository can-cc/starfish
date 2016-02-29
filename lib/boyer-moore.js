'use strict';

import * as _ from 'lodash';

let makeBadRule = (pattern) => {
    let n = pattern.length;
    return _.dropRight(pattern.split('')).reduce((res, char, i) => {
        res[char] = n - i;
        return res;
    }, {});
};

let makeGoodSuffixTable = (pattern) => {
    let n = pattern.length;

    let
};

export class BoyerMooreCount {
    constructor(string, pattern) {
        let badRule = makeBadRule(pattern),
            goodSuffixTable = makeGoodSuffixTable(pattern);
        
        console.log("goodSuffixTable = ", badRule);
    }
}

new BoyerMooreCount('it\'s a example!', 'exalmple');


