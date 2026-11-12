// Globaler Spielstatus
class GameState {
    constructor() {
        this.currentScreen = 'mainMenu';
        this.gameActive = false;
        this.gamePaused = false;
        this.lobbyCode = null;
        this.playerTeamId = null;
        this.teams = [];
        this.currentCardIndex = 0;
        this.selectedCards = [];
        this.unlockedMonsters = this.loadUnlockedMonsters();
        this.difficulty = 'normal';
        this.world = 'ice';
    }

    // Bildschirm wechseln
    switchScreen(screenName) {
        // Verstecke alle Bildschirme
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Modal verstecken
        document.getElementById('pauseMenu').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');

        // Zeige neuen Bildschirm
        const screen = document.getElementById(screenName + 'Screen');
        if (screen) {
            screen.classList.add('active');
        }

        this.currentScreen = screenName;
    }

    // Lobbycode generieren
    generateLobbyCode() {
        this.lobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        return this.lobbyCode;
    }

    // Team erstellen
    createTeam(id, isAI = true, difficulty = 'normal') {
        return {
            id: id,
            isAI: isAI,
            isReady: false,
            monsters: [],
            alive: true,
            cardIndex: 0,
            selectedCards: [],
            position: this.getTeamStartPosition(id),
            teamColor: this.getTeamColor(id),
            difficulty: difficulty
        };
    }

    // Team-Startposition basierend auf ID
    getTeamStartPosition(teamId) {
        const angle = (teamId / GAME_CONFIG.MAX_TEAMS) * Math.PI * 2;
        const radius = GAME_CONFIG.ARENA_SIZE / 2.5;
        return {
            x: Math.cos(angle) * radius,
            z: Math.sin(angle) * radius
        };
    }

    // Team-Farbe für Minimap
    getTeamColor(teamId) {
        const colors = [
            { r: 1, g: 0, b: 0 },
            { r: 1, g: 0.5, b: 0 },
            { r: 1, g: 1, b: 0 },
            { r: 0.5, g: 1, b: 0 },
            { r: 0, g: 1, b: 0 },
            { r: 0, g: 1, b: 0.5 },
            { r: 0, g: 1, b: 1 },
            { r: 0, g: 0.5, b: 1 },
            { r: 0.5, g: 0, b: 1 },
            { r: 1, g: 0, b: 1 }
        ];
        return colors[teamId % colors.length];
    }

    // Spieler-Farbe (blau)
    getPlayerColor() {
        return { r: 0, g: 0.5, b: 1 };
    }

    // Monster freischalten
    unlockMonster(monsterName, rarity) {
        const key = `${monsterName}_${rarity}`;
        if (!this.unlockedMonsters.includes(key)) {
            this.unlockedMonsters.push(key);
            this.saveUnlockedMonsters();
        }
    }

    // Freigescaltete Monster speichern
    saveUnlockedMonsters() {
        localStorage.setItem('paintingWarsUnlockedMonsters', JSON.stringify(this.unlockedMonsters));
    }

    // Freigescaltete Monster laden
    loadUnlockedMonsters() {
        const saved = localStorage.getItem('paintingWarsUnlockedMonsters');
        return saved ? JSON.parse(saved) : [];
    }

    // Spielstand speichern
    saveGameState() {
        const state = {
            unlockedMonsters: this.unlockedMonsters,
            lastDifficulty: this.difficulty,
            lastWorld: this.world
        };
        localStorage.setItem('paintingWarsGameState', JSON.stringify(state));
    }

    // Spielstand laden
    loadGameState() {
        const saved = localStorage.getItem('paintingWarsGameState');
        if (saved) {
            const state = JSON.parse(saved);
            this.unlockedMonsters = state.unlockedMonsters || [];
            this.difficulty = state.lastDifficulty || 'normal';
            this.world = state.lastWorld || 'ice';
        }
    }

    // Alle Teams initialisieren
    initializeTeams(difficulty) {
        this.teams = [];

        // Spieler-Team
        const playerTeam = this.createTeam(0, false, difficulty);
        this.teams.push(playerTeam);
        this.playerTeamId = 0;

        // KI Teams - geben sie auch zufällige Monster
        for (let i = 1; i < GAME_CONFIG.MAX_TEAMS; i++) {
            const aiTeam = this.createTeam(i, true, difficulty);

            // Gib jedem AI-Team 2-4 zufällige Monster
            const monsterCount = Math.floor(Math.random() * 3) + 2; // 2-4 Monster
            for (let j = 0; j < monsterCount; j++) {
                const monsterKeys = Object.keys(MONSTERS);
                const randomMonsterType = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
                const randomRarity = getRandomRarity(randomMonsterType);
                const newMonster = new Monster(randomMonsterType, randomRarity, aiTeam.id);
                aiTeam.monsters.push(newMonster);
            }

            this.teams.push(aiTeam);
        }
    }

    // Team nach ID abrufen
    getTeamById(teamId) {
        return this.teams.find(t => t.id === teamId);
    }

    // Spieler-Team abrufen
    getPlayerTeam() {
        return this.getTeamById(this.playerTeamId);
    }

    // Aktive Teams zählen
    getAliveTeamsCount() {
        return this.teams.filter(t => t.alive && t.monsters.length > 0).length;
    }

    // Alle Monster zählen
    getTotalMonstersCount() {
        return this.teams.reduce((total, team) => total + team.monsters.length, 0);
    }
}

// Globale Instanz
const gameState = new GameState();
