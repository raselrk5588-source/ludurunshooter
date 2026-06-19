const players = ['green', 'yellow', 'blue', 'red'];
const playerNames = { 'green': 'সবুজ', 'yellow': 'হলুদ', 'blue': 'নীল', 'red': 'লাল' };

let currentPlayerIndex = 0;
let gameState = 'waiting_for_roll'; // waiting_for_roll, rolling, waiting_for_move, moving

const tokenPositions = {
    'green': [-1, -1, -1, -1],
    'yellow': [-1, -1, -1, -1],
    'blue': [-1, -1, -1, -1],
    'red': [-1, -1, -1, -1]
};

const homePositions = {
    'green': [ [13.3, 13.3], [26.6, 13.3], [13.3, 26.6], [26.6, 26.6] ],
    'yellow': [ [73.3, 13.3], [86.6, 13.3], [73.3, 26.6], [86.6, 26.6] ],
    'blue': [ [73.3, 73.3], [86.6, 73.3], [73.3, 86.6], [86.6, 86.6] ],
    'red': [ [13.3, 73.3], [26.6, 73.3], [13.3, 86.6], [26.6, 86.6] ]
};

const globalPath = [
    [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], // left arm
    [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], // top up
    [7, 0], [8, 0], // top right
    [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], // top down
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], // right arm
    [14, 7], [14, 8], // right down
    [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], // right left
    [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], // bottom down
    [7, 14], [6, 14], // bottom left
    [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], // bottom up
    [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], // left arm
    [0, 7], [0, 6] // left up
];

const playerPathMap = {
    'green': { startIdx: 0, homeStretch: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [7, 7]] },
    'yellow': { startIdx: 13, homeStretch: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 7]] },
    'blue': { startIdx: 26, homeStretch: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [7, 7]] },
    'red': { startIdx: 39, homeStretch: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 7]] }
};

const safeCells = [
    [1, 6], [6, 2], [8, 1], [12, 6], [13, 8], [8, 12], [6, 13], [2, 8]
];

function isSafeZone(c, r) {
    return safeCells.some(cell => cell[0] === c && cell[1] === r);
}

function getPos(c, r) {
    return [(c + 0.5) * (100 / 15), (r + 0.5) * (100 / 15)];
}

function getCell(color, pos) {
    if (pos >= 0 && pos <= 50) return globalPath[(playerPathMap[color].startIdx + pos) % 52];
    if (pos >= 51 && pos <= 56) return playerPathMap[color].homeStretch[pos - 51];
    return null;
}

const board = document.getElementById('ludo-board');
const rollBtns = {
    'green': document.getElementById('panel-green'),
    'yellow': document.getElementById('panel-yellow'),
    'blue': document.getElementById('panel-blue'),
    'red': document.getElementById('panel-red')
};
const dice3D = {
    'green': document.getElementById('dice-green'),
    'yellow': document.getElementById('dice-yellow'),
    'blue': document.getElementById('dice-blue'),
    'red': document.getElementById('dice-red')
};
const diceRotations = { 'green': {x:0, y:0}, 'yellow': {x:0, y:0}, 'blue': {x:0, y:0}, 'red': {x:0, y:0} };

// ----------------- ANIMATION HELPERS -----------------
function showFloatingEmoji(emoji, x, y) {
    let el = document.createElement('div');
    el.innerText = emoji;
    el.className = 'floating-emoji';
    el.style.left = x + '%';
    el.style.top = y + '%';
    board.appendChild(el);
    setTimeout(() => el.remove(), 2000);
}

