// Game Variables
let scene, camera, renderer;
let player;
let obstacles = [];
let scenery = [];
let lanes = [-3, 0, 3]; // Left, Middle, Right lane x-coordinates
let currentLane = 1; // Middle lane
let gameSpeed = 0.5;
let isPlaying = false;
let score = 0;
let distance = 0;

// Player states
let isJumping = false;
let isSliding = false;
let jumpVelocity = 0;
let gravity = -0.015;
let playerY = 1; // Default Y

// DOM Elements
const startMenu = document.getElementById('start-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const hud = document.getElementById('hud');
const scoreVal = document.getElementById('score-val');
const finalScore = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

function init() {
    // 1. Setup Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 50, 150); // Fog to hide popping objects

    // 2. Setup Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 6, 10);
    camera.lookAt(0, 0, -10);

    // 3. Setup Renderer
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // 4. Lighting (Sunlight)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffee, 1.0);
    sunLight.position.set(-20, 50, 20);
    sunLight.castShadow = true;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    scene.add(sunLight);

    // 5. Environment (Village Road)
    createEnvironment();

    // 6. Player
    createPlayer();

    // 7. Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', handleKeyDown, false);
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    // Initial scenery
    for(let i=0; i<10; i++) spawnScenery(true);

    // Start Animation Loop
    animate();
}

function createEnvironment() {
    // Grass Ground
    const grassGeo = new THREE.PlaneGeometry(200, 400);
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x3b7a33 });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.z = -100;
    grass.receiveShadow = true;
    scene.add(grass);

    // Dirt Road
    const roadGeo = new THREE.PlaneGeometry(12, 400);
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -100;
    road.position.y = 0.01; // Slightly above grass
    road.receiveShadow = true;
    scene.add(road);
}

function spawnScenery(initial = false) {
    // Add trees on the sides
    const treeGroup = new THREE.Group();
    
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 3);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Leaves
    const leavesGeo = new THREE.SphereGeometry(2, 8, 8);
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 4;
    leaves.castShadow = true;
    treeGroup.add(leaves);

    // Random placement on sides
    let side = Math.random() > 0.5 ? 1 : -1;
    treeGroup.position.x = side * (8 + Math.random() * 10);
    treeGroup.position.z = initial ? (-Math.random() * 150) : -150;
    
    scene.add(treeGroup);
    scenery.push(treeGroup);
}

function createPlayer() {
    player = new THREE.Group();
    const catColor = 0xff8c00; // Orange cat

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
    const bodyMat = new THREE.MeshLambertMaterial({ color: catColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    player.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.7, 0.6, 0.7);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 0.9, -0.7);
    head.castShadow = true;
    player.add(head);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.15, 0.3, 4);
    const leftEar = new THREE.Mesh(earGeo, bodyMat);
    leftEar.position.set(-0.25, 1.3, -0.7);
    leftEar.rotation.y = Math.PI / 4;
    leftEar.castShadow = true;
    player.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, bodyMat);
    rightEar.position.set(0.25, 1.3, -0.7);
    rightEar.rotation.y = Math.PI / 4;
    rightEar.castShadow = true;
    player.add(rightEar);

    // Eyes and Nose
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.2, 1.0, -1.05);
    player.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.2, 1.0, -1.05);
    player.add(rightEye);

    const noseGeo = new THREE.BoxGeometry(0.1, 0.05, 0.1);
    const noseMat = new THREE.MeshBasicMaterial({ color: 0xff69b4 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.85, -1.06);
    player.add(nose);

    // Tail
    const tailGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 0.9, 0.6);
    tail.rotation.x = Math.PI / 4;
    tail.castShadow = true;
    player.add(tail);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.4, 0.2);
    const fLL = new THREE.Mesh(legGeo, bodyMat);
    fLL.position.set(-0.25, 0.2, -0.4);
    fLL.castShadow = true;
    player.add(fLL);

    const fRL = new THREE.Mesh(legGeo, bodyMat);
    fRL.position.set(0.25, 0.2, -0.4);
    fRL.castShadow = true;
    player.add(fRL);

    const bLL = new THREE.Mesh(legGeo, bodyMat);
    bLL.position.set(-0.25, 0.2, 0.4);
    bLL.castShadow = true;
    player.add(bLL);

    const bRL = new THREE.Mesh(legGeo, bodyMat);
    bRL.position.set(0.25, 0.2, 0.4);
    bRL.castShadow = true;
    player.add(bRL);

    player.userData.legs = [fLL, fRL, bLL, bRL];
    player.userData.tail = tail;

    playerY = 0; // Legs touch ground
    player.position.set(lanes[currentLane], playerY, 0);
    scene.add(player);
}

