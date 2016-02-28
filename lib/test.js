var moore = require( './bm' );

var index = moore.indexOf(
    // the needle
    new Buffer( '操草' ),
    // the haystack
    new Buffer( 'HERE IS A SIMPLE EXAMPLE' )
);

console.log(index);