function showWinScreen(color) {
    let el = document.createElement('div');
    el.className = 'win-overlay';
    
    let colorHex = color === 'yellow' ? '#fbd109' : (color === 'green' ? '#30a241' : (color === 'red' ? '#e82121' : '#2c51b6'));
    
    el.innerHTML = `
        <div class="trophy">🏆</div>
        <h1 style="color: ${colorHex}">${playerNames[color]} প্রথম হয়েছে!</h1>
        <p>অভিনন্দন! 🎉</p>
        <button onclick="location.reload()" style="margin-top:20px; padding: 15px 30px; font-size:20px; cursor:pointer; border-radius:10px; border:none; background:#fff; color:#000; font-weight:bold; font-family: 'Hind Siliguri', sans-serif;">আবার খেলুন</button>
    `;
    document.body.appendChild(el);
    
    // Confetti generator
    for(let i=0; i<80; i++) {
        let conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.animationDuration = (Math.random() * 2 + 2) + 's';
        conf.style.animationDelay = (Math.random() * 2) + 's';
        conf.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        document.body.appendChild(conf);
    }
}
// -----------------------------------------------------

function createTokens() {
    players.forEach(color => {
        homePositions[color].forEach((pos, i) => {
            let token = document.createElement('div');
            token.className = `token ${color}`;
            token.id = `${color}-${i}`;
            board.appendChild(token);
        });
    });
    updateAllTokenPositions();
}

function updateAllTokenPositions() {
    let cellCounts = {};
    let tokenMeta = [];
    
    players.forEach(color => {
        tokenPositions[color].forEach((pos, i) => {
            if (pos === 56) {
                tokenMeta.push({color, i, pos: [-100, -100], scale: 1}); // Hide finished
                return;
            }
            if (pos === -1) {
                tokenMeta.push({color, i, pos: homePositions[color][i], scale: 1});
            } else {
                let cell = getCell(color, pos);
                let key = `${cell[0]},${cell[1]}`;
                if (!cellCounts[key]) cellCounts[key] = [];
                cellCounts[key].push({color, i});
            }
        });
    });

    for (let key in cellCounts) {
        let list = cellCounts[key];
        let [c, r] = key.split(',').map(Number);
        let baseCoords = getPos(c, r);
        
        if (list.length === 1) {
            tokenMeta.push({color: list[0].color, i: list[0].i, pos: baseCoords, scale: 1});
        } else {
            list.forEach((t, idx) => {
                let offsetX = idx % 2 === 0 ? -1.5 : 1.5;
                let offsetY = idx < 2 ? -1.5 : 1.5;
                tokenMeta.push({
                    color: t.color, i: t.i, 
                    pos: [baseCoords[0] + offsetX, baseCoords[1] + offsetY], 
                    scale: 0.8
                });
            });
        }
    }

    tokenMeta.forEach(meta => {
        let el = document.getElementById(`${meta.color}-${meta.i}`);
        if (meta.pos[0] === -100) {
            el.style.display = 'none';
        } else {
            el.style.display = 'block';
            el.style.left = meta.pos[0] + '%';
            el.style.top = meta.pos[1] + '%';
            el.style.transform = `translate(-50%, -50%) scale(${meta.scale})`;
        }
    });
}

function updateTurnVisuals() {
    gameState = 'waiting_for_roll';
    players.forEach(color => {
        if(color === players[currentPlayerIndex]) {
            rollBtns[color].classList.remove('disabled');
            rollBtns[color].classList.add('active');
        } else {
            rollBtns[color].classList.add('disabled');
            rollBtns[color].classList.remove('active', 'has-result');
        }
    });
}

function switchTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updateTurnVisuals();
}

function evaluateValidMoves(color, diceValue) {
    let validMoves = [];
    tokenPositions[color].forEach((pos, i) => {
        if (pos === -1) {
            if (diceValue === 6) validMoves.push(i);
        } else if (pos >= 0) {
            if (pos + diceValue <= 56) validMoves.push(i);
        }
    });
    return validMoves;
}

function setupTokenClicks(color, validMoves, diceValue) {
    gameState = 'waiting_for_move';
    validMoves.forEach(i => {
        let el = document.getElementById(`${color}-${i}`);
        el.classList.add('clickable');
        el.onclick = () => moveToken(color, i, diceValue);
    });
}

