let gameState = {
    score: 0,
    level: 1,
    timeLeft: 30,
    isPlaying: false,
    focusLevel: 100,
    objects: [],
    gameTimer: null,
    spawnTimer: null,
    moveTimer: null,
    doubleScore: false,
    doubleScoreTimeout: null
};

const gameArea = document.getElementById('gameArea');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const timeElement = document.getElementById('time');
const focusFill = document.getElementById('focusFill');
const feedback = document.getElementById('feedback');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const encouragementMessage = document.getElementById('encouragementMessage');
const levelUpBanner = document.getElementById('levelUpBanner');

let audioContext;

const funDistractorShapes = [
    '💀', '👾', '😜', '🎃', '🐸', '🍕', '🦄', '👻', '🤖', '🧸', '🥸', '🥶', '🍄', '🐙', '🎩',
    '👽', '🦖', '👹', '🦉', '🧙‍♂️', '🦑', '🐵', '🦋', '🍔', '🥕'
].filter(emoji => !emoji.includes('⭐') && !emoji.includes('🌟') && !emoji.includes('✴️') && !emoji.includes('✨'));

// ----- POWER-UPS -----
const powerUpTypes = [
    { emoji: '💎', effect: 'focus', message: 'Focus Restored! +30', color: '#56e39f' },
    { emoji: '⚡', effect: 'double', message: 'Double Score!', color: '#ffd600' },
    { emoji: '🕒', effect: 'time', message: 'More Time! +10s', color: '#90caf9' }
];

// ----- AUDIO -----
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playWhistle() {
    initAudio();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const frequency = 800 + Math.random() * 400;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// ----- GAME FLOW -----
function startGame() {
    gameState.isPlaying = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameState.score = 0;
    gameState.level = 1;
    gameState.timeLeft = 30;
    gameState.focusLevel = 100;
    gameState.objects = [];
    gameState.doubleScore = false;
    updateDisplay();

    if (gameState.gameTimer) clearInterval(gameState.gameTimer);
    if (gameState.moveTimer) clearInterval(gameState.moveTimer);

    gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;
        updateDisplay();
        if (gameState.timeLeft <= 0) {
            nextLevelOrEnd();
        }
    }, 1000);

    spawnObjects();
    startMovingObjects(); // Start motion engine, will only move objects if level is high enough
}

function nextLevelOrEnd() {
    if (gameState.focusLevel <= 0) {
        endGame();
        return;
    }
    gameState.level++;
    gameState.timeLeft = 30;
    showLevelUpBanner();
    gameState.objects.forEach(obj => {
        if (obj.element.parentNode) obj.element.remove();
    });
    gameState.objects = [];
    updateDisplay();
    // Power-up: Remove double score after level up
    if (gameState.doubleScoreTimeout) clearTimeout(gameState.doubleScoreTimeout);
    gameState.doubleScore = false;
}

function showLevelUpBanner() {
    if (levelUpBanner) {
        levelUpBanner.textContent = `Level ${gameState.level}!`;
        levelUpBanner.classList.add('show');
        setTimeout(() => levelUpBanner.classList.remove('show'), 1500);
    } else {
        showFeedback(`Level ${gameState.level}!`, '#4ecdc4');
    }
}

function spawnObjects() {
    if (!gameState.isPlaying) return;

    // Difficulty increases by level
    const distractorBase = 1;
    const distractorCount = Math.min(6, distractorBase + Math.floor(gameState.level * 1.5));
    const spawnInterval = Math.max(800, 2000 - (gameState.level - 1) * 200);

    createTarget();

    for (let i = 0; i < distractorCount; i++) {
        setTimeout(() => createDistractor(), i * 120);
    }

    // Power-up: 1 in 5 chance to spawn a power-up, but only from level 2+
    if (gameState.level >= 2 && Math.random() < 0.2) {
        setTimeout(() => createPowerUp(), 700);
    }

    gameState.spawnTimer = setTimeout(() => {
        spawnObjects();
    }, spawnInterval + Math.random() * 400);
}

