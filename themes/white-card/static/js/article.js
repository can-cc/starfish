

(function(window, $){
    
    $('.article img').wrap('<div class="img-wrapper">');
    $('.img-wrapper').each(function(i, e){
        $(e).append('<span class="line"></span>');
    });
    
})(window, jQuery);


(function(window, $){

    var Particle = function(x, y, canvasHeight, canvasWidth){
        this.targetX = x;
        this.targetY = y;

        this.worldHeight = canvasHeight;
        this.worldWidht = canvasWidth;
        
        this.gotoStart();

        this.vx = 5 + Math.random() * 4;
        this.vy = Math.random() * 4 - 2;
    };

    Particle.prototype.gotoStart = function(){
        this.x = this.targetX - this.worldWidht / 2 + Math.random() * 30;
        this.y = this.worldHeight / 2 + Math.random() * 8 - 4;
    };

    Particle.prototype.move = function(){
        if( this.x < this.targetX ){
            this.x +=this.vx;
            this.y += this.vy;

            if( this.y > this.worldHeight / 2 + 40  ){
                this.y = this.worldHeight / 2 + 40;
                this.vy = - this.vy;
            }

            if ( this.y < this.worldHeight / 2 - 40) {
                this.y = this.worldHeight / 2 - 40;
                this.vy = - this.vy;
            }

        } else {
            this.x = this.targetX;
            this.y = this.targetY;
        }  
    };

    Particle.prototype.render = function(ctx){
        ctx.fillStyle = '#111';
        ctx.fillRect(this.x, this.y, 2, 2);  
    };

    Particle.prototype.update = function(ctx){
        this.move();
        this.render(ctx);
    };
    
    var getCanvasData = (canvas) => {
        var ctx = canvas.getContext('2d'),
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height),
        canvasHeight = canvas.height,
        canvasWidht = canvas.width;
        
        var particles = [];
        for (var x = 0, ii = 0; x < imageData.width; x++) {
            for (var y = 0; y < imageData.height; y++) {
                var i = 4 * (y * imageData.width + x);
                if (imageData.data[i + 3] > 128) {
		    ii++;
                    (ii % 4 === 0) && particles.push(new Particle(x, y, canvasHeight, canvasWidht));
                }
            }
        }
        return particles;
    };

    
    var canvas = document.getElementById('dash-canvas'),
       ctx = canvas.getContext('2d');

    var img = document.getElementById('yin-img');
    
    ctx.drawImage(img, 0, 0, 150, 150);
    
    
})(window, jQuery);


(function(window, $){

    
    
})(window, jQuery);
