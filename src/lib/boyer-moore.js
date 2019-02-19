let isPrefix = (pattern, i, len) => {
    let start = 0;
    for(let j = i; j < len; ++start, ++j) {
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
    let n = pattern.length,
        rule = new Array(n - 1);
    for (let i = 0; i < n - 1; ++i) {
        rule[i] = {};
        for (let j = 0; j < n - i - 1; ++j) {
            rule[i][pattern[j]] = n - i - j - 1;
        }
    }
    return rule;
};

let makeGoodSuffixTable = (pattern) => {
    let len = pattern.length,
        goodSuffixArray = new Array(len),
        lastPrefixSuffixIndex = len;
    
    for(let j = len - 2; j >= 0; --j) {
        if( isPrefix(pattern, j + 1, len) ){
            lastPrefixSuffixIndex = len - (len - j - 1);

        }
        goodSuffixArray[len - j - 1] = lastPrefixSuffixIndex;
    }
    for (let j = 0; j < len - 1; ++j) {
        let suffixLength = getSuffixLength(pattern, j, len);
        for (let k = suffixLength; k > 0; --k) {
            goodSuffixArray[k] = len - suffixLength + 1 - j;
        }
    }
    return goodSuffixArray;
};

export class BoyerMooreCount {
    constructor(pattern) {
        this.badRule = makeBadRule(pattern),
        this.goodSuffixTable = makeGoodSuffixTable(pattern);
        this.pattern = pattern;
    }

    indexFor(string) {
        let n = this.pattern.length;
        for(let i = n - 1, max = string.length; i < max;) {
            let k = n - 1;
            for (; this.pattern[k] === string[i]; --i, --k) {
                if( k === 0 ){
                    return i;
                }
            }
            let bad = this.badRule[n - k - 1][string[i]] || n;
            let good = this.goodSuffixTable[n - k - 1] || 1;
            i += Math.max(bad, good);
        }
        return -1;
    }
}




