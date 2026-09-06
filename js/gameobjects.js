class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.active = true;
    }

    update(deltaTime) {
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
    }

    draw(ctx) {}

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    collidesWith(other) {
        const a = this.getBounds();
        const b = other.getBounds();
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }
}

class Player extends GameObject {
    constructor(x, y, character) {
        super(x, y, 40, 40);
        this.character = getCharacterConfig(character);
        this.health = GAME_CONFIG.maxHealth;
        this.maxHealth = GAME_CONFIG.maxHealth;
        this.speed = this.character.speed * 100;
        this.direction = { x: 0, y: 0 };
        this.lastShotTime = 0;
        this.fireRate = this.character.fireRate;
        this.weapons = [this.character.weaponType];
        this.currentWeapon = 0;
        this.powers = [];
        this.isHidden = false;
        this.hideTimeout = 0;
        this.autoShootRange = 175;
        this.lastAutoShootTime = 0;
        this.autoShootCooldown = 100;
    }

    setDirection(x, y) {
        this.direction.x = x;
        this.direction.y = y;
        if (x !== 0 || y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            this.direction.x = x / length;
            this.direction.y = y / length;
        }
    }

    update(deltaTime, canvas, obstacles = []) {
        this.velocityX = this.direction.x * this.speed;
        this.velocityY = this.direction.y * this.speed;

        super.update(deltaTime, canvas);

        this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
        this.y = Math.max(0, Math.min(this.y, canvas.height - this.height));

        let inObstacle = false;
        for (let obstacle of obstacles) {
            if (this.collidesWith(obstacle)) {
                this.x -= this.velocityX * deltaTime;
                this.y -= this.velocityY * deltaTime;
                if (obstacle.type === 'bush') {
                    inObstacle = true;
                }
            }
        }

        if (inObstacle && !this.isHidden) {
            this.isHidden = true;
            this.hideTimeout = 999999;
        } else if (!inObstacle && this.hideTimeout === 999999) {
            this.isHidden = false;
            this.hideTimeout = 0;
        }

        const deltaMs = deltaTime * 1000;
        this.lastShotTime += deltaMs;
        this.lastAutoShootTime += deltaMs;

        if (this.hideTimeout > 0 && this.hideTimeout !== 999999) {
            this.hideTimeout -= deltaMs;
        } else if (this.hideTimeout <= 0 && this.hideTimeout !== 999999) {
            this.isHidden = false;
        }
    }

    canShoot() {
        return this.lastShotTime >= this.fireRate;
    }

    shoot() {
        if (this.canShoot()) {
            this.lastShotTime = 0;
            return true;
        }
        return false;
    }

    resetShotTimer() {
        this.lastShotTime = this.fireRate;
    }

    hide() {
        this.isHidden = true;
        this.hideTimeout = 3000;
    }

    takeDamage(amount) {
        if (!this.isHidden) {
            this.health -= amount;
            return true;
        }
        return false;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    draw(ctx, showAutoShootRange = false) {
        if (!this.active) return;

        ctx.save();

        if (this.isHidden) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#90EE90';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = '#3498db';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.character.icon, this.x + this.width / 2, this.y + this.height / 2);

        if (showAutoShootRange) {
            ctx.strokeStyle = 'rgba(100, 200, 100, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.autoShootRange, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Enemy extends GameObject {
    constructor(x, y, type) {
        const config = ENEMY_TYPES[type];
        super(x, y, 35, 35);
        this.type = type;
        this.config = config;
        this.health = config.health;
        this.maxHealth = config.health;
        this.speed = config.speed;
        this.damage = config.damage;
        this.lastAttackTime = config.attackCooldown;
        this.attackCooldown = config.attackCooldown;
        this.target = null;
        this.knockbackX = 0;
        this.knockbackY = 0;
    }

    moveToward(target, deltaTime, obstacles = []) {
        if (!target) return;

        if (target.isHidden) {
            this.moveRandomly(deltaTime);
            return;
        }

        const dx = target.x + target.width / 2 - (this.x + this.width / 2);
        const dy = target.y + target.height / 2 - (this.y + this.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.velocityX = (dx / dist) * this.speed * deltaTime * 1000;
            this.velocityY = (dy / dist) * this.speed * deltaTime * 1000;
        } else {
            this.velocityX *= 0.9;
            this.velocityY *= 0.9;
        }

        this.knockbackX *= 0.92;
        this.knockbackY *= 0.92;

        this.velocityX += this.knockbackX;
        this.velocityY += this.knockbackY;
    }

    moveRandomly(deltaTime) {
        if (!this.randomMoveTimer || this.randomMoveTimer <= 0) {
            const angle = Math.random() * Math.PI * 2;
            this.velocityX = Math.cos(angle) * this.speed * deltaTime * 1000;
            this.velocityY = Math.sin(angle) * this.speed * deltaTime * 1000;
            this.randomMoveTimer = 2000;
        } else {
            this.randomMoveTimer -= deltaTime * 1000;
        }
    }

    canAttack() {
        return this.lastAttackTime >= this.attackCooldown;
    }

    attack() {
        if (this.canAttack()) {
            this.lastAttackTime = 0;
            return true;
        }
        return false;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.knockbackX -= amount * 0.5;
        this.hitBlink = 150;
        return this.health <= 0;
    }

    update(deltaTime, player, obstacles = []) {
        super.update(deltaTime);
        const deltaMs = deltaTime * 1000;
        this.lastAttackTime += deltaMs;
        this.hitBlink = Math.max(0, (this.hitBlink || 0) - deltaMs);

        if (player && player.active) {
            this.moveToward(player, deltaTime, obstacles);
        }

        for (let obstacle of obstacles) {
            if (this.collidesWith(obstacle)) {
                this.x -= this.velocityX * deltaTime;
                this.y -= this.velocityY * deltaTime;
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        const blinkVisible = !this.hitBlink || Math.sin(this.hitBlink * 0.02) > 0;
        if (!blinkVisible) {
            ctx.globalAlpha = 0.3;
        }

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.icon, this.x + this.width / 2, this.y + this.height / 2);

        ctx.globalAlpha = 1;
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = healthPercent > 0.5 ? '#27ae60' : (healthPercent > 0.25 ? '#f39c12' : '#e74c3c');
        ctx.fillRect(this.x, this.y - 10, this.width * healthPercent, 6);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y - 10, this.width, 6);

        ctx.restore();
    }
}

class Projectile extends GameObject {
    constructor(x, y, velocityX, velocityY, damage, type = 'bolt') {
        super(x, y, 12, 12);
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.damage = damage;
        this.type = type;
        this.lifeTime = 5000;
        this.aliveTime = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.aliveTime += deltaTime * 1000;

        if (this.aliveTime >= this.lifeTime) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        const angle = Math.atan2(this.velocityY, this.velocityX);

        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(angle);

        if (this.type === 'bolt') {
            ctx.fillStyle = '#ffed4e';
            ctx.fillRect(-8, -6, 16, 12);
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 2;
            ctx.strokeRect(-8, -6, 16, 12);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-5, -3, 10, 6);
        } else if (this.type === 'coin') {
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.arc(0, 0, this.width + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#e67e22';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💰', 0, 0);
        } else if (this.type === 'sword') {
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(-10, -4, 20, 8);
            ctx.strokeStyle = '#7f8c8d';
            ctx.lineWidth = 2;
            ctx.strokeRect(-10, -4, 20, 8);
        }

        ctx.restore();
    }
}

class PowerUp extends GameObject {
    constructor(x, y, type) {
        super(x, y, 30, 30);
        this.type = type;
        this.floatTime = 0;
        this.floatOffset = 0;
    }

    update(deltaTime) {
        this.floatTime += deltaTime;
        this.floatOffset = Math.sin(this.floatTime / 300) * 5;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        ctx.fillStyle = '#2ecc71';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.width / 2 + this.floatOffset, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (this.type === 'sandwich') {
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText('🥪', this.x + this.width / 2, this.y + this.height / 2 + this.floatOffset);
        }

        ctx.restore();
    }
}

class AirDrop extends GameObject {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.velocityY = 150;
        this.velocityX = 80;
        this.landed = false;
        this.planeX = -100;
        this.planeY = 50;
        this.hasPlane = true;
        this.droppedAt = null;
    }

    update(deltaTime, canvas) {
        if (this.hasPlane) {
            this.planeX += this.velocityX * deltaTime;
            if (this.planeX > this.x && !this.droppedAt) {
                this.droppedAt = true;
                this.hasPlane = false;
            }
            this.x = this.planeX;
            this.y = this.planeY;
        } else if (!this.landed) {
            super.update(deltaTime);
            if (this.y + this.height >= canvas.height - 50) {
                this.landed = true;
                this.velocityY = 0;
                this.velocityX = 0;
                this.y = canvas.height - 50 - this.height;
            }
        }
    }

    draw(ctx) {
        ctx.save();

        if (this.hasPlane) {
            ctx.font = '28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✈️', this.x, this.y - 20);
        }

        ctx.fillStyle = '#34495e';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📦', this.x + this.width / 2, this.y + this.height / 2);

        ctx.restore();
    }
}

class Obstacle extends GameObject {
    constructor(x, y, width, height, type = 'bush') {
        super(x, y, width, height);
        this.type = type;
    }

    draw(ctx) {
        ctx.save();

        if (this.type === 'bush') {
            ctx.fillStyle = '#27ae60';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#229954';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.type === 'rock') {
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#7f8c8d';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore();
    }
}

class Portal extends GameObject {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.rotationAngle = 0;
        this.pulseTime = 0;
    }

    update(deltaTime) {
        this.rotationAngle += deltaTime * 2;
        this.pulseTime += deltaTime;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotationAngle);

        const pulse = 1 + Math.sin(this.pulseTime * 5) * 0.2;
        ctx.scale(pulse, pulse);

        ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#64c8ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText('🚪', 0, 0);

        ctx.restore();
    }
}

class Boss extends Enemy {
    constructor(x, y, worldConfig) {
        super(x, y, 'zombie');
        this.width = 60;
        this.height = 60;
        this.worldConfig = worldConfig;
        this.health = 200;
        this.maxHealth = 200;
        this.attackPattern = 0;
        this.attackTimer = 0;
        this.speed = 1.5;
        this.isBoss = true;
        this.damage = 5;
        this.attackCooldown = 500;
        this.lastAttackTime = 500;
        this.hitBlink = 0;
    }

    getAttackPattern() {
        return Math.floor(this.attackPattern) % 3;
    }

    attack() {
        if (this.canAttack()) {
            this.lastAttackTime = 0;
            this.attackPattern += 1;
            return this.getAttackPattern();
        }
        return -1;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        const blinkVisible = !this.hitBlink || Math.sin(this.hitBlink * 0.02) > 0;
        if (!blinkVisible) {
            ctx.globalAlpha = 0.3;
        }

        ctx.fillStyle = this.worldConfig.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👹', this.x + this.width / 2, this.y + this.height / 2);

        ctx.globalAlpha = 1;
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = healthPercent > 0.5 ? '#27ae60' : (healthPercent > 0.25 ? '#f39c12' : '#e74c3c');
        ctx.fillRect(this.x, this.y - 15, this.width * healthPercent, 10);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y - 15, this.width, 10);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(Math.ceil(this.health) + '/' + this.maxHealth, this.x + this.width / 2, this.y - 10);

        ctx.restore();
    }
}