// ----- TARGET, DISTRACTOR, POWER-UP CREATION -----
function createTarget() {
    const target = document.createElement('div');
    target.className = 'game-object target';
    target.innerHTML = '⭐';

    const colors = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#a8e6cf', '#ff8a80',
        '#ce93d8', '#f48fb1', '#90caf9', '#c5e1a5', '#ff8866'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    target.style.background = randomColor;

    // Random position
    const x = Math.random() * (gameArea.clientWidth - 60);
    const y = Math.random() * (gameArea.clientHeight - 60);
    target.style.left = x + 'px';
    target.style.top = y + 'px';

    // Movement props (for later levels)
    if (gameState.level >= 3) {
        target.dataset.moving = "true";
        setRandomMovement(target);
    }

    target.addEventListener('click', () => handleTargetClick(target));

    gameArea.appendChild(target);
    gameState.objects.push({element: target, type: 'target'});

    // Targets disappear sooner as levels go up!
    const targetLife = Math.max(1200, 3000 - (gameState.level - 1) * 200);
    setTimeout(() => {
        if (target.parentNode) {
            target.remove();
            gameState.objects = gameState.objects.filter(obj => obj.element !== target);
        }
    }, targetLife);
}

function createDistractor() {
    const distractor = document.createElement('div');
    distractor.className = 'game-object distractor';
    distractor.style.width = '60px';
    distractor.style.height = '60px';
    distractor.style.borderRadius = '50%';
    distractor.style.background = '#ff6b6b';
    distractor.style.position = 'absolute';
    distractor.style.display = 'flex';
    distractor.style.alignItems = 'center';
    distractor.style.justifyContent = 'center';
    distractor.style.cursor = 'pointer';
    distractor.style.userSelect = 'none';

    const inner = document.createElement('span');
    inner.style.display = 'flex';
    inner.style.alignItems = 'center';
    inner.style.justifyContent = 'center';
    inner.style.width = '100%';
    inner.style.height = '100%';

    if (Math.random() < 0.3) {
        const randomShape = funDistractorShapes[Math.floor(Math.random() * funDistractorShapes.length)];
        inner.textContent = randomShape;
        inner.style.fontSize = '2.2rem';
    } else {
        inner.textContent = '●';
        inner.style.fontSize = '2rem';
        inner.style.color = '#222';
    }

    distractor.appendChild(inner);

    const x = Math.random() * (gameArea.clientWidth - 60);
    const y = Math.random() * (gameArea.clientHeight - 60);
    distractor.style.left = x + 'px';
    distractor.style.top = y + 'px';

    // Movement props (for later levels)
    if (gameState.level >= 3) {
        distractor.dataset.moving = "true";
        setRandomMovement(distractor);
    }

    distractor.addEventListener('click', () => handleDistractorClick(distractor));

    gameArea.appendChild(distractor);
    gameState.objects.push({element: distractor, type: 'distractor'});

    const distractorLife = Math.max(1400, 4000 - (gameState.level - 1) * 200);
    setTimeout(() => {
        if (distractor.parentNode) {
            distractor.remove();
            gameState.objects = gameState.objects.filter(obj => obj.element !== distractor);
        }
    }, distractorLife);
}

function createPowerUp() {
    const powerUp = document.createElement('div');
    powerUp.className = 'game-object powerup';
    powerUp.style.width = '60px';
    powerUp.style.height = '60px';
    powerUp.style.borderRadius = '50%';
    powerUp.style.background = '#fffbe7';
    powerUp.style.position = 'absolute';
    powerUp.style.display = 'flex';
    powerUp.style.alignItems = 'center';
    powerUp.style.justifyContent = 'center';
    powerUp.style.cursor = 'pointer';
    powerUp.style.userSelect = 'none';
    powerUp.style.border = '2px solid #ffd600';
    powerUp.style.boxShadow = '0 0 10px #ffd600';

    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    powerUp.textContent = type.emoji;
    powerUp.dataset.effect = type.effect;

    const x = Math.random() * (gameArea.clientWidth - 60);
    const y = Math.random() * (gameArea.clientHeight - 60);
    powerUp.style.left = x + 'px';
    powerUp.style.top = y + 'px';

    // Movement props (move power-ups from level 5+)
    if (gameState.level >= 5) {
        powerUp.dataset.moving = "true";
        setRandomMovement(powerUp);
    }

    powerUp.addEventListener('click', () => handlePowerUpClick(powerUp, type));

    gameArea.appendChild(powerUp);
    gameState.objects.push({element: powerUp, type: 'powerup'});

    setTimeout(() => {
        if (powerUp.parentNode) {
            powerUp.remove();
            gameState.objects = gameState.objects.filter(obj => obj.element !== powerUp);
        }
    }, 3500);
}

