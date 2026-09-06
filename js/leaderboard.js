class Leaderboard {
    constructor() {
        this.entries = [];
        this.storageKey = 'gameOfLeo_leaderboard';
        this.maxEntries = 1000;
    }

    addEntry(playerName, world, level, character) {
        if (!playerName || playerName.trim().length === 0) {
            playerName = 'Spieler';
        }

        const worldConfig = getWorldConfig(world);
        const charConfig = getCharacterConfig(character);

        const entry = {
            playerName: playerName.substring(0, 20),
            world: world,
            level: level,
            worldName: worldConfig.name,
            character: character,
            characterIcon: charConfig.icon,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        this.entries.push(entry);
        this.entries.sort((a, b) => {
            if (b.world !== a.world) return b.world - a.world;
            return b.level - a.level;
        });

        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(0, this.maxEntries);
        }

        this.saveToStorage();
        return entry;
    }

    getTopEntries(count = 10) {
        return this.entries.slice(0, count);
    }

    getAllEntries() {
        return [...this.entries];
    }

    clearStorage() {
        this.entries = [];
        localStorage.removeItem(this.storageKey);
    }

    saveToStorage() {
        try {
            const data = JSON.stringify(this.entries);
            localStorage.setItem(this.storageKey, data);
        } catch (e) {
            console.warn('Failed to save leaderboard to localStorage:', e);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                this.entries = JSON.parse(data);
                this.entries.sort((a, b) => {
                    if (b.world !== a.world) return b.world - a.world;
                    return b.level - a.level;
                });
            }
        } catch (e) {
            console.warn('Failed to load leaderboard from localStorage:', e);
            this.entries = [];
        }
    }

    exportData() {
        return JSON.stringify(this.entries, null, 2);
    }

    importData(jsonString) {
        try {
            this.entries = JSON.parse(jsonString);
            this.saveToStorage();
            return true;
        } catch (e) {
            console.error('Failed to import leaderboard data:', e);
            return false;
        }
    }

    getPlayerStats(playerName) {
        const playerEntries = this.entries.filter(e => e.playerName === playerName);
        if (playerEntries.length === 0) return null;

        const bestEntry = playerEntries[0];
        const totalGames = playerEntries.length;
        const avgLevel = playerEntries.reduce((sum, e) => sum + e.level, 0) / totalGames;

        return {
            playerName,
            totalGames,
            bestWorld: bestEntry.world,
            bestLevel: bestEntry.level,
            averageLevel: avgLevel.toFixed(1)
        };
    }

    getRankByEntry(entry) {
        let rank = 1;
        for (let e of this.entries) {
            if (e.world > entry.world || (e.world === entry.world && e.level > entry.level)) {
                rank++;
            } else if (e === entry) {
                break;
            }
        }
        return rank;
    }
}

const leaderboard = new Leaderboard();
