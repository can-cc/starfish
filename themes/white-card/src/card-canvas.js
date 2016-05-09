'use strict';
window.addEventListener('load', function(){
    let canvas = document.getElementById('article-canvas'),
        ctx = canvas.getContext('2d');

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';

    canvas.height = canvas.parentElement.offsetHeight;
    canvas.width = canvas.parentElement.offsetWidth;

    let count = 75,
        rotation = 270 * (Math.PI / 180),
        speed = 6;

    let bigCardHeight = document.querySelector('.articles').offsetHeight,
        lastOffsetTop = canvas.parentElement.parentElement.offsetTop;
    
    let [centerX, centerY] = [canvas.width / 2, canvas.height / 2];

    let updateLoader = function(){
        rotation += speed / 100;									
    };

    let renderLoader = function(){							
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);	
        var i = count;
        while(i--){								
            ctx.beginPath();
            ctx.arc(0, 0, i + (Math.random() * 35), Math.random(), Math.PI / 3 + (Math.random() / 12), false);								
            ctx.stroke();
        }	
        ctx.restore();											
    };	

    let canvasLoop = function(){
        requestAnimationFrame(canvasLoop, canvas);			
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.fillRect(centerX - 125, centerY - 125, centerX + 125, centerY + 125);
        updateLoader();
        renderLoader();
    };
    
    canvasLoop();
});
