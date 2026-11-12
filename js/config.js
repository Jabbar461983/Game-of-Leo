// Spielkonfiguration
const GAME_CONFIG = {
    // Teams
    MAX_TEAMS: 10,
    MAX_FRIENDS: 10,

    // Arena
    ARENA_SIZE: 500,

    // Karten
    INITIAL_CARDS: 5,
    CARDS_PER_SPAWN: 5,
    CARD_SPAWN_INTERVAL: 60000, // 1 Minute in ms
    MAX_CARDS_ON_MAP: 50,

    // Seltenheiten
    RARITIES: {
        common: {
            name: 'Häufig',
            icon: '🟩',
            color: '#808080',
            statMultiplier: 1.0,
            hpMultiplier: 1.0,
            damageMultiplier: 1.0,
            speedMultiplier: 1.0,
            rangeMultiplier: 1.0
        },
        rare: {
            name: 'Selten',
            icon: '🟦',
            color: '#4169e1',
            statMultiplier: 1.2,
            hpMultiplier: 1.2,
            damageMultiplier: 1.2,
            speedMultiplier: 1.1,
            rangeMultiplier: 1.1
        },
        epic: {
            name: 'Episch',
            icon: '🟪',
            color: '#9932cc',
            statMultiplier: 1.5,
            hpMultiplier: 1.5,
            damageMultiplier: 1.5,
            speedMultiplier: 1.3,
            rangeMultiplier: 1.3
        },
        mythic: {
            name: 'Mythisch',
            icon: '🟧',
            color: '#ff8c00',
            statMultiplier: 2.0,
            hpMultiplier: 2.0,
            damageMultiplier: 2.0,
            speedMultiplier: 1.5,
            rangeMultiplier: 1.5
        },
        legendary: {
            name: 'Legendär',
            icon: '🟨',
            color: '#ffd700',
            statMultiplier: 2.5,
            hpMultiplier: 2.5,
            damageMultiplier: 2.5,
            speedMultiplier: 1.8,
            rangeMultiplier: 1.8
        },
        og: {
            name: 'OG',
            icon: '💎',
            color: '#00d4ff',
            statMultiplier: 3.5,
            hpMultiplier: 3.5,
            damageMultiplier: 3.5,
            speedMultiplier: 2.2,
            rangeMultiplier: 2.0,
            hasSpecialAbility: true,
            hasCosmicAnimation: true
        }
    },

    // Welten
    WORLDS: {
        normal: {
            name: 'Normal',
            icon: '🌳',
            color: '#228B22',
            advantages: [],
            disadvantages: []
        },
        ice: {
            name: 'Eis',
            icon: '❄️',
            color: '#00bfff',
            advantages: ['fire'],
            disadvantages: ['water']
        },
        fire: {
            name: 'Feuer',
            icon: '🔥',
            color: '#ff4500',
            advantages: ['ice'],
            disadvantages: ['water']
        },
        water: {
            name: 'Wasser',
            icon: '💧',
            color: '#1e90ff',
            advantages: ['fire'],
            disadvantages: ['ice']
        },
        air: {
            name: 'Luft',
            icon: '💨',
            color: '#87ceeb',
            advantages: [],
            disadvantages: []
        }
    },

    // Schwierigkeitsgrad
    DIFFICULTIES: {
        easy: {
            name: 'Einfach',
            icon: '🟢',
            aiMultiplier: 0.7,
            aiHpMultiplier: 0.8,
            aiDamageMultiplier: 0.7
        },
        normal: {
            name: 'Normal',
            icon: '🟡',
            aiMultiplier: 1.0,
            aiHpMultiplier: 1.0,
            aiDamageMultiplier: 1.0
        },
        hard: {
            name: 'Schwer',
            icon: '🔴',
            aiMultiplier: 1.3,
            aiHpMultiplier: 1.3,
            aiDamageMultiplier: 1.3
        },
        insane: {
            name: 'Wahnsinn',
            icon: '💀',
            aiMultiplier: 1.8,
            aiHpMultiplier: 1.8,
            aiDamageMultiplier: 1.8
        }
    },

    // Monster-Basis-Stats
    MONSTER_BASE_STATS: {
        hp: 100,
        damage: 10,
        speed: 5,
        range: 15,
        attackCooldown: 1000 // ms
    },

    // Boss (für Kartenkampf)
    BOSS: {
        hp: 200,
        damage: 30,
        speed: 3,
        range: 20,
        attackCooldown: 1500
    }
};

// Schwierigkeits- und Welt-Einstellungen speichern
let gameSettings = {
    difficulty: 'normal',
    world: 'ice',
    selectedDifficulty: null,
    selectedWorld: null
};