// ----- MOVING OBJECTS ENGINE -----
function setRandomMovement(element) {
    // Each element gets random dx/dy properties between -2 and 2 (not 0)
    element.dataset.dx = (Math.random() * 2 + 1) * (Math.random() < 0.5 ? 1 : -1);
    element.dataset.dy = (Math.random() * 2 + 1) * (Math.random() < 0.5 ? 1 : -1);
}

function startMovingObjects() {
    if (gameState.moveTimer) cancelAnimationFrame(gameState.moveTimer);

    function move() {
        // Only move objects if level >= 3
        if (gameState.isPlaying && gameState.level >= 3) {
            gameState.objects.forEach(obj => {
                if (obj.element.dataset.moving === "true") {
                    let x = parseFloat(obj.element.style.left);
                    let y = parseFloat(obj.element.style.top);
                    let dx = parseFloat(obj.element.dataset.dx);
                    let dy = parseFloat(obj.element.dataset.dy);

                    // Bounce off walls
                    if (x + dx < 0 || x + dx > gameArea.clientWidth - 60) {
                        dx = -dx;
                        obj.element.dataset.dx = dx;
                    }
                    if (y + dy < 0 || y + dy > gameArea.clientHeight - 60) {
                        dy = -dy;
                        obj.element.dataset.dy = dy;
                    }

                    obj.element.style.left = (x + dx) + 'px';
                    obj.element.style.top = (y + dy) + 'px';
                }
            });
        }
        gameState.moveTimer = requestAnimationFrame(move);
    }
    move();
}

// ----- CLICK HANDLERS -----
function handleTargetClick(target) {
    let points = gameState.doubleScore ? 20 : 10;
    gameState.score += points;
    gameState.focusLevel = Math.min(100, gameState.focusLevel + 5);
    playWhistle();
    target.classList.add('celebration');
    showFeedback(`Great job! +${points}`, '#4ecdc4');
    setTimeout(() => {
        target.remove();
        gameState.objects = gameState.objects.filter(obj => obj.element !== target);
    }, 600);
    updateDisplay();
}

function handleDistractorClick(distractor) {
    // Now also deducts points!
    let loss = gameState.doubleScore ? 20 : 10;
    gameState.focusLevel = Math.max(0, gameState.focusLevel - 15);
    gameState.score = Math.max(0, gameState.score - loss);
    distractor.style.background = '#ff4757';
    showFeedback(`Look for stars! -${loss}`, '#ff6b6b');
    setTimeout(() => {
        distractor.remove();
        gameState.objects = gameState.objects.filter(obj => obj.element !== distractor);
    }, 300);
    updateDisplay();
}

function handlePowerUpClick(powerUp, type) {
    if (type.effect === 'focus') {
        gameState.focusLevel = Math.min(100, gameState.focusLevel + 30);
    } else if (type.effect === 'double') {
        gameState.doubleScore = true;
        if (gameState.doubleScoreTimeout) clearTimeout(gameState.doubleScoreTimeout);
        gameState.doubleScoreTimeout = setTimeout(() => {
            gameState.doubleScore = false;
        }, 7000);
    } else if (type.effect === 'time') {
        gameState.timeLeft += 10;
    }
    showFeedback(type.message, type.color);
    powerUp.remove();
    gameState.objects = gameState.objects.filter(obj => obj.element !== powerUp);
    updateDisplay();
}

function showFeedback(message, color) {
    feedback.textContent = message;
    feedback.style.color = color;
    feedback.classList.add('show');
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 1000);
}

function updateDisplay() {
    scoreElement.textContent = gameState.score;
    levelElement.textContent = gameState.level;
    timeElement.textContent = gameState.timeLeft;
    focusFill.style.width = gameState.focusLevel + '%';
}

function endGame() {
    gameState.isPlaying = false;
    clearInterval(gameState.gameTimer);
    clearTimeout(gameState.spawnTimer);
    if (gameState.moveTimer) cancelAnimationFrame(gameState.moveTimer);
    gameState.objects.forEach(obj => {
        if (obj.element.parentNode) obj.element.remove();
    });
    gameState.objects = [];
    finalScoreElement.textContent = gameState.score;

    let message = '';
    if (gameState.score >= 100) {
        message = '🏆 Wow! You found so many stars! You\'re amazing!';
    } else if (gameState.score >= 50) {
        message = '🌟 Great job! You\'re really good at finding stars!';
    } else {
        message = '💪 Good try! Keep playing to find more stars!';
    }

    encouragementMessage.textContent = message;
    gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    startGame();
}
