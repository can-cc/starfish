

(function(window, $){
    
    $('.article img').wrap('<div class="img-wrapper">');
    $('.img-wrapper').each(function(i, e){
        $(e).append('<span class="line"></span>');
    });
    
})(window, jQuery);


(function(window, $){

    var mainPicX, mainPicY;

    var Particle = function(x, y, canvasHeight, canvasWidth, red, green, blue, 
                            xd, yd){
        this.originX = this.x = x;
        this.originY = this.y = y;
        
        this.color = 'rgba('+ red + ',' + green + ',' + blue + ', 1)';
        
        this.worldHeight = canvasHeight;
        this.worldWidht = canvasWidth;
        //this.gotoStart();    
        this.vx = 0;
        this.vy = 0;

        this.xd = xd;
        this.yd = yd;
        
        this.xfd = xd < 0;
        this.yfd = yd < 0;

        //this.vf = vf;

        // this.r = 0.92;

        this.reverseFlag = false;
    };

    Particle.prototype.reverse = function(){
        this.reverseFlag = true;
        this.vx = - this.vx;
        this.vy = - this.vy;
    };    

    Particle.prototype.move = function(){
        this.x += this.vx;
        this.y += this.vy;

        if( this.reverseFlag ){
            if( this.x > this.originX * this.xfd  ){
                this.x = this.originX;
                this.y = this.originY;
                this.reverseFlag = false;
                return;
            } 
        } else {
            
            var dx = this.x - this.originX,
                dy = this.y - this.originY;

            if( Math.pow(dx, 2) + Math.pow(dy, 2) > 1000000 ){ 
                this.reverse();
            }
        }
        
        this.vx *= 0.999;
        this.vy *= 0.999;
        
        
    };

    Particle.prototype.updateVecotr = function(base, xb, yb){
        if( !this.reverseFlag ){
            this.vx = this.xd * 0.05 * base;
            this.vy = this.yd * 0.05 * base;
        }

        
    };


    
    Particle.prototype.render = function(ctx){
        ctx.fillStyle = this.color;
        //ctx.fillRect(this.x, this.y, 4, 4);
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, 2 * Math.PI, false);
        ctx.fill();
    };
    
    Particle.prototype.update = function(ctx){
        this.move();
        this.render(ctx);
    };
    
    // var Radiation = function(x, y, canvasHeight, canvasWidth, red, green, blue){    
    // };
    
    var calcDis = function(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    };
    
    var getCanvasData = function(canvas, imageRadius){
        var ctx = canvas.getContext('2d'),
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height),
            canvasHeight = canvas.height,
            canvasWidht = canvas.width,
            halfCanvasHeight = canvas.height / 2,
            halfCanvasWidth = canvas.width / 2;
        
        var particles = [];
        var flag = 0;
        for (var x = 0, ii = 0; x < imageData.width; x++) {
            flag = (flag + 1) % 2;
            
            for (var y = 0; y < imageData.height; y++) {
                var i = 4 * (y * imageData.width + x);
                if (imageData.data[i + 3] > 128) {
		    ii++;
                    (ii % 5 === flag) && particles.push(
                        new Particle(x, y,
                                     canvasHeight, canvasWidht,
                                     imageData.data[i], imageData.data[i + 1], imageData.data[i + 2],
                                     // calcDis(x, y, halfCanvasWidth, halfCanvasHeight) / imageRadius,
                                     
                                     x - halfCanvasWidth,
                                     y - halfCanvasHeight)
                    );
                }
            }
        }
        return particles;
    };

    
    var canvas = document.getElementById('dash-canvas'),
        ctx = canvas.getContext('2d');
    
    var mouseX, mouseY;

    var dashBar = document.querySelector('.dash-bar');
    
    var mainImg = document.getElementById('foyin-img');
    
    canvas.width = dashBar.offsetWidth;
    canvas.height = dashBar.offsetHeight;
    
    ctx.drawImage(mainImg,
                  0, 0,
                  mainImg.width, mainImg.height,
                  canvas.width / 2 - mainImg.width / 2,
                  canvas.height / 2 - mainImg.height / 2,                  
                  mainImg.width, mainImg.height);

    var mainPicX1 = canvas.width / 2 - mainImg.width / 2,
        mainPicX2 = canvas.width / 2 + mainImg.width / 2,
        mainPicY1 = canvas.height / 2 - mainImg.height / 2,
        mainPicY2 = canvas.height / 2 + mainImg.height / 2;
    
    mainPicX = canvas.width / 2,
    mainPicY = canvas.height / 2;

    var mainParticles = getCanvasData(canvas, mainImg.width / 2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // var txtImg = document.getElementById('wing-img');

    // ctx.drawImage(txtImg,
    //               0, 0,
    //               txtImg.width, txtImg.height,
    //               canvas.width / 1.2, 100,
    //               txtImg.width / 2, txtImg.height / 2);

    
    //var txtParticles = getCanvasData(canvas);
    
    var run = false;

    var tick = function(dis){

        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // txtParticles.map(function(particle){
        //     particle.update(ctx);
        // });
        mainParticles.map(function(particle){
            particle.update(ctx);
        });
    };

    var addVector = function(mouseX, mouseY){

        var dis = Math.sqrt((mouseX - mainImg.width / 2) * (mouseX - mainImg.width / 2) +
                            (mouseY - mainImg.height / 2) * (mouseY - mainImg.height / 2));
        
        var base = (mainImg.width / 2 - dis) / mainImg.width;
        var xb = mainImg.width / 2 / Math.abs(mouseX - mainImg.width / 2),
            yb = mainImg.height / 2 / Math.abs(mouseY - mainImg.height / 2);
        
        mainParticles.map(function(particle){
            particle.updateVecotr(base);
        });
    };

    var x;
    var start = function(){
        if( x ){
            return;
        }
        x = true;
        run = true;
        frame();
        // if( mouseX < mainPicX2 && mouseX > mainPicX1 &&
        //     mouseY < mainPicY2 && mouseY > mainPicY1){
        //     requestAnimationFrame(start);
        // }
    };

    var frame = function(){
        if( !run ){
            return;
        }
        tick();
        requestAnimationFrame(frame);
    };
    
    var stop = function(){
        console.log('stop');
        run = false;
    };

    canvas.addEventListener('blur', function(){
        //stop();
    });
    
    window.addEventListener('blur', function(){
        //stop();
    });
    
    canvas.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if( mouseX < mainPicX2 && mouseX > mainPicX1 &&
            mouseY < mainPicY2 && mouseY > mainPicY1){
            start();
            addVector(mouseX, mouseY);
        }
    });

    start();
    //ctx.drawImage(img, 50, 50, 100, 100, 100, 100);
    
    
})(window, jQuery);


(function(window, $){

    
    
})(window, jQuery);
