// Initialize the game when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new StepsGame();
    
    // Preload all audio and images
    const preloadAudio = () => {
        Object.values(game.sounds).forEach(audio => {
            audio.load();
        });
        game.audioManager.backgroundNoise.load();
    };
    
    preloadAudio();
});

class AudioManager {
    constructor() {
        this.backgroundNoise = new Audio('sounds/hospital.mp3');
        this.backgroundNoise.loop = true;
        this.backgroundNoise.volume = 0.9;
        this.isMuted = false;
        this.addNoiseControls();
    }

    addNoiseControls() {
        const controls = `
            <div class="addNoiseControls-controls">
                <button id="toggleNoise" class="noise-btn" aria-label="Toggle Background Noise">
                    <span class="noise-icon">🎵</span>
                </button>
                <input type="range" id="volumeSlider" min="0" max="100" value="30" aria-label="Volume Slider">
            </div>
        `;
        document.querySelector('.game-container').insertAdjacentHTML('afterbegin', controls);
        document.getElementById('toggleNoise').onclick = () => this.toggleNoise();
        document.getElementById('volumeSlider').oninput = (e) => this.setVolume(e.target.value);
    }

    startNoise() {
        this.backgroundNoise.play();
    }

    toggleNoise() {
        if (this.isMuted) {
            this.backgroundNoise.play();
            document.querySelector('.noise-icon').textContent = '🎵';
        } else {
            this.backgroundNoise.pause();
            document.querySelector('.noise-icon').textContent = '🔇';
        }
        this.isMuted = !this.isMuted;
    }

    setVolume(value) {
        this.backgroundNoise.volume = value / 100;
        Object.values(this.sounds).forEach(sound => {
            sound.volume = value / 100;
        });
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play();
        }
    }
}
// AchievementSystem: Manages player achievements and rewards
class AchievementSystem {
    constructor() {
        this.badges = {
            speedster: {
                name: "⚡ Speed Demon",
                requirement: "Complete under 60 seconds",
                icon: "🏃‍♂️",
                unlocked: false
            },
            perfectionist: {
                name: "🎯 Perfect Score",
                requirement: "No mistakes made",
                icon: "👑",
                unlocked: false
            },
            warrior: {
                name: "⚔️ Germ Warrior",
                requirement: "5 games completed",
                icon: "🛡️",
                unlocked: false
            }
        };
        this.unlockedAchievements = new Set();
    }

    checkAchievements(score, time, gamesPlayed) {
        if (time < 60) this.unlockBadge('speedster');
        if (score === 100) this.unlockBadge('perfectionist');
        if (gamesPlayed >= 5) this.unlockBadge('warrior');
    }

    unlockBadge(badgeId) {
        if (!this.unlockedAchievements.has(badgeId)) {
            this.unlockedAchievements.add(badgeId);
            this.showBadgeUnlock(this.badges[badgeId]);
        }
    }

