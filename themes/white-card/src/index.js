'use strict';

//require('./radiation-header.js');


let $ = require('jquery');

require('./card-canvas');

$.single = (function(o){
    
    var collection = $([1]); // Fill with 1 item, to make sure length === 1
    
    return function(element) {
        
        // Give collection the element:
        collection[0] = element;
        
        // Return the collection:
        return collection;
        
    };
    
}());

let clicked = false;
$('.article-wrapper').on('click', function(){
    let e = $(this);
    if( clicked ){
        clicked = false;
        
        e.css('top', e.data('top')).css('overflow', 'hidden').css('z-index', 'auto').addClass('c').removeClass('active');
        
        $('.article-wrapper').map(function(){
            let ee = $(this);
            ee.css('top', ee.data('top'));

            setTimeout(function(){
                ee.removeClass('blur');
            }, 300);
        });
        
        setTimeout(function(){
            e.removeClass('c');
        }, 500);
    } else {
        clicked = true;
        $('.article-wrapper').css('top', '0.1rem');
        e.css('top', '0').css('overflow', 'scroll').css('z-index', '10').addClass('c').addClass('active');
        setTimeout(function(){
            e.removeClass('c');
            
            $('.article-wrapper').map(function(){
                let ee = $(this);
                if( ee[0] !== e[0] ){
                    ee.addClass('blur');
                }
            });
            
        }, 500);
    }
});
