class CrystalQuestGame {
    constructor() {
        this.player = document.getElementById('player');
        this.gameContainer = document.querySelector('.game-container');
        this.crystalCount = 0;
        this.level = 1;
        this.playerX = 180;
        this.playerY = 300;
        this.crystals = [];
        this.focusTarget = null;
        this.focusProgress = 0;
        this.focusRequired = 100;
        this.gameWidth = 360;
        this.gameHeight = 640;
        this.controlsPressed = {};
        this.focusInterval = null;
        this.cloudInterval = null;
        this.instructionsTimeout = null;
        
        this.init();
    }
    
    init() {
        this.setupPlayer();
        this.setupControls();
        this.createEnvironment();
        this.spawnCrystals();
        this.gameLoop();
        this.updateUI();
    }
    
    setupPlayer() {
        this.player.style.left = this.playerX + 'px';
        this.player.style.top = this.playerY + 'px';
    }
    
    setupControls() {
        const buttons = [
            { id: 'leftBtn', key: 'left' },
            { id: 'rightBtn', key: 'right' },
            { id: 'upBtn', key: 'up' },
            { id: 'downBtn', key: 'down' },
            { id: 'spaceBtn', key: 'space' }
        ];
        
        buttons.forEach(button => {
            const btn = document.getElementById(button.id);
            
            // Touch events
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.controlsPressed[button.key] = true;
                btn.classList.add('active');
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.controlsPressed[button.key] = false;
                btn.classList.remove('active');
            });
            
            // Mouse events for desktop testing
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.controlsPressed[button.key] = true;
                btn.classList.add('active');
            });
            
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.controlsPressed[button.key] = false;
                btn.classList.remove('active');
            });
            
            // Prevent context menu
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        });
        
        // Keyboard controls for desktop
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.controlsPressed['left'] = true;
                    document.getElementById('leftBtn').classList.add('active');
                    break;
                case 'ArrowRight':
                    this.controlsPressed['right'] = true;
                    document.getElementById('rightBtn').classList.add('active');
                    break;
                case 'ArrowUp':
                    this.controlsPressed['up'] = true;
                    document.getElementById('upBtn').classList.add('active');
                    break;
                case 'ArrowDown':
                    this.controlsPressed['down'] = true;
                    document.getElementById('downBtn').classList.add('active');
                    break;
                case ' ':
                    this.controlsPressed['space'] = true;
                    document.getElementById('spaceBtn').classList.add('active');
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.controlsPressed['left'] = false;
                    document.getElementById('leftBtn').classList.remove('active');
                    break;
                case 'ArrowRight':
                    this.controlsPressed['right'] = false;
                    document.getElementById('rightBtn').classList.remove('active');
                    break;
                case 'ArrowUp':
                    this.controlsPressed['up'] = false;
                    document.getElementById('upBtn').classList.remove('active');
                    break;
                case 'ArrowDown':
                    this.controlsPressed['down'] = false;
                    document.getElementById('downBtn').classList.remove('active');
                    break;
                case ' ':
                    this.controlsPressed['space'] = false;
                    document.getElementById('spaceBtn').classList.remove('active');
                    break;
            }
        });
    }
    
    createEnvironment() {
        // Create floating clouds
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.createCloud(), i * 2000);
        }
        
        // Keep creating clouds
        this.cloudInterval = setInterval(() => {
            this.createCloud();
        }, 6000);
    }
    
    createCloud() {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        cloud.style.width = (40 + Math.random() * 30) + 'px';
        cloud.style.height = (20 + Math.random() * 15) + 'px';
        cloud.style.top = (80 + Math.random() * 150) + 'px';
        cloud.style.left = -60 + 'px';
        cloud.style.animationDuration = (10 + Math.random() * 8) + 's';
        
        this.gameContainer.appendChild(cloud);
        
        // Remove cloud after animation
        setTimeout(() => {
            if (cloud.parentNode) {
                cloud.parentNode.removeChild(cloud);
            }
        }, 20000);
    }
    
    spawnCrystals() {
        const crystalTypes = ['focus', 'pattern', 'speed', 'hidden'];
        const crystalsToSpawn = Math.min(3 + Math.floor(this.level / 2), 7);
        
        for (let i = 0; i < crystalsToSpawn; i++) {
            let x, y;
            let attempts = 0;
            
            // Ensure crystals don't spawn too close to each other or the player
            do {
                x = 50 + Math.random() * 260;
                y = 100 + Math.random() * 300;
                attempts++;
            } while (this.isTooClose(x, y) && attempts < 20);
            
            const crystal = {
                x: x,
                y: y,
                type: crystalTypes[Math.floor(Math.random() * crystalTypes.length)],
                element: document.createElement('div')
            };
            
            crystal.element.className = `crystal ${crystal.type}`;
            crystal.element.style.left = crystal.x + 'px';
            crystal.element.style.top = crystal.y + 'px';
            crystal.element.style.animationDelay = Math.random() * 2 + 's';
            
            crystal.element.addEventListener('click', () => {
                this.collectCrystal(crystal);
            });
            
            crystal.element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.collectCrystal(crystal);
            });
            
            this.gameContainer.appendChild(crystal.element);
            this.crystals.push(crystal);
        }
    }
    
    isTooClose(x, y) {
        // Check distance from player
        const playerDist = Math.sqrt((x - this.playerX) ** 2 + (y - this.playerY) ** 2);
        if (playerDist < 60) return true;
        
        // Check distance from other crystals
        for (let crystal of this.crystals) {
            const dist = Math.sqrt((x - crystal.x) ** 2 + (y - crystal.y) ** 2);
            if (dist < 50) return true;
        }
        
        return false;
    }
    
    collectCrystal(crystal) {
        // Check if player is close enough
        const dx = this.playerX - crystal.x;
        const dy = this.playerY - crystal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 60) {
            this.showInstructions('Get closer to the crystal!<br>Use the arrow buttons to move! ➡️');
            return;
        }
        
        if (crystal.type === 'focus') {
            this.startFocusChallenge(crystal);
        } else {
            this.completeCrystalCollection(crystal);
        }
    }
    
    startFocusChallenge(crystal) {
        if (this.focusTarget) return; // Already focusing
        
        this.focusTarget = crystal;
        this.focusProgress = 0;
        document.getElementById('focusBar').style.display = 'block';
        document.getElementById('instructions').innerHTML = 'Hold the FOCUS button!<br>Keep it pressed until the bar fills! 🔥';
        
        this.focusInterval = setInterval(() => {
            if (this.controlsPressed['space']) {
                this.focusProgress += 2;
                document.getElementById('focusProgress').style.width = this.focusProgress + '%';
                
                if (this.focusProgress >= 100) {
                    this.completeFocusChallenge(crystal);
                }
            } else {
                this.focusProgress = Math.max(0, this.focusProgress - 3);
                document.getElementById('focusProgress').style.width = this.focusProgress + '%';
            }
        }, 50);
        
        // Auto-cancel after 10 seconds
        setTimeout(() => {
            if (this.focusTarget === crystal) {
                this.cancelFocusChallenge();
            }
        }, 10000);
    }
    
    completeFocusChallenge(crystal) {
        if (this.focusInterval) {
            clearInterval(this.focusInterval);
            this.focusInterval = null;
        }
        
        document.getElementById('focusBar').style.display = 'none';
        document.getElementById('instructions').innerHTML = 'Amazing focus! 🌟<br>Keep collecting crystals!';
        this.focusTarget = null;
        this.completeCrystalCollection(crystal);
    }
    
    cancelFocusChallenge() {
        if (this.focusInterval) {
            clearInterval(this.focusInterval);
            this.focusInterval = null;
        }
        
        document.getElementById('focusBar').style.display = 'none';
        document.getElementById('instructions').innerHTML = 'Try again!<br>Move close and tap crystals! ✨';
        this.focusTarget = null;
        this.focusProgress = 0;
    }
    
    completeCrystalCollection(crystal) {
        // Create particle effect
        this.createParticleEffect(crystal.x, crystal.y);
        
        // Play sound effect (visual feedback)
        this.playCollectSound();
        
        // Remove crystal
        crystal.element.remove();
        const index = this.crystals.indexOf(crystal);
        this.crystals.splice(index, 1);
        
        // Update score
        this.crystalCount++;
        this.updateUI();
        
        // Check for level completion
        if (this.crystals.length === 0) {
            this.nextLevel();
        }
    }
    
    createParticleEffect(x, y) {
        const colors = ['#ffff00', '#ff6b6b', '#4ecdc4', '#feca57', '#a8e6cf'];
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            const angle = (Math.PI * 2 * i) / 12;
            const distance = 30 + Math.random() * 30;
            const endX = x + Math.cos(angle) * distance;
            const endY = y + Math.sin(angle) * distance;
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${endX - x}px, ${endY - y}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1000,
                easing: 'ease-out'
            });
            
            this.gameContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }
    
    playCollectSound() {
        // Visual sound effect - flash the crystal counter
        const counter = document.querySelector('.crystal-counter');
        counter.style.transform = 'scale(1.4)';
        counter.style.filter = 'brightness(2)';
        
        setTimeout(() => {
            counter.style.transform = 'scale(1)';
            counter.style.filter = 'brightness(1)';
        }, 300);
    }
    
    nextLevel() {
        this.level++;
        
        // Show level complete message
        const levelComplete = document.getElementById('levelComplete');
        levelComplete.style.display = 'block';
        levelComplete.innerHTML = `<h2>Level ${this.level - 1} Complete! 🎉</h2><p>Crystals collected: ${this.crystalCount}</p><p>Starting Level ${this.level}...</p>`;
        
        // Flash screen
        this.gameContainer.style.filter = 'brightness(1.8)';
        
        setTimeout(() => {
            this.gameContainer.style.filter = 'brightness(1)';
            levelComplete.style.display = 'none';
            
            // Change background color for variety
            const bgColors = [
                'linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%)',
                'linear-gradient(to bottom, #FFB6C1 0%, #FFA07A 100%)',
                'linear-gradient(to bottom, #DDA0DD 0%, #98FB98 100%)',
                'linear-gradient(to bottom, #F0E68C 0%, #FFE4B5 100%)',
                'linear-gradient(to bottom, #FF6347 0%, #FFD700 100%)'
            ];
            
            this.gameContainer.style.background = bgColors[(this.level - 1) % bgColors.length];
            
            // Spawn new crystals
            this.spawnCrystals();
            this.updateUI();
            
            document.getElementById('instructions').innerHTML = `Level ${this.level} - New crystals appeared!<br>Collect them all! ✨`;
        }, 2000);
    }
    
    updateUI() {
        document.getElementById('crystalCount').textContent = this.crystalCount;
        document.getElementById('levelDisplay').textContent = this.level;
    }
    
    gameLoop() {
        this.updatePlayer();
        this.checkCrystalProximity();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updatePlayer() {
        const speed = 3;
        
        if (this.controlsPressed['left']) {
            this.playerX = Math.max(20, this.playerX - speed);
        }
        if (this.controlsPressed['right']) {
            this.playerX = Math.min(this.gameWidth - 55, this.playerX + speed);
        }
        if (this.controlsPressed['up']) {
            this.playerY = Math.max(70, this.playerY - speed);
        }
        if (this.controlsPressed['down']) {
            this.playerY = Math.min(400, this.playerY + speed);
        }
        
        this.player.style.left = this.playerX + 'px';
        this.player.style.top = this.playerY + 'px';
    }
    
    checkCrystalProximity() {
        this.crystals.forEach(crystal => {
            const dx = this.playerX - crystal.x;
            const dy = this.playerY - crystal.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 60) {
                // Player is near crystal - make it more obvious
                crystal.element.classList.add('near');
            } else {
                crystal.element.classList.remove('near');
            }
        });
    }
    
    showInstructions(text) {
        const instructions = document.getElementById('instructions');
        instructions.innerHTML = text;
        instructions.classList.remove('fade-out');
        
        // Clear any existing timeout
        if (this.instructionsTimeout) {
            clearTimeout(this.instructionsTimeout);
        }
        
        // Fade out after 20 seconds
        this.instructionsTimeout = setTimeout(() => {
            instructions.classList.add('fade-out');
        }, 20000);
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new CrystalQuestGame();
});