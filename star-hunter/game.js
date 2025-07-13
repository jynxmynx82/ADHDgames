let gameState = {
    score: 0,
    level: 1,
    timeLeft: 30,
    isPlaying: false,
    focusLevel: 100,
    starsClickedThisLevel: 0, // NEW: Tracks if a star was clicked in the current level
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

function playErrorSound() {
    initAudio();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playPowerUpSound() {
    initAudio();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
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
    gameState.starsClickedThisLevel = 0; // Reset star click counter
    gameState.objects = [];
    gameState.doubleScore = false;
    updateDisplay();

    if (gameState.gameTimer) clearInterval(gameState.gameTimer);
    if (gameState.spawnTimer) clearTimeout(gameState.spawnTimer);
    if (gameState.moveTimer) cancelAnimationFrame(gameState.moveTimer);
    if (gameState.doubleScoreTimeout) clearTimeout(gameState.doubleScoreTimeout);

    gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;
        updateDisplay();
        if (gameState.timeLeft <= 0) {
            nextLevelOrEnd();
        }
    }, 1000);

    spawnObjects();
    startMovingObjects();
}

// --- (CHANGE START) ---
// This function is now rewritten to check for success before leveling up.
function nextLevelOrEnd() {
    // End the game if focus is gone, OR if the player clicked no stars last level (after level 1)
    if (gameState.focusLevel <= 0 || (gameState.level > 1 && gameState.starsClickedThisLevel === 0)) {
        endGame();
        return;
    }

    // If successful, proceed to the next level
    gameState.level++;
    gameState.timeLeft = 30;
    gameState.starsClickedThisLevel = 0; // Reset for the new level
    showLevelUpBanner();
    gameState.objects.forEach(obj => {
        if (obj.element.parentNode) obj.element.remove();
    });
    gameState.objects = [];
    updateDisplay();
    if (gameState.doubleScoreTimeout) clearTimeout(gameState.doubleScoreTimeout);
    gameState.doubleScore = false;
}
// --- (CHANGE END) ---

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

    const distractorBase = 1;
    const distractorCount = Math.min(6, distractorBase + Math.floor(gameState.level * 1.5));
    const spawnInterval = Math.max(800, 2000 - (gameState.level - 1) * 200);

    createTarget();

    for (let i = 0; i < distractorCount; i++) {
        setTimeout(() => createDistractor(), i * 120);
    }

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

    target.style.left = Math.random() * (gameArea.clientWidth - 60) + 'px';
    target.style.top = Math.random() * (gameArea.clientHeight - 60) + 'px';
    target.style.left = x + 'px';
    target.style.top = y + 'px';

    if (gameState.level >= 3) {
        target.dataset.moving = "true";
        setRandomMovement(target);
    }

    target.addEventListener('click', () => handleTargetClick(target));
    gameArea.appendChild(target);
    gameState.objects.push({element: target, type: 'target'});

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
    distractor.style.background = '#ff6b6b';

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

    distractor.style.left = Math.random() * (gameArea.clientWidth - 60) + 'px';
    distractor.style.top = Math.random() * (gameArea.clientHeight - 60) + 'px';
    distractor.style.left = x + 'px';
    distractor.style.top = y + 'px';

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
    powerUp.style.background = '#fffbe7';
    powerUp.style.border = '2px solid #ffd600';
    powerUp.style.boxShadow = '0 0 10px #ffd600';

    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    powerUp.textContent = type.emoji;
    powerUp.dataset.effect = type.effect;

    powerUp.style.left = Math.random() * (gameArea.clientWidth - 60) + 'px';
    powerUp.style.top = Math.random() * (gameArea.clientHeight - 60) + 'px';
    powerUp.style.left = x + 'px';
    powerUp.style.top = y + 'px';

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
    const speed = 0.5 + (gameState.level - 3) * 0.25;
    element.dataset.dx = (Math.random() * speed + 0.5) * (Math.random() < 0.5 ? 1 : -1);
    element.dataset.dy = (Math.random() * speed + 0.5) * (Math.random() < 0.5 ? 1 : -1);
}

function startMovingObjects() {
    if (gameState.moveTimer) cancelAnimationFrame(gameState.moveTimer);

    function move() {
        if (gameState.isPlaying && gameState.level >= 3) {
            gameState.objects.forEach(obj => {
                if (obj.element.dataset.moving === "true") {
                    let x = parseFloat(obj.element.style.left);
                    let y = parseFloat(obj.element.style.top);
                    let dx = parseFloat(obj.element.dataset.dx);
                    let dy = parseFloat(obj.element.dataset.dy);
                    let objectWidth = obj.element.getBoundingClientRect().width;

                    if (x + dx < 0 || x + dx > gameArea.clientWidth - objectWidth) {
                        dx = -dx;
                        obj.element.dataset.dx = dx;
                    }
                    if (y + dy < 0 || y + dy > gameArea.clientHeight - objectWidth) {
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
    gameState.starsClickedThisLevel++; // --- (CHANGE) --- Increment the counter
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
    let loss = gameState.doubleScore ? 20 : 10;
    gameState.focusLevel = Math.max(0, gameState.focusLevel - 15);
    gameState.score = Math.max(0, gameState.score - loss);
    playErrorSound();
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
    playPowerUpSound();
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
