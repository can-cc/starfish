'use strict';

let makeBadTable = (pattern) => {
    let n = pattern.length;
    return pattern.split('').reduce((res, char, i) => {
        res[char] = n - i;
        return res;
    }, {});
};

let makeGoodSuffixTable = (pattern) => {
    
};

export class BoyerMooreCount {
    constructor(string, pattern) {
        let badRuleTable = makeBadTable(pattern),
            goodSuffixTable = makeGoodSuffixTable(pattern);
        
        console.log("goodSuffixTable = ", badRuleTable);
    }
}

new BoyerMooreCount('it\'s a example!', 'exalmple');


