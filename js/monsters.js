// Monster-Definitionen
const MONSTERS = {
    // Eis-Welt Monster
    ice_dragon: {
        name: 'Eis-Drache',
        emoji: '🐉',
        world: 'ice',
        type: 'flying',
        baseStats: {
            hp: 120,
            damage: 15,
            speed: 8,
            range: 20
        },
        sound: 'ice_dragon_attack',
        description: 'Fliegender Drache mit Eiskräften - SELTENSTER!'
    },
    frost_golem: {
        name: 'Frost-Golem',
        emoji: '❄️',
        world: 'ice',
        type: 'ground',
        baseStats: {
            hp: 180,
            damage: 12,
            speed: 3,
            range: 8
        },
        sound: 'frost_golem_attack',
        description: 'Starker Eisen-Golem'
    },
    snow_wolf: {
        name: 'Schnee-Wolf',
        emoji: '🐺',
        world: 'ice',
        type: 'ground',
        baseStats: {
            hp: 100,
            damage: 18,
            speed: 10,
            range: 12
        },
        sound: 'snow_wolf_attack',
        description: 'Schneller und wendiger Wolf'
    },

    // Feuer-Welt Monster
    lava_elemental: {
        name: 'Lava-Elementar',
        emoji: '🔥',
        world: 'fire',
        type: 'ground',
        baseStats: {
            hp: 140,
            damage: 20,
            speed: 4,
            range: 18
        },
        sound: 'lava_elemental_attack',
        description: 'Heißer Elementar aus der Tiefe'
    },
    fire_phoenix: {
        name: 'Feuer-Phönix',
        emoji: '🦅',
        world: 'fire',
        type: 'flying',
        baseStats: {
            hp: 110,
            damage: 22,
            speed: 12,
            range: 16
        },
        sound: 'fire_phoenix_attack',
        description: 'Legendärer fliegender Phönix - SELTENSTER!'
    },
    inferno_imp: {
        name: 'Höllen-Imp',
        emoji: '😈',
        world: 'fire',
        type: 'ground',
        baseStats: {
            hp: 80,
            damage: 16,
            speed: 9,
            range: 14
        },
        sound: 'inferno_imp_attack',
        description: 'Kleiner aber gefährlicher Imp'
    },

    // Wasser-Welt Monster
    water_serpent: {
        name: 'Wasser-Schlange',
        emoji: '🐍',
        world: 'water',
        type: 'water',
        baseStats: {
            hp: 130,
            damage: 14,
            speed: 11,
            range: 15
        },
        sound: 'water_serpent_attack',
        description: 'Schnelle Wasserschlange'
    },
    frost_kraken: {
        name: 'Frost-Kraken',
        emoji: '🦑',
        world: 'water',
        type: 'water',
        baseStats: {
            hp: 200,
            damage: 18,
            speed: 5,
            range: 20
        },
        sound: 'frost_kraken_attack',
        description: 'Gigantische Wasserkrake'
    },
    bubble_fish: {
        name: 'Blasen-Fisch',
        emoji: '🐠',
        world: 'water',
        type: 'water',
        baseStats: {
            hp: 90,
            damage: 12,
            speed: 13,
            range: 10
        },
        sound: 'bubble_fish_attack',
        description: 'Schneller kleiner Fisch'
    },

    // Luft-Welt Monster
    wind_sprite: {
        name: 'Wind-Geist',
        emoji: '👻',
        world: 'air',
        type: 'flying',
        baseStats: {
            hp: 100,
            damage: 13,
            speed: 14,
            range: 12
        },
        sound: 'wind_sprite_attack',
        description: 'Schneller fliegender Geist'
    },
    storm_eagle: {
        name: 'Sturm-Adler',
        emoji: '🦅',
        world: 'air',
        type: 'flying',
        baseStats: {
            hp: 120,
            damage: 17,
            speed: 13,
            range: 18
        },
        sound: 'storm_eagle_attack',
        description: 'Majestetischer Sturm-Adler - SELTENSTER!'
    },
    cloud_bunny: {
        name: 'Wolken-Hase',
        emoji: '🐰',
        world: 'air',
        type: 'flying',
        baseStats: {
            hp: 85,
            damage: 11,
            speed: 15,
            range: 8
        },
        sound: 'cloud_bunny_attack',
        description: 'Verspielter fliegender Hase'
    }
};

