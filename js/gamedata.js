const GAME_CONFIG = {
    worlds: [
        { id: 0, name: 'Gift', color: '#9b59b6', icon: '☠️', bossName: 'Giftkönigin', bossPower: 'Giftschuss' },
        { id: 1, name: 'Wasser', color: '#3498db', icon: '💧', bossName: 'Wassergolem', bossPower: 'Wasserwelle' },
        { id: 2, name: 'Feuer', color: '#e74c3c', icon: '🔥', bossName: 'Feuerdämon', bossPower: 'Feuerball' },
        { id: 3, name: 'Erde', color: '#8b6914', icon: '⛰️', bossName: 'Erdtitan', bossPower: 'Erdstachel' },
        { id: 4, name: 'Eis', color: '#ecf0f1', icon: '❄️', bossName: 'Eiskönig', bossPower: 'Gefrierung' },
        { id: 5, name: 'Sand', color: '#d4a574', icon: '🏜️', bossName: 'Sandpharaoh', bossPower: 'Sandsturm' },
        { id: 6, name: 'Leere', color: '#2c3e50', icon: '🌑', bossName: 'Voidlord', bossPower: 'Dimensionsloch' },
        { id: 7, name: 'Donner', color: '#f39c12', icon: '⚡', bossName: 'Sturmgott', bossPower: 'Blitzschlag' },
        { id: 8, name: 'Holz', color: '#27ae60', icon: '🌲', bossName: 'Waldgeist', bossPower: 'Dornenranken' },
        { id: 9, name: 'Chaos', color: '#e91e63', icon: '💥', bossName: 'Chaosmacht', bossPower: 'Totale Zerstörung' }
    ],
    levelsPerWorld: 5,
    maxHealth: 100,
    damagePerHit: 1,
    characters: {
        wizard: {
            name: 'Magier',
            icon: '🧙‍♂️',
            weaponType: 'bolt',
            weaponName: 'Zauberstab',
            fireRate: 300,
            damage: 5,
            speed: 5,
            description: 'Schießt magische Blitze'
        },
        princess: {
            name: 'Prinzessin',
            icon: '👑',
            weaponType: 'coin',
            weaponName: 'Münzen',
            fireRate: 400,
            damage: 6,
            speed: 4.5,
            description: 'Schießt explodierende Münzen'
        },
        knight: {
            name: 'Schwertkämpfer',
            icon: '🛡️',
            weaponType: 'sword',
            weaponName: 'Schwert',
            fireRate: 200,
            damage: 7,
            speed: 5,
            description: 'Kämpft mit Schwert und Schild'
        }
    }
};

const ENEMY_TYPES = {
    skeleton: {
        name: 'Skelett-Bogenschütze',
        icon: '💀',
        health: 20,
        speed: 2,
        damage: 1,
        attackRange: 250,
        attackCooldown: 1000,
        points: 50
    },
    bat: {
        name: 'Fledermaus',
        icon: '🦇',
        health: 10,
        speed: 3.5,
        damage: 1,
        attackRange: 100,
        attackCooldown: 500,
        points: 30
    },
    ghost: {
        name: 'Geist',
        icon: '👻',
        health: 15,
        speed: 2.5,
        damage: 1,
        attackRange: 200,
        attackCooldown: 800,
        canPassThroughObjects: true,
        points: 40
    },
    zombie: {
        name: 'Zombie',
        icon: '🧟‍♂️',
        health: 30,
        speed: 1.5,
        damage: 2,
        attackRange: 50,
        attackCooldown: 1500,
        points: 60
    },
    spider: {
        name: 'Spinne',
        icon: '🕷️',
        health: 25,
        speed: 3,
        damage: 2,
        attackRange: 80,
        attackCooldown: 1000,
        points: 55
    }
};

