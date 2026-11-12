// UI-Verwaltung
class UIManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Hauptmenü - Schwierigkeit
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                gameSettings.selectedDifficulty = e.target.getAttribute('data-difficulty');
            });
        });

        // Hauptmenü - Welt
        document.querySelectorAll('.world-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.world-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                gameSettings.selectedWorld = e.target.getAttribute('data-world');
            });
        });

        // Hauptmenü - Start
        document.getElementById('startBtn').addEventListener('click', () => {
            if (gameSettings.selectedDifficulty && gameSettings.selectedWorld) {
                gameState.difficulty = gameSettings.selectedDifficulty;
                gameState.world = gameSettings.selectedWorld;
                this.startGame();
            } else {
                alert('Bitte wähle Schwierigkeit und Welt!');
            }
        });

        // Hauptmenü - Tutorial
        document.getElementById('tutorialBtn').addEventListener('click', () => {
            gameState.switchScreen('tutorial');
        });

        // Tutorial - Zurück
        document.getElementById('backFromTutorial').addEventListener('click', () => {
            gameState.switchScreen('mainMenu');
        });

        // Lobbycode kopieren
        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            const code = document.getElementById('lobbyCode').textContent;
            navigator.clipboard.writeText(code).then(() => {
                alert('Code kopiert: ' + code);
            });
        });

        // Lobby - Verlassen
        document.getElementById('leaveBtn').addEventListener('click', () => {
            gameState.switchScreen('mainMenu');
        });

        // Stop-Button (Kartenwahl)
        document.getElementById('stopBtn').addEventListener('click', () => {
            this.startBattle();
        });

        // Pause-Button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        // Pause-Menu Buttons
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('mainMenuBtn').addEventListener('click', () => {
            this.endGame();
        });

        // Game Over
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('mainMenuBtn2').addEventListener('click', () => {
            gameState.switchScreen('mainMenu');
        });
    }

    startGame() {
        // Teams initialisieren
        gameState.initializeTeams(gameState.difficulty);

        // Lobbycode generieren
        gameState.generateLobbyCode();
        document.getElementById('lobbyCode').textContent = gameState.lobbyCode;
        document.getElementById('teamsReady').textContent = '1/10'; // Player ist bereit

        // Kartenwahl-Bildschirm anzeigen
        gameState.switchScreen('cardSelection');
        this.showNextCard();
    }

    showNextCard() {
        const playerTeam = gameState.getPlayerTeam();
        const cardIndex = playerTeam.cardIndex;

        if (cardIndex >= GAME_CONFIG.INITIAL_CARDS) {
            // Alle Karten durchgespielt - Stop-Button aktivieren
            document.getElementById('stopBtn').disabled = false;
            return;
        }

        const cardsGrid = document.getElementById('cardsGrid');
        cardsGrid.innerHTML = '';

        // Zufällige Karten generieren
        const card = generateMonsterCard();

        card.forEach((monster, index) => {
            const cardElement = this.createCardElement(monster, cardIndex, index);
            cardsGrid.appendChild(cardElement);
        });

        document.getElementById('cardCountDisplay').textContent = `Karte ${cardIndex + 1}/${GAME_CONFIG.INITIAL_CARDS}`;
    }

    createCardElement(monsterData, cardIndex, cardPosition) {
        const card = document.createElement('div');
        card.className = 'card';

        const monsterDef = MONSTERS[monsterData.type];
        const rarityConfig = GAME_CONFIG.RARITIES[monsterData.rarity];

        card.innerHTML = `
            <div>
                <div style="font-size: 2.5rem; margin: 5px 0;">${monsterDef.emoji}</div>
                <div class="card-rarity rarity-${monsterData.rarity}" style="background-color: ${rarityConfig.color}; font-size: 0.8rem;">
                    ${rarityConfig.icon} ${rarityConfig.name}
                </div>
                <div class="card-monster-name">${monsterDef.name}</div>
                <div class="card-stats" style="font-size: 0.85rem;">
                    <div>❤️ HP: ${Math.round(monsterDef.baseStats.hp * rarityConfig.hpMultiplier)}</div>
                    <div>⚔️ Dmg: ${Math.round(monsterDef.baseStats.damage * rarityConfig.damageMultiplier)}</div>
                    <div>💨 Spd: ${(monsterDef.baseStats.speed * rarityConfig.speedMultiplier).toFixed(1)}</div>
                    <div>🎯 Rng: ${(monsterDef.baseStats.range * rarityConfig.rangeMultiplier).toFixed(1)}</div>
                </div>
                <p style="font-size: 0.75rem; margin-top: 5px; color: #bbb;">${monsterDef.description}</p>
            </div>
        `;

        // Arrow Function um 'this' richtig zu binden
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const playerTeam = gameState.getPlayerTeam();
            const newMonster = new Monster(monsterData.type, monsterData.rarity, playerTeam.id);
            playerTeam.monsters.push(newMonster);
            playerTeam.cardIndex++;

            // Unlock Monster
            gameState.unlockMonster(monsterData.type, monsterData.rarity);
            gameState.saveGameState();

            console.log(`Card ${playerTeam.cardIndex}/10 ausgewählt. Monster:`, monsterDef.name);

            // Nächste Karte zeigen
            this.showNextCard();
        });

        return card;
    }

    startBattle() {
        gameState.gameActive = true;
        gameState.switchScreen('game');

        // Babylon.js Szene initialisieren
        if (typeof initializeBabylonScene === 'function') {
            initializeBabylonScene();
        }
    }

    togglePause() {
        gameState.gamePaused = !gameState.gamePaused;
        const pauseMenu = document.getElementById('pauseMenu');

        if (gameState.gamePaused) {
            pauseMenu.classList.remove('hidden');
        } else {
            pauseMenu.classList.add('hidden');
        }
    }

    endGame() {
        gameState.gameActive = false;
        gameState.gamePaused = false;
        gameState.switchScreen('mainMenu');
    }

    updateHUD() {
        const playerTeam = gameState.getPlayerTeam();

        if (playerTeam) {
            const healthPercent = Math.round((playerTeam.monsters.length / 20) * 100);
            document.getElementById('teamHealth').textContent = healthPercent + '%';
            document.getElementById('monsterCount').textContent = playerTeam.monsters.length;
        }

        document.getElementById('teamsAlive').textContent = gameState.getAliveTeamsCount();
        document.getElementById('worldName').textContent = GAME_CONFIG.WORLDS[gameState.world].name + '-Welt';
    }

    showGameOver(message) {
        gameState.gameActive = false;
        const gameOverMenu = document.getElementById('gameOverMenu');
        document.getElementById('gameOverMessage').textContent = message;
        gameOverMenu.classList.remove('hidden');
    }

    updateMonsterIndex() {
        const indexGrid = document.getElementById('monsterIndexGrid');
        indexGrid.innerHTML = '';

        const monsterKeys = Object.keys(MONSTERS);
        monsterKeys.forEach(monsterKey => {
            const monsterDef = MONSTERS[monsterKey];

            Object.keys(GAME_CONFIG.RARITIES).forEach(rarity => {
                const unlockKey = `${monsterKey}_${rarity}`;
                const isUnlocked = gameState.unlockedMonsters.includes(unlockKey);

                if (isUnlocked) {
                    const item = document.createElement('div');
                    item.className = 'monster-index-item';

                    const rarityConfig = GAME_CONFIG.RARITIES[rarity];
                    item.innerHTML = `
                        <div class="monster-icon">${monsterDef.emoji}</div>
                        <div class="monster-name">${monsterDef.name}</div>
                        <div class="monster-rarity" style="background-color: ${rarityConfig.color}">
                            ${rarityConfig.icon} ${rarityConfig.name}
                        </div>
                    `;

                    indexGrid.appendChild(item);
                }
            });
        });
    }
}

// Initialisierung
const uiManager = new UIManager();

// Beim Laden
window.addEventListener('load', () => {
    gameState.loadGameState();
});
