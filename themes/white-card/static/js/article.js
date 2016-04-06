

(function(window, $){
    
    $('img').wrap('<div class="img-wrapper">');
    $('.img-wrapper').each(function(i, e){
        $(e).append('<span class="line"></span>');
    });
    
})(window, jQuery);