const LEVEL_CONFIG = [
    // World 1 - Gift
    { world: 0, level: 1, enemies: [{ type: 'skeleton', count: 3 }, { type: 'bat', count: 2 }] },
    { world: 0, level: 2, enemies: [{ type: 'skeleton', count: 4 }, { type: 'bat', count: 3 }] },
    { world: 0, level: 3, enemies: [{ type: 'skeleton', count: 5 }, { type: 'ghost', count: 2 }] },
    { world: 0, level: 4, enemies: [{ type: 'ghost', count: 3 }, { type: 'bat', count: 4 }] },
    { world: 0, level: 5, enemies: [{ type: 'bat', count: 5 }, { type: 'skeleton', count: 3 }, { type: 'ghost', count: 1 }] },
    // World 2 - Wasser
    { world: 1, level: 1, enemies: [{ type: 'zombie', count: 2 }, { type: 'skeleton', count: 3 }] },
    { world: 1, level: 2, enemies: [{ type: 'zombie', count: 3 }, { type: 'bat', count: 4 }] },
    { world: 1, level: 3, enemies: [{ type: 'spider', count: 2 }, { type: 'zombie', count: 2 }] },
    { world: 1, level: 4, enemies: [{ type: 'spider', count: 3 }, { type: 'ghost', count: 2 }] },
    { world: 1, level: 5, enemies: [{ type: 'zombie', count: 3 }, { type: 'spider', count: 2 }, { type: 'bat', count: 2 }] },
    // World 3 - Feuer
    { world: 2, level: 1, enemies: [{ type: 'zombie', count: 4 }, { type: 'spider', count: 2 }] },
    { world: 2, level: 2, enemies: [{ type: 'spider', count: 4 }, { type: 'zombie', count: 2 }] },
    { world: 2, level: 3, enemies: [{ type: 'zombie', count: 5 }, { type: 'ghost', count: 2 }] },
    { world: 2, level: 4, enemies: [{ type: 'spider', count: 4 }, { type: 'bat', count: 3 }] },
    { world: 2, level: 5, enemies: [{ type: 'zombie', count: 4 }, { type: 'spider', count: 3 }, { type: 'ghost', count: 1 }] }
];

const POWERS = {
    poison: { name: 'Giftschuss', icon: '☠️', description: 'Schüsse vergiften Gegner' },
    water: { name: 'Wasserwelle', icon: '💧', description: 'Erzeugt eine Wasserwelle' },
    fire: { name: 'Feuerball', icon: '🔥', description: 'Schießt Feuerbälle' },
    earth: { name: 'Erdstachel', icon: '⛰️', description: 'Schießt Erdstachel' },
    ice: { name: 'Gefrierung', icon: '❄️', description: 'Friert Gegner ein' },
    sand: { name: 'Sandsturm', icon: '🏜️', description: 'Erzeugt einen Sandsturm' },
    void: { name: 'Dimensionsloch', icon: '🌑', description: 'Öffnet ein Dimensionsloch' },
    thunder: { name: 'Blitzschlag', icon: '⚡', description: 'Schießt Blitze' },
    nature: { name: 'Dornenranken', icon: '🌲', description: 'Ranken greifen Gegner an' }
};

const GAME_STATE = {
    currentWorld: 0,
    currentLevel: 1,
    currentCharacter: null,
    playerName: 'Spieler',
    health: 100,
    maxHealth: 100,
    score: 0,
    powers: [],
    isPaused: false,
    musicEnabled: true,
    sfxEnabled: true
};

function getLevelConfig(world, level) {
    const worldOffset = world * GAME_CONFIG.levelsPerWorld;
    return LEVEL_CONFIG[worldOffset + level - 1] || LEVEL_CONFIG[0];
}

function getWorldConfig(world) {
    return GAME_CONFIG.worlds[world] || GAME_CONFIG.worlds[0];
}

function getCharacterConfig(character) {
    return GAME_CONFIG.characters[character] || GAME_CONFIG.characters.wizard;
}

function isWorldComplete(world) {
    return world * GAME_CONFIG.levelsPerWorld >= LEVEL_CONFIG.length;
}

function getNextLevelInfo(world, level) {
    const totalLevels = GAME_CONFIG.levelsPerWorld;
    if (level < totalLevels) {
        return { world, level: level + 1, isBoss: false };
    } else if (world < GAME_CONFIG.worlds.length - 1) {
        return { world: world + 1, level: 1, isBoss: true };
    } else {
        return { world, level, completed: true };
    }
}