// Monster-Klasse
class Monster {
    constructor(monsterType, rarity = 'common', teamId = 0) {
        const definition = MONSTERS[monsterType];
        if (!definition) throw new Error(`Unbekanntes Monster: ${monsterType}`);

        this.type = monsterType;
        this.rarity = rarity;
        this.teamId = teamId;
        this.name = definition.name;
        this.emoji = definition.emoji;
        this.world = definition.world;
        this.monsterType = definition.type; // ground, flying, water
        this.sound = definition.sound;
        this.description = definition.description;

        // Stats mit Seltenheits-Multiplikator anwenden
        const rarityConfig = GAME_CONFIG.RARITIES[rarity];
        this.baseStats = { ...definition.baseStats };

        this.hp = Math.round(this.baseStats.hp * rarityConfig.hpMultiplier);
        this.maxHp = this.hp;
        this.damage = Math.round(this.baseStats.damage * rarityConfig.damageMultiplier);
        this.speed = this.baseStats.speed * rarityConfig.speedMultiplier;
        this.range = this.baseStats.range * rarityConfig.rangeMultiplier;
        this.attackCooldown = GAME_CONFIG.MONSTER_BASE_STATS.attackCooldown;

        // Position
        this.position = { x: 0, y: 0, z: 0 };
        this.target = null;
        this.lastAttackTime = 0;

        // OG-Monster spezielle Fähigkeit
        if (rarity === 'og') {
            this.hasSpecialAbility = true;
            this.chargeLevel = 0;
            this.maxCharge = 100;
        }

        this.alive = true;
    }

    // Schaden nehmen
    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    // Angriff durchführen
    canAttack() {
        return (Date.now() - this.lastAttackTime) >= this.attackCooldown;
    }

    // Spezialfähigkeit aufladen (OG-Monster)
    chargeAbility(amount = 10) {
        if (this.hasSpecialAbility) {
            this.chargeLevel = Math.min(this.chargeLevel + amount, this.maxCharge);
        }
    }

    // Spezialfähigkeit verwenden
    useSpecialAbility() {
        if (this.hasSpecialAbility && this.chargeLevel >= this.maxCharge) {
            this.chargeLevel = 0;
            return true;
        }
        return false;
    }

    // Monster-Daten für Speichern
    toJSON() {
        return {
            type: this.type,
            rarity: this.rarity,
            teamId: this.teamId,
            hp: this.hp,
            maxHp: this.maxHp
        };
    }
}

// Drachen sind die seltensten Monster - nur in OG oder Legendär
const DRAGON_MONSTERS = ['ice_dragon', 'fire_phoenix', 'storm_eagle'];

// Funktion um zufällige Monster-Karte zu generieren
function generateMonsterCard() {
    const monsterKeys = Object.keys(MONSTERS);
    const randomMonsters = [];

    for (let i = 0; i < 3; i++) {
        const randomMonster = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
        const randomRarity = getRandomRarity(randomMonster);
        randomMonsters.push({
            type: randomMonster,
            rarity: randomRarity
        });
    }

    return randomMonsters;
}

// Zufällige Seltenheit mit Wahrscheinlichkeiten
function getRandomRarity(monsterType) {
    // Drachen sind nur in OG oder Legendär verfügbar
    if (DRAGON_MONSTERS.includes(monsterType)) {
        const random = Math.random() * 100;
        return random < 70 ? 'legendary' : 'og';
    }

    const rarities = ['common', 'rare', 'epic', 'mythic', 'legendary', 'og'];
    const weights = [40, 30, 15, 8, 5, 2]; // Prozentuale Verteilung

    const random = Math.random() * 100;
    let cumulative = 0;

    for (let i = 0; i < rarities.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
            return rarities[i];
        }
    }

    return 'common';
}