function spawnObstacle() {
    if (!isPlaying) return;

    const laneIndex = Math.floor(Math.random() * 3);
    const xPos = lanes[laneIndex];
    const type = Math.floor(Math.random() * 3);
    
    let obsGroup = new THREE.Group();
    
    if (type === 0) {
        // Rock (Block)
        const geo = new THREE.DodecahedronGeometry(1.2);
        const mat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 1;
        mesh.castShadow = true;
        obsGroup.add(mesh);
        obsGroup.userData.type = 'block';
    } else if (type === 1) {
        // Hole in the road (Jump over)
        // Visually represented as a dark patch
        const geo = new THREE.PlaneGeometry(3, 3);
        const mat = new THREE.MeshBasicMaterial({ color: 0x221100 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.02; // Just above road
        obsGroup.add(mesh);
        obsGroup.userData.type = 'hole';
    } else if (type === 2) {
        // Fallen tree (Slide under)
        const geo = new THREE.CylinderGeometry(0.6, 0.6, 3.5);
        const mat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.z = Math.PI / 2; // Horizontal
        mesh.position.y = 2.5; // High up so player can slide under
        mesh.castShadow = true;
        obsGroup.add(mesh);
        
        // Two stumps supporting it
        const stumpGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.5);
        const leftStump = new THREE.Mesh(stumpGeo, mat);
        leftStump.position.set(-1.5, 1.25, 0);
        leftStump.castShadow = true;
        
        const rightStump = new THREE.Mesh(stumpGeo, mat);
        rightStump.position.set(1.5, 1.25, 0);
        rightStump.castShadow = true;

        obsGroup.add(leftStump);
        obsGroup.add(rightStump);
        
        obsGroup.userData.type = 'high';
    }

    obsGroup.position.set(xPos, 0, -100);
    scene.add(obsGroup);
    obstacles.push({ mesh: obsGroup, type: type });
}

function handleKeyDown(event) {
    if (!isPlaying) return;

    switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
            if (currentLane > 0) currentLane--;
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (currentLane < 2) currentLane++;
            break;
        case 'ArrowUp':
        case 'KeyW':
            if (!isJumping && !isSliding) {
                isJumping = true;
                jumpVelocity = 0.4;
            }
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (!isJumping && !isSliding) {
                isSliding = true;
                player.scale.y = 0.5;
                player.position.y = playerY;
                setTimeout(() => {
                    isSliding = false;
                    player.scale.y = 1;
                    player.position.y = playerY;
                }, 800);
            }
            break;
    }
}

function updatePlayer() {
    player.position.x += (lanes[currentLane] - player.position.x) * 0.1;

    if (isJumping) {
        player.position.y += jumpVelocity;
        jumpVelocity += gravity;

        if (player.position.y <= playerY) {
            player.position.y = playerY;
            isJumping = false;
            jumpVelocity = 0;
        }
    }
}

function updateEnvironment() {
    // Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i].mesh;
        obs.position.z += gameSpeed;

        if (obs.position.z > -1.5 && obs.position.z < 1.5) {
            if (Math.abs(obs.position.x - player.position.x) < 1.0) {
                let hit = false;
                let obsType = obstacles[i].type;
                
                if (obsType === 0) { // Rock
                    if (player.position.y < 2) hit = true;
                } else if (obsType === 1) { // Hole
                    if (player.position.y < 1.5) hit = true; // Player must be jumping
                } else if (obsType === 2) { // Fallen Tree
                    if (!isSliding && player.position.y > 0.8) hit = true;
                }

                if (hit) {
                    gameOver();
                }
            }
        }

        if (obs.position.z > 10) {
            scene.remove(obs);
            obstacles.splice(i, 1);
        }
    }

    // Update Scenery Trees
    for (let i = scenery.length - 1; i >= 0; i--) {
        let tree = scenery[i];
        tree.position.z += gameSpeed;
        if (tree.position.z > 10) {
            scene.remove(tree);
            scenery.splice(i, 1);
        }
    }
}

function startGame() {
    startMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    hud.classList.remove('hidden');
    
    obstacles.forEach(obs => scene.remove(obs.mesh));
    obstacles = [];

    scenery.forEach(tree => scene.remove(tree));
    scenery = [];
    for(let i=0; i<10; i++) spawnScenery(true);

    currentLane = 1;
    player.position.set(lanes[currentLane], playerY, 0);
    player.scale.y = 1;
    isJumping = false;
    isSliding = false;
    
    score = 0;
    distance = 0;
    gameSpeed = 0.4; // Start slightly slower
    scoreVal.innerText = score;
    
    isPlaying = true;
}

function gameOver() {
    isPlaying = false;
    hud.classList.add('hidden');
    gameOverMenu.classList.remove('hidden');
    finalScore.innerText = Math.floor(score);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        updatePlayer();
        updateEnvironment();

        if (Math.random() < 0.03 + (gameSpeed * 0.04)) {
            // Dynamic gap: as speed increases, obstacles can spawn much closer together
            let minGap = Math.max(25, 80 - (gameSpeed * 40));
            if (obstacles.length === 0 || obstacles[obstacles.length - 1].mesh.position.z > -minGap) {
                spawnObstacle();
            }
        }

        if (Math.random() < 0.05 + (gameSpeed * 0.02)) {
            spawnScenery();
        }

        // Score increases slightly faster
        distance += gameSpeed * 1.5;
        score = Math.floor(distance / 10);
        scoreVal.innerText = score;

        // Speed increases more noticeably over time
        gameSpeed += 0.0002;
    }

    if (isPlaying && !isJumping && !isSliding) {
        const time = Date.now() * 0.015;
        player.position.y = playerY + Math.abs(Math.sin(time)) * 0.2;
        
        if (player.userData.legs) {
            player.userData.legs[0].rotation.x = Math.sin(time) * 0.6; // FL
            player.userData.legs[1].rotation.x = Math.sin(time + Math.PI) * 0.6; // FR
            player.userData.legs[2].rotation.x = Math.sin(time + Math.PI) * 0.6; // BL
            player.userData.legs[3].rotation.x = Math.sin(time) * 0.6; // BR
            player.userData.tail.rotation.x = Math.PI / 4 + Math.sin(time * 0.5) * 0.2;
        }
    } else if (player.userData.legs) {
        player.userData.legs.forEach(leg => leg.rotation.x = 0);
        player.userData.tail.rotation.x = Math.PI / 4;
    }

    renderer.render(scene, camera);
}

init();