    showBadgeUnlock(badge) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-info">
                <h3>${badge.name}</h3>
                <p>${badge.requirement}</p>
            </div>
        `;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 3000);
    }
}

class StepsGame {
    constructor() {
        this.score = 100;
        this.gameStarted = false;
        this.timerInterval = null;
        this.timerElement = document.getElementById('timer');
        this.correctSteps = [
            'step1', 'step2', 'step3', 'step4', 'step5',
            'step6', 'step7', 'step8', 'step9'
        ];
        this.animationImages = [
            'scrub.png', 'scrub1.png', 'scrub2.png',
            'scrub3.png', 'scrub4.png', 'scrub5.png',
            'scrub6.png', 'scrub7.png', 'scrub8.png',
            'scrub9.png'
        ];
        this.animationStep = 4;
        this.animationFrames = 10;
        this.finalImage = 'hands.png';
        this.stepDescriptions = {
            'step1': 'Turn on the faucet.',
            'step2': 'Begin handwashing by wetting hands.',
            'step3': 'Apply soap from the soap dispenser.',
            'step4': 'Scrub your hands for at least 20 seconds.',
            'step5': 'Use friction to distribute soap and create lather, cleansing front and back of hands, between fingers, around cuticles, under nails and wrists.',
            'step6': 'Rinse hands and wrists, removing soap.',
            'step7': 'Dry hands.',
            'step8': 'Use a paper towel to turn off the faucet.',
            'step9': 'Dispose of the paper towel.'
        };
        this.stepImages = {
            'step1': '1.faucetOn.png',
            'step2': '2.wetHands.png',
            'step3': '3.soapHands.png',
            'step4': '4.scrubHands.png',
            'step5': '5.rinseHands.png',
            'step6': '6.dryHands.png',
            'step7': '7.faucetOff.png',
            'step8': '8.trashTowel.png',
            'step9': '9.skillComplete.png'
        };
        this.currentStepIndex = 0;
        this.currentAnimationFrame = 0;
        this.animationInterval = null;
        this.audioManager = new AudioManager();
        this.sounds = {
            correct: new Audio('sounds/positive.mp3'),
            hint: new Audio('sounds/hint.mp3'),
            wrong: new Audio('sounds/negative.mp3'),
            timeUp: new Audio('sounds/gameOver.mp3'),
            water: new Audio('sounds/water.mp3'),
            soap: new Audio('sounds/soap.mp3'),
            scrub: new Audio('sounds/scrub.mp3'),
            dry: new Audio('sounds/dryHands.mp3'),
            trash: new Audio('sounds/trash.mp3'),
            start: new Audio('sounds/gameStart.mp3')
        };
        this.initializeGame();
    }

    initializeGame() {
        const dropdown = document.getElementById('stepsDropdown');
        dropdown.addEventListener('change', (e) => this.checkStep(e.target.value));
        document.getElementById('hintButton').addEventListener('click', () => this.showHint());
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        this.updateScore(this.score);
        this.updateMainImage('default.png');
        dropdown.disabled = true;
    }

    startGame() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        this.sounds.start.play();
        document.getElementById('stepsDropdown').disabled = false;
        this.updateDropdownOptions();
        this.audioManager.startNoise();
        document.getElementById('startButton').disabled = true;
        document.getElementById('startButton').style.display = 'none';  // This line makes the button vanish
        this.startTimer(180);
        this.updateMainImage('default.png');
    }

    startTimer(duration) {
        let timer = duration;
        clearInterval(this.timerInterval);

        const updateTimer = () => {
            const minutes = String(Math.floor(timer / 60)).padStart(2, '0');
            const seconds = String(timer % 60).padStart(2, '0');
            this.timerElement.textContent = `Time: ${minutes}:${seconds}`;
            
            if (timer <= 10) {
                this.timerElement.style.color = 'red';
            } else if (timer <= 20) {
                this.timerElement.style.color = 'orange';
            } else {
                this.timerElement.style.color = 'green';
            }
            
            if (--timer < 0) {
                clearInterval(this.timerInterval);
                this.handleTimeUp();
            }
        };

        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    }

    handleTimeUp() {
        this.updateScore(this.score - 10);
        this.sounds.timeUp.play();
        this.gameStarted = false;
        this.audioManager.backgroundNoise.pause();
        document.getElementById('stepsDropdown').disabled = true;
        document.getElementById('startButton').disabled = false;
        alert("Time's up! Game Over.");
        this.updateMainImage('default.png');
        this.currentStepIndex = 0;
        this.updateProgress();
        this.updateDropdownOptions();
    }

    showHint() {
        this.sounds.hint.play();
        const currentStep = this.correctSteps[this.currentStepIndex];
        alert(`Hint: ${this.stepDescriptions[currentStep]}`);
        this.updateScore(this.score - 2);
    }

    startAnimation() {
        this.animationInterval = setInterval(() => {
            if (this.currentAnimationFrame >= this.animationFrames - 1) {
                this.stopAnimation();
                return;
            }
            this.currentAnimationFrame++;
            this.updateMainImage(this.animationImages[this.currentAnimationFrame]);
        }, 800);
    }

    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    checkStep(selectedStep) {
        const dropdown = document.getElementById('stepsDropdown');
        if (selectedStep === this.correctSteps[this.currentStepIndex]) {
            this.handleCorrectStep(dropdown, selectedStep);
        } else {
            this.handleWrongStep(dropdown);
        }
    }

    handleCorrectStep(dropdown, selectedStep) {
        if (this.currentStepIndex === this.animationStep) {
            this.startAnimation();
        }

        switch(selectedStep) {
            case 'step1':
                this.sounds.water.play();
                break;
            case 'step2':
                this.sounds.water.play();
                break;
            case 'step3':
                this.sounds.soap.play();
                break;
            case 'step4':
                this.sounds.correct.play();
                break;
            case 'step5':
                this.sounds.scrub.play();
                break;
            case 'step6':
                this.sounds.water.play();
                break;
            case 'step7':
                this.sounds.dry.play();
                break;
            case 'step8':
                this.sounds.correct.play();
                break;
            case 'step9':
                this.sounds.trash.play();
                break;
            default:
                this.sounds.correct.play();
        }

        dropdown.classList.add('correct-answer');
        dropdown.disabled = true;
        this.updateMainImage(this.stepImages[selectedStep]);
        this.updateScore(this.score + 10);

        setTimeout(() => {
            dropdown.classList.remove('correct-answer');
            dropdown.value = '';
            dropdown.disabled = false;
            
            this.currentStepIndex++;
            this.updateProgress();
            this.updateDropdownOptions();

            if (this.currentStepIndex === this.correctSteps.length) {
                this.stopAnimation();
                this.updateMainImage(this.finalImage);
                clearInterval(this.timerInterval);
                this.endGame();
            }
        }, 2000);
    }

    handleWrongStep(dropdown) {
        this.sounds.wrong.play();
        this.updateScore(this.score - 5);
        dropdown.classList.add('wrong-answer');
        dropdown.disabled = true;

        setTimeout(() => {
            dropdown.classList.remove('wrong-answer');
            dropdown.value = '';
            dropdown.disabled = false;
        }, 2000);
    }

    updateDropdownOptions() {
        const dropdown = document.getElementById('stepsDropdown');
        dropdown.innerHTML = '<option value="">Select a step...</option>';

        const availableSteps = this.correctSteps
            .slice(this.currentStepIndex, Math.min(this.currentStepIndex + 3, this.correctSteps.length));

        const shuffledSteps = availableSteps
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);

        shuffledSteps.forEach(stepId => {
            const option = document.createElement('option');
            option.value = stepId;
            option.textContent = this.stepDescriptions[stepId];
            dropdown.appendChild(option);
        });
    }

    updateScore(newScore) {
        this.score = newScore;
        document.getElementById('score').textContent = this.score;
    }

    updateMainImage(imagePath) {
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.style.backgroundImage = `url('${imagePath}')`;
        }
    }

    updateProgress() {
        const progress = (this.currentStepIndex / this.correctSteps.length) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
    }

    endGame() {
    const startButton = document.getElementById('startButton');
    startButton.textContent = 'Play Again';
    startButton.style.display = 'block';

    let performance;
    if (this.score >= 95) {
        performance = 'perfect';
    } else if (this.score >= 80) {
        performance = 'good';
    } else {
        performance = 'improve';
    }

    const messages = {
        perfect: "Outstanding Care!",
        good: "Well Done!",
        improve: "Keep Practicing!"
    };

    const displayMessage = (message) => {
        const step = document.getElementById('step');
        step.textContent = message;
        step.style.fontSize = '24px';
        step.style.color = '#2c3e50';
        step.style.fontWeight = 'bold';
    };

    displayMessage(messages[performance]);

    this.sounds.applause = new Audio('sounds/applause.mp3');

    const message = new SpeechSynthesisUtterance("Congratulations! You completed all the steps.");
    window.speechSynthesis.speak(message);

    message.onend = () => {
        this.sounds.applause.play();
        this.sounds.applause.onended = () => {
            alert(`Handwashing Skill Complete!\nFinal Score: ${this.score}`);
            this.currentStepIndex = 0;
            this.score = 100;
            this.gameStarted = false;
            this.updateScore(this.score);
            this.updateMainImage('default.png');
            this.updateProgress();
            document.getElementById('stepsDropdown').disabled = true;
            document.getElementById('startButton').disabled = false;
        };
    };
}
} // End of StepsGame class
function startGame() {
    const introContainer = document.getElementById('introContainer');
    introContainer.style.opacity = '0';
    setTimeout(() => {
        introContainer.style.display = 'none';
    }, 500);
}
