const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let isPlaying = false;
let score = 0;
let animationId;
let frameCount = 0;

// Game Objects
let player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    speed: 6,
    dx: 0
};

let bullets = [];
let enemies = [];
let stars = [];

// Input
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

// Touch controls for mobile
let touchX = null;
let isTouching = false;
canvas.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    isTouching = true;
});
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
});
canvas.addEventListener('touchend', e => {
    isTouching = false;
    touchX = null;
    player.dx = 0;
});

function initStars() {
    stars = [];
    for(let i=0; i<100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 2 + 0.5
        });
    }
}

function drawStars() {
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed;
        if(star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

function drawPlayer() {
    ctx.save();
    // Translate to the center of the player
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // Rotate -45 degrees to make the standard 🚀 emoji point straight up
    ctx.rotate(-45 * Math.PI / 180);
    
    // Draw Custom Engine Flame (flickering/shaking) underneath
    if (isPlaying) {
        ctx.fillStyle = (Math.random() > 0.5) ? '#ff4b2b' : '#ffeb3b';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff416c';
        
        let flameHeight = 15 + Math.random() * 15; // Random height for flickering
        let shakeX = (Math.random() - 0.5) * 4; // Slight horizontal shake for the fire only
        
        ctx.beginPath();
        // Since canvas is rotated to make rocket point UP (-Y), the bottom is DOWN (+Y)
        ctx.moveTo(-6, 12); 
        ctx.lineTo(6, 12);
        ctx.lineTo(shakeX, 12 + flameHeight);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Draw the rocket perfectly still
    ctx.fillText("🚀", 0, 0);
    ctx.restore();
}

function fireBullet() {
    if(isPlaying) {
        bullets.push({
            x: player.x + player.width/2 - 2,
            y: player.y,
            width: 4,
            height: 15,
            speed: 8
        });
    }
}

let lastFireTime = 0;

function update() {
    if(!isPlaying) return;

    // Movement Keyboard
    if (keys['ArrowLeft'] || keys['KeyA']) player.dx = -player.speed;
    else if (keys['ArrowRight'] || keys['KeyD']) player.dx = player.speed;
    else if (!isTouching) player.dx = 0;

    // Movement Touch
    if (touchX !== null && isTouching) {
        // move towards touchX
        let center = player.x + player.width/2;
        if (Math.abs(center - touchX) > player.speed) {
            if (touchX < center) player.dx = -player.speed;
            else player.dx = player.speed;
        } else {
            player.dx = 0;
        }
    }

    player.x += player.dx;
    
    // Bounds
    if(player.x < 0) player.x = 0;
    if(player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Firing
    let now = Date.now();
    if((keys['Space'] || isTouching) && now - lastFireTime > 250) {
        fireBullet();
        lastFireTime = now;
    }

    // Bullets
    for(let i=bullets.length-1; i>=0; i--) {
        bullets[i].y -= bullets[i].speed;
        if(bullets[i].y < 0) bullets.splice(i, 1);
    }

    // Enemies (Spawn rate increases with score)
    let spawnRate = Math.max(15, 40 - Math.floor(score/50));
    if(frameCount % spawnRate === 0) {
        let size = 25 + Math.random() * 20;
        enemies.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: 2 + Math.random() * 2 + (score * 0.01),
            color: `hsl(${Math.random() * 360}, 80%, 60%)`
        });
    }

    for(let i=enemies.length-1; i>=0; i--) {
        enemies[i].y += enemies[i].speed;
        
        // Collision with player
        if (
            player.x < enemies[i].x + enemies[i].width &&
            player.x + player.width > enemies[i].x &&
            player.y < enemies[i].y + enemies[i].height &&
            player.y + player.height > enemies[i].y
        ) {
            gameOver();
        }

        // Out of bounds
        if(enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
            continue;
        }

        // Collision with bullets
        for(let j=bullets.length-1; j>=0; j--) {
            let b = bullets[j];
            let e = enemies[i];
            if(b && e && b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
                // Explosion effect (just remove for now)
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                scoreEl.innerText = score;
                break;
            }
        }
    }

    frameCount++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars();
    
    if(!isPlaying) {
        // Still draw player in background for start screen aesthetics
        drawPlayer();
        return;
    }

    drawPlayer();

    // Draw bullets
    ctx.fillStyle = '#f1c40f';
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
        // glowing effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f1c40f';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.shadowBlur = 0;
    });

    // Draw enemies (Alien shapes)
    enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        // Alien UFO shape
        ctx.ellipse(e.x + e.width/2, e.y + e.height/2, e.width/2, e.height/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.ellipse(e.x + e.width/2, e.y + e.height*0.3, e.width/3, e.height/4, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    resizeCanvas();
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 60;
    bullets = [];
    enemies = [];
    score = 0;
    frameCount = 0;
    scoreEl.innerText = score;
    isPlaying = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
}

function gameOver() {
    isPlaying = false;
    finalScoreEl.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

initStars();
drawStars(); // Draw once for the start screen
gameLoop();
