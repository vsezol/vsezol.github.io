var cvs = document.getElementById("canvas");
var ctx = cvs.getContext("2d");

var bird = new Image();
var bg = new Image();
var fg = new Image();
var pipeUp = new Image();
var pipeBottom = new Image();

bird.src = "img/Zahar.png";
bg.src = "img/stena.png";
fg.src = "img/pol.png";
pipeUp.src = "img/Vanyab.png";
pipeBottom.src = "img/Vanya.png";

var gap = 150;

//при нажатии на какую-либо кнопку
document.addEventListener("keydown", moveUp);

var fly = new Audio();
var score_audio = new Audio();

fly.src = "fly.mp3";
score_audio.src = "score.mp3";

function moveUp(){
    yPos -= 30;
    fly.play();
}

// создание блоков

var pipe = [];

pipe[0] = {
    x : cvs.width,
    y : 0
};

// позиция птички
var xPos = 10;
var yPos = 150;
var grav = 2;
var b = 1;
var score = 0;



function draw(){

    ctx.drawImage(bg, 0, 0);

    for(var i = 0; i < pipe.length; i++) {
        ctx.drawImage(pipeUp, pipe[i].x, pipe[i].y);
        ctx.drawImage(pipeBottom, pipe[i].x, pipe[i].y + pipeUp.height + gap);
       
        pipe[i].x -= b;
        if (pipe[i].x == 125){
            pipe.push({
                x: cvs.width,
                y: Math.floor(Math.random() * pipeUp.height) - pipeUp.height
            });
        }

        if(xPos + bird.width >= pipe[i].x
            && xPos <= pipe[i].x + pipeUp.width
            && (yPos <= pipe[i].y + pipeUp.height
                || yPos + bird.height >= pipe[i].y
                 + pipeUp.height + gap) || yPos + bird.height >= cvs.height - fg.height){
                    score_audio.play();
                    alert("Ты проиграл, твой счет " + score);
                    location.reload();
                }
            
        if(pipe[i].x == 5){
            score++;
        }
    }

    ctx.drawImage(fg, 0, cvs.height - fg.height);
    ctx.drawImage(bird, xPos, yPos);

    yPos += grav;

    ctx.fillStyle = "black";
    ctx.font = "24px Verdana";
    ctx.fillText("Счет: " + score, 10, 30);

    requestAnimationFrame(draw);
}
pipeBottom.onload = draw;