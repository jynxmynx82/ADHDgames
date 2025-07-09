let gameState = {
    score: 0,
    level: 1,
    timeLeft: 60,
    isPlaying: false,
    focusLevel: 100,
    objects: [],
    gameTimer: null,
    spawnTimer: null
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

// Audio context for whistle sounds
let audioContext;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playWhistle() {
    initAudio();
    
    // Create oscillator for whistle sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Random pitch between 800Hz and 1200Hz
    const frequency = 800 + Math.random() * 400;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Whistle-like wave
    oscillator.type = 'sine';
    
    // Gentle volume
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play for 0.3 seconds
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function startGame() {
    gameState.isPlaying = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Reset game state
    gameState.score = 0;
    gameState.timeLeft = 60;
    gameState.focusLevel = 100;
    gameState.objects = [];
    
    updateDisplay();
    
    // Start game timer
    gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;
        updateDisplay();
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    // Start spawning objects
    spawnObjects();
}

function spawnObjects() {
    if (!gameState.isPlaying) return;
    
    // Spawn a target (golden star)
    createTarget();
    
    // Spawn distractors (red circles)
    const distractorCount = Math.min(3, Math.floor(gameState.score / 10) + 1);
    for (let i = 0; i < distractorCount; i++) {
        setTimeout(() => createDistractor(), i * 200);
    }
    
    // Schedule next spawn
    gameState.spawnTimer = setTimeout(() => {
        spawnObjects();
    }, 2000 + Math.random() * 1000);
}

function createTarget() {
    const target = document.createElement('div');
    target.className = 'game-object target';
    
    // 15% chance for special smiley face with big star in middle
    const isSpecial = Math.random() < 0.15;
    if (isSpecial) {
        target.style.background = '#4ecdc4'; // teal background
        target.style.fontSize = '16px';
        target.style.position = 'relative';
        target.style.display = 'flex';
        target.style.alignItems = 'center';
        target.style.justifyContent = 'center';
        
        // Create the smiley face parts
        const face = document.createElement('div');
        face.style.position = 'relative';
        face.style.width = '50px';
        face.style.height = '50px';
        face.style.borderRadius = '50%';
        face.style.backgroundColor = '#4ecdc4';
        face.style.display = 'flex';
        face.style.alignItems = 'center';
        face.style.justifyContent = 'center';
        
        // Left eye (star)
        const leftEye = document.createElement('div');
        leftEye.innerHTML = '⭐';
        leftEye.style.position = 'absolute';
        leftEye.style.fontSize = '8px';
        leftEye.style.left = '12px';
        leftEye.style.top = '12px';
        leftEye.style.color = '#ffd700';
        leftEye.style.pointerEvents = 'none';
        
        // Right eye (star)
        const rightEye = document.createElement('div');
        rightEye.innerHTML = '⭐';
        rightEye.style.position = 'absolute';
        rightEye.style.fontSize = '8px';
        rightEye.style.right = '12px';
        rightEye.style.top = '12px';
        rightEye.style.color = '#ffd700';
        rightEye.style.pointerEvents = 'none';
        
        // Mouth
        const mouth = document.createElement('div');
        mouth.style.position = 'absolute';
        mouth.style.width = '20px';
        mouth.style.height = '10px';
        mouth.style.border = '2px solid #ffd700';
        mouth.style.borderTop = 'none';
        mouth.style.borderRadius = '0 0 20px 20px';
        mouth.style.left = '50%';
        mouth.style.bottom = '8px';
        mouth.style.transform = 'translateX(-50%)';
        mouth.style.pointerEvents = 'none';
        
        // Big star in the middle
        const bigStar = document.createElement('div');
        bigStar.innerHTML = '⭐';
        bigStar.style.position = 'absolute';
        bigStar.style.fontSize = '24px';
        bigStar.style.left = '50%';
        bigStar.style.top = '50%';
        bigStar.style.transform = 'translate(-50%, -50%)';
        bigStar.style.pointerEvents = 'none';
        
        face.appendChild(leftEye);
        face.appendChild(rightEye);
        face.appendChild(mouth);
        face.appendChild(bigStar);
        target.appendChild(face);
    } else {
        target.innerHTML = '⭐';
        
        // Random background color (no yellow, includes red and 9 other colors)
        const colors = [
            '#ff6b6b', // red (same as distractor)
            '#4ecdc4', // teal
            '#45b7d1', // blue
            '#a8e6cf', // mint green
            '#ff8a80', // light red
            '#ce93d8', // purple
            '#f48fb1', // pink
            '#90caf9', // light blue
            '#c5e1a5', // light green
            '#ff8866'  // orange (changed from #ffcc02 to remove yellow)
        ];
        
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        target.style.background = randomColor;
    }
    
    // Random position
    const x = Math.random() * (gameArea.clientWidth - 60);
    const y = Math.random() * (gameArea.clientHeight - 60);
    target.style.left = x + 'px';
    target.style.top = y + 'px';
    
    target.addEventListener('click', () => handleTargetClick(target));
    
    gameArea.appendChild(target);
    gameState.objects.push({element: target, type: 'target'});
    
    // Remove after 3 seconds if not clicked
    setTimeout(() => {
        if (target.parentNode) {
            target.remove();
            gameState.objects = gameState.objects.filter(obj => obj.element !== target);
        }
    }, 3000);
}

function createDistractor() {
    const distractor = document.createElement('div');
    distractor.className = 'game-object distractor';
    distractor.innerHTML = '●';
    
    // Random position
    const x = Math.random() * (gameArea.clientWidth - 60);
    const y = Math.random() * (gameArea.clientHeight - 60);
    distractor.style.left = x + 'px';
    distractor.style.top = y + 'px';
    
    distractor.addEventListener('click', () => handleDistractorClick(distractor));
    
    gameArea.appendChild(distractor);
    gameState.objects.push({element: distractor, type: 'distractor'});
    
    // Remove after 4 seconds
    setTimeout(() => {
        if (distractor.parentNode) {
            distractor.remove();
            gameState.objects = gameState.objects.filter(obj => obj.element !== distractor);
        }
    }, 4000);
}

function handleTargetClick(target) {
    gameState.score += 10;
    gameState.focusLevel = Math.min(100, gameState.focusLevel + 5);
    
    // Play whistle sound with random pitch
    playWhistle();
    
    // Check if it's a special smiley face by looking for the face div
    const isSpecial = target.querySelector('div') !== null;
    const feedbackMessage = isSpecial ? 'Special Star! +10' : 'Great job! +10';
    
    // Visual feedback
    target.classList.add('celebration');
    showFeedback(feedbackMessage, '#4ecdc4');
    
    // Remove target
    setTimeout(() => {
        target.remove();
        gameState.objects = gameState.objects.filter(obj => obj.element !== target);
    }, 600);
    
    updateDisplay();
}

function handleDistractorClick(distractor) {
    gameState.focusLevel = Math.max(0, gameState.focusLevel - 15);
    
    // Visual feedback
    distractor.style.background = '#ff4757';
    showFeedback('Look for stars! -15', '#ff6b6b');
    
    // Remove distractor
    setTimeout(() => {
        distractor.remove();
        gameState.objects = gameState.objects.filter(obj => obj.element !== distractor);
    }, 300);
    
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
    
    // Clear all objects
    gameState.objects.forEach(obj => {
        if (obj.element.parentNode) {
            obj.element.remove();
        }
    });
    gameState.objects = [];
    
    // Show game over screen
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