function moveToken(color, i, diceValue) {
    gameState = 'moving';
    document.querySelectorAll('.token').forEach(t => {
        t.classList.remove('clickable');
        t.onclick = null;
    });

    let currentPos = tokenPositions[color][i];
    let targetPos = currentPos === -1 ? 0 : currentPos + diceValue;
    let currentStep = currentPos;
    
    let interval = setInterval(() => {
        if (currentStep === -1) currentStep = 0;
        else currentStep++;
        
        tokenPositions[color][i] = currentStep;
        updateAllTokenPositions();
        
        if (currentStep === targetPos) {
            clearInterval(interval);
            handleMoveEnd(color, i, diceValue);
        }
    }, 250);
}

function handleMoveEnd(color, i, diceValue) {
    let finalPos = tokenPositions[color][i];
    let extraTurn = false;
    let captured = false;
    let finalCoords = [-1, -1];
    
    if (finalPos === 56) {
        extraTurn = true;
        // Animation for reaching home
        showFloatingEmoji('⭐', 50, 50);
    } else {
        let finalCell = getCell(color, finalPos);
        finalCoords = getPos(finalCell[0], finalCell[1]);
        
        if (!isSafeZone(finalCell[0], finalCell[1])) {
            players.forEach(oppColor => {
                if (oppColor !== color) {
                    tokenPositions[oppColor].forEach((oppPos, oppI) => {
                        if (oppPos >= 0 && oppPos <= 50) {
                            let oppCell = getCell(oppColor, oppPos);
                            if (oppCell[0] === finalCell[0] && oppCell[1] === finalCell[1]) {
                                tokenPositions[oppColor][oppI] = -1; // Captured!
                                captured = true;
                            }
                        }
                    });
                }
            });
        }
    }

    if (captured) {
        updateAllTokenPositions();
        extraTurn = true;
        // Animation for sad face
        showFloatingEmoji('😭', finalCoords[0], finalCoords[1]);
    }
    
    if (diceValue === 6) extraTurn = true;

    if (tokenPositions[color].every(p => p === 56)) {
        // Winning animation
        showWinScreen(color);
        return; // Game over for this player
    }

    if (extraTurn) {
        updateTurnVisuals(); // stay on current player
        rollBtns[color].classList.remove('has-result'); // Hide previous result, show blank dice
    } else {
        switchTurn();
    }
}

function getDiceRotation(value, color) {
    let extraX = (Math.floor(Math.random() * 3) + 2) * 360;
    let extraY = (Math.floor(Math.random() * 3) + 2) * 360;
    let rotX = Math.floor(diceRotations[color].x / 360) * 360 + extraX;
    let rotY = Math.floor(diceRotations[color].y / 360) * 360 + extraY;

    switch(value) {
        case 1: break; case 6: rotX += 180; break;
        case 3: rotY -= 90; break; case 4: rotY += 90; break;
        case 2: rotX -= 90; break; case 5: rotX += 90; break;
    }
    diceRotations[color].x = rotX; diceRotations[color].y = rotY;
    return `translateZ(-30px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
}

function rollDice(color) {
    if (color !== players[currentPlayerIndex] || gameState !== 'waiting_for_roll') return;

    gameState = 'rolling';
    rollBtns[color].classList.add('rolling', 'has-result');
    
    // Increased probability for rolling a 6
    let allInBase = tokenPositions[color].every(pos => pos === -1);
    let chanceForSix = allInBase ? 0.35 : 0.20; // 35% chance if all tokens are stuck in base
    
    let diceValue;
    if (Math.random() < chanceForSix) {
        diceValue = 6;
    } else {
        diceValue = Math.floor(Math.random() * 5) + 1;
    }

    dice3D[color].style.transform = getDiceRotation(diceValue, color);

    setTimeout(() => {
        rollBtns[color].classList.remove('rolling');
        let validMoves = evaluateValidMoves(color, diceValue);
        
        if (validMoves.length === 0) {
            setTimeout(switchTurn, 1000);
        } else {
            setupTokenClicks(color, validMoves, diceValue);
        }
    }, 1200); // matches CSS animation duration
}

players.forEach(color => {
    rollBtns[color].addEventListener('click', () => rollDice(color));
});

createTokens();
updateTurnVisuals();
dice3D['green'].style.transform = 'translateZ(-30px) rotateX(0deg) rotateY(0deg)';
