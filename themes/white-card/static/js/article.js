

(function(window, $){
    
    $('.article img').wrap('<div class="img-wrapper">');
    $('.img-wrapper').each(function(i, e){
        $(e).append('<span class="line"></span>');
    });
    
})(window, jQuery);


(function(window, $){

    var Particle = function(x, y, canvasHeight, canvasWidth, red, green, blue){
        this.targetX = x;
        this.targetY = y;

        this.color = 'rgba('+ red + ',' + green + ',' + blue + ', 1)';

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
        ctx.fillStyle = this.color;
        ctx.fillRect(this.targetX, this.targetY, 1, 1);  
    };

    Particle.prototype.update = function(ctx){
        //this.move();
        this.render(ctx);
    };
    
    var getCanvasData = function(canvas){
        var ctx = canvas.getContext('2d'),
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height),
        canvasHeight = canvas.height,
        canvasWidht = canvas.width;
        
        var particles = [];
        var flag = 0;
        for (var x = 0, ii = 0; x < imageData.width; x++) {
            flag = (flag + 1) % 2;

            for (var y = 0; y < imageData.height; y++) {
                var i = 4 * (y * imageData.width + x);
                if (imageData.data[i + 3] > 128) {
		    ii++;
                    (ii % 2 === flag) && particles.push(new Particle(x, y, canvasHeight, canvasWidht, imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]));
                }
            }
        }
        return particles;
    };

    
    var canvas = document.getElementById('dash-canvas'),
        ctx = canvas.getContext('2d');

    var dashBar = document.querySelector('.dash-bar');

    
    var winWidth = window.width,
        winHeight = window.height;
    
    var mainImg = document.getElementById('yin-img');


    canvas.width = dashBar.offsetWidth;
    canvas.height = dashBar.offsetHeight;
    
    
    ctx.drawImage(mainImg,
                  0, 0,
                  mainImg.width, mainImg.height,
                  canvas.width / 2 - mainImg.width / 2, 25,
                  mainImg.width, mainImg.height);


    var mainParticles = getCanvasData(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var txtImg = document.getElementById('wing-img');

    ctx.drawImage(txtImg,
                  0, 0,
                  txtImg.width, txtImg.height,
                  canvas.width / 1.2 , 100,
                  txtImg.width / 2, txtImg.height / 2);

    
    var txtParticles = getCanvasData(canvas);

    var tick = function(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        txtParticles.map(function(particle){
            particle.update(ctx);
        });
        mainParticles.map(function(particle){
            particle.update(ctx);
        });
    };

    var run = false;
    var raf = null;
    var start = function(){
        tick();
        //raf = requestAnimationFrame(start);
    };

    start();

  
    
    
    //ctx.drawImage(img, 50, 50, 100, 100, 100, 100);
    
    
})(window, jQuery);


(function(window, $){

    
    
})(window, jQuery);
