class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.obstacles = [];
        this.airDrops = [];

        this.currentWorld = 0;
        this.currentLevel = 1;
        this.isBossLevel = false;
        this.boss = null;

        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.touchControls = { x: this.width / 2, y: this.height / 2 };

        this.lastFrameTime = Date.now();
        this.lastAirDropSchedule = Date.now();
        this.isPaused = false;
        this.levelComplete = false;
        this.gameOver = false;
        this.score = 0;

        this.setupInputListeners();
        this.generateLevel();
    }

    setupInputListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('click', () => {
            if (!this.isPaused && !this.levelComplete && !this.gameOver) {
                this.playerShoot();
            }
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.touchControls.x = touch.clientX - rect.left;
            this.touchControls.y = touch.clientY - rect.top;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.touchControls.x = touch.clientX - rect.left;
            this.touchControls.y = touch.clientY - rect.top;
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.togglePause();
            if (e.key === 'e') this.toggleHide();
        });
    }

    generateLevel() {
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.obstacles = [];
        this.airDrops = [];
        this.levelComplete = false;
        this.score = 0;
        this.airDropScheduled = false;
        this.airDropCount = 0;
        this.maxAirDropsPerLevel = 1;

        const levelConfig = getLevelConfig(this.currentWorld, this.currentLevel);
        const worldConfig = getWorldConfig(this.currentWorld);

        if (this.player === null) {
            this.player = new Player(this.width / 2, this.height - 100, GAME_STATE.currentCharacter);
        } else {
            this.player.health = this.player.maxHealth;
            this.player.x = this.width / 2;
            this.player.y = this.height - 100;
        }

        this.generateObstacles();

        if (this.currentLevel === GAME_CONFIG.levelsPerWorld) {
            this.generateBoss(worldConfig);
            this.isBossLevel = true;
        } else {
            this.generateEnemies(levelConfig);
            this.isBossLevel = false;
        }

        this.scheduleAirDrop();
    }

    generateEnemies(levelConfig) {
        this.enemies = [];
        levelConfig.enemies.forEach(enemyGroup => {
            for (let i = 0; i < enemyGroup.count; i++) {
                const x = Math.random() * (this.width - 50) + 25;
                const y = Math.random() * (this.height * 0.4) + 50;
                const enemy = new Enemy(x, y, enemyGroup.type);
                this.enemies.push(enemy);
            }
        });
    }

    generateBoss(worldConfig) {
        const x = this.width / 2;
        const y = 150;
        this.boss = new Boss(x, y, worldConfig);
    }

    generateObstacles() {
        this.obstacles = [];
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * (this.width - 60) + 30;
            const y = Math.random() * (this.height - 200) + 100;
            const type = Math.random() > 0.5 ? 'bush' : 'rock';
            const width = 50 + Math.random() * 30;
            const height = 40 + Math.random() * 30;
            this.obstacles.push(new Obstacle(x, y, width, height, type));
        }
    }

    scheduleAirDrop() {
        if (this.airDropScheduled || this.airDropCount >= this.maxAirDropsPerLevel) return;
        this.airDropScheduled = true;

        setTimeout(() => {
            if (!this.levelComplete && !this.gameOver && this.airDropCount < this.maxAirDropsPerLevel) {
                this.airDrops.push(new AirDrop(-100, 50));
                this.airDropCount++;
                this.airDropScheduled = false;
            }
        }, 15000 + Math.random() * 10000);
    }

    generateBoss(worldConfig) {
        const x = this.width / 2;
        const y = 100;
        this.boss = new Boss(x, y, worldConfig);
    }

    handlePlayerInput() {
        const moveX = (this.keys['arrowleft'] || this.keys['a'] ? -1 : 0) +
                      (this.keys['arrowright'] || this.keys['d'] ? 1 : 0);
        const moveY = (this.keys['arrowup'] || this.keys['w'] ? -1 : 0) +
                      (this.keys['arrowdown'] || this.keys['s'] ? 1 : 0);

        if (moveX !== 0 || moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            this.player.setDirection(moveX / length, moveY / length);
        } else {
            this.player.setDirection(0, 0);
        }
    }

    playerShoot(targetX = null, targetY = null) {
        if (!this.player || this.player.health <= 0) return false;

        if (!this.player.canShoot()) return false;

        this.player.lastShotTime = 0;

        const dx = (targetX !== null ? targetX : this.mouseX) - this.player.x;
        const dy = (targetY !== null ? targetY : this.mouseY) - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const projectile = new Projectile(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                (dx / dist) * 350,
                (dy / dist) * 350,
                this.player.character.damage,
                this.player.character.weaponType
            );
            this.projectiles.push(projectile);
            return true;
        }
        return false;
    }

    updateAutoShoot() {
        if (!this.player || this.player.health <= 0) return;

        let closestEnemy = null;
        let closestDistance = this.player.autoShootRange;

        if (this.isBossLevel && this.boss && this.boss.active) {
            const dx = this.boss.x - this.player.x;
            const dy = this.boss.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < closestDistance) {
                closestEnemy = this.boss;
                closestDistance = distance;
            }
        } else {
            for (let enemy of this.enemies) {
                if (enemy.active) {
                    const dx = enemy.x - this.player.x;
                    const dy = enemy.y - this.player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < closestDistance) {
                        closestEnemy = enemy;
                        closestDistance = distance;
                    }
                }
            }
        }

        if (closestEnemy && this.player.lastAutoShootTime >= this.player.autoShootCooldown) {
            this.playerShoot(
                closestEnemy.x + closestEnemy.width / 2,
                closestEnemy.y + closestEnemy.height / 2
            );
            this.player.lastAutoShootTime = 0;
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pause-menu').classList.toggle('hidden');
    }

    resume() {
        this.isPaused = false;
        document.getElementById('pause-menu').classList.add('hidden');
    }

    toggleHide() {
        if (this.player && !this.player.isHidden) {
            this.player.hide();
        }
    }

    update(deltaTime) {
        if (this.isPaused || this.levelComplete || this.gameOver) return;

        this.handlePlayerInput();
        this.player.update(deltaTime, this.canvas);
        this.updateAutoShoot();

        for (let projectile of this.projectiles) {
            projectile.update(deltaTime);
        }
        this.projectiles = this.projectiles.filter(p => p.active);

        if (this.isBossLevel && this.boss) {
            this.boss.update(deltaTime, this.player);
            this.updateBossAttack();
        } else {
            for (let enemy of this.enemies) {
                enemy.update(deltaTime, this.player);
            }
        }

        for (let powerUp of this.powerUps) {
            powerUp.update(deltaTime);
        }

        for (let airDrop of this.airDrops) {
            airDrop.update(deltaTime, this.canvas);
        }

        this.checkCollisions();
        this.checkLevelComplete();
    }

    updateBossAttack() {
        const pattern = this.boss.attack();
        if (pattern >= 0) {
            this.createBossAttack(pattern);
        }
    }

    createBossAttack(pattern) {
        const x = this.boss.x + this.boss.width / 2;
        const y = this.boss.y + this.boss.height / 2;
        const dx = this.player.x - x;
        const dy = this.player.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const speed = 200;
            for (let i = 0; i < (pattern + 1) * 2; i++) {
                const angle = (Math.PI * 2 / ((pattern + 1) * 2)) * i;
                const projectile = new Projectile(
                    x, y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    2,
                    'bolt'
                );
                this.projectiles.push(projectile);
            }
        }
    }

    checkCollisions() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (!projectile.active) continue;

            if (this.isBossLevel && this.boss && this.boss.active && projectile.collidesWith(this.boss)) {
                if (this.boss.takeDamage(projectile.damage)) {
                    this.boss.active = false;
                    this.completeLevel(true);
                    this.score += 500;
                }
                projectile.active = false;
                continue;
            }

            let hitEnemy = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (enemy.active && projectile.collidesWith(enemy)) {
                    if (enemy.takeDamage(projectile.damage)) {
                        this.score += ENEMY_TYPES[enemy.type].points;
                        enemy.active = false;
                    }
                    projectile.active = false;
                    hitEnemy = true;
                    break;
                }
            }
            if (hitEnemy) continue;

            for (let obstacle of this.obstacles) {
                if (projectile.collidesWith(obstacle)) {
                    projectile.active = false;
                    break;
                }
            }
        }
        this.projectiles = this.projectiles.filter(p => p.active);
        this.enemies = this.enemies.filter(e => e.active);

        for (let enemy of this.enemies) {
            if (enemy.active && enemy.collidesWith(this.player)) {
                if (enemy.canAttack()) {
                    this.player.takeDamage(enemy.damage);
                    enemy.lastAttackTime = 0;
                    if (this.player.health <= 0) {
                        this.endGame();
                    }
                }
            }
        }

        if (this.isBossLevel && this.boss && this.boss.active && this.boss.collidesWith(this.player)) {
            if (this.boss.canAttack()) {
                this.player.takeDamage(this.boss.damage);
                this.boss.lastAttackTime = 0;
                if (this.player.health <= 0) {
                    this.endGame();
                }
            }
        }

        for (let powerUp of this.powerUps) {
            if (powerUp.collidesWith(this.player)) {
                this.player.heal(20);
                this.score += 100;
                powerUp.active = false;
            }
        }
        this.powerUps = this.powerUps.filter(p => p.active);

        for (let airDrop of this.airDrops) {
            if (airDrop.collidesWith(this.player) && airDrop.landed) {
                this.createPowerUp(airDrop.x, airDrop.y);
                airDrop.active = false;
            }
        }
        this.airDrops = this.airDrops.filter(a => a.active);

        for (let projectile of this.projectiles) {
            for (let obstacle of this.obstacles) {
                if (projectile.collidesWith(obstacle)) {
                    projectile.active = false;
                }
            }
        }
    }

    createPowerUp(x, y) {
        this.powerUps.push(new PowerUp(x, y, 'sandwich'));
    }

    checkLevelComplete() {
        const enemiesLeft = this.enemies.filter(e => e.active).length;
        const bossAlive = this.isBossLevel && this.boss && this.boss.active;

        if (enemiesLeft === 0 && !bossAlive) {
            this.completeLevel(false);
        }

        document.getElementById('enemies-left').textContent = enemiesLeft + (bossAlive ? 1 : 0);
        document.getElementById('health').textContent = Math.ceil(this.player.health) + '/' + this.player.maxHealth;
        document.getElementById('score').textContent = this.score;
    }

    completeLevel(isBoss) {
        this.levelComplete = true;
        document.getElementById('level-complete').classList.remove('hidden');

        if (isBoss) {
            document.getElementById('boss-defeated').classList.remove('hidden');
            document.getElementById('level-complete').classList.add('hidden');
        }
    }

    nextLevel() {
        const nextInfo = getNextLevelInfo(this.currentWorld, this.currentLevel);

        if (nextInfo.completed) {
            alert('Gratuliere! Du hast alle Welten besiegt!');
            window.location.href = 'index.html';
        } else {
            this.currentWorld = nextInfo.world;
            this.currentLevel = nextInfo.level;
            this.generateLevel();

            document.getElementById('level-complete').classList.add('hidden');
            document.getElementById('boss-defeated').classList.add('hidden');
            document.getElementById('world').textContent = this.currentWorld + 1;
            document.getElementById('level').textContent = this.currentLevel;
            document.getElementById('level-title').textContent = `${getWorldConfig(this.currentWorld).name} - Level ${this.currentLevel}`;
        }
    }

    endGame() {
        this.gameOver = true;
        const worldConfig = getWorldConfig(this.currentWorld);
        leaderboard.addEntry(GAME_STATE.playerName, this.currentWorld, this.currentLevel, GAME_STATE.currentCharacter);
        document.getElementById('final-level').textContent = worldConfig.name + ' - Level ' + this.currentLevel;
        document.getElementById('game-over').classList.remove('hidden');
    }

    restart() {
        this.currentWorld = 0;
        this.currentLevel = 1;
        this.generateLevel();

        document.getElementById('game-over').classList.add('hidden');
        this.gameOver = false;
    }

    draw() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const worldConfig = getWorldConfig(this.currentWorld);
        this.ctx.fillStyle = worldConfig.color;
        this.ctx.globalAlpha = 0.05;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalAlpha = 1;

        for (let obstacle of this.obstacles) {
            obstacle.draw(this.ctx);
        }

        for (let projectile of this.projectiles) {
            projectile.draw(this.ctx);
        }

        for (let airDrop of this.airDrops) {
            airDrop.draw(this.ctx);
        }

        for (let powerUp of this.powerUps) {
            powerUp.draw(this.ctx);
        }

        for (let enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        if (this.isBossLevel && this.boss) {
            this.boss.draw(this.ctx);
        }

        this.player.draw(this.ctx);

        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    gameLoop() {
        const now = Date.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        this.gameLoop();
    }
}

let game = null;

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        game = new Game(canvas);
        game.start();

        const worldConfig = getWorldConfig(GAME_STATE.currentWorld);
        document.getElementById('world').textContent = GAME_STATE.currentWorld + 1;
        document.getElementById('level').textContent = GAME_STATE.currentLevel;
        document.getElementById('level-title').textContent = `${worldConfig.name} - Level ${GAME_STATE.currentLevel}`;
    }
});

function goToMenu() {
    window.location.href = 'index.html';
}
