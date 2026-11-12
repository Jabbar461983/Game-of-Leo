// Fallback 3D renderer using Canvas 2D if Babylon.js is not available
class Simple3DScene {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.monsters = [];
        this.rotation = 0;
        this.renderCount = 0;
    }

    getContext() {
        return this.canvas.getContext('2d');
    }

    addMonster(x, z, color, emoji, monsterName, rarity) {
        this.monsters.push({
            x,
            z,
            color,
            emoji,
            monsterName,
            rarity,
            size: 25
        });
    }

    render() {
        const ctx = this.getContext();
        if (!ctx) {
            console.error('❌ Canvas context ist null!');
            return;
        }

        this.renderCount++;
        const isFirstRender = this.renderCount === 1;

        // Clear canvas
        ctx.fillStyle = '#1f2e42';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const scale = 2;

        // Draw grid
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
        ctx.lineWidth = 1;
        for (let i = -500; i <= 500; i += 100) {
            ctx.beginPath();
            ctx.moveTo(centerX + i * scale, centerY - 500 * scale);
            ctx.lineTo(centerX + i * scale, centerY + 500 * scale);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(centerX - 500 * scale, centerY + i * scale);
            ctx.lineTo(centerX + 500 * scale, centerY + i * scale);
            ctx.stroke();
        }

        // Draw monsters
        if (this.monsters.length === 0) {
            if (isFirstRender) {
                console.warn('⚠️ Keine Monster zum Zeichnen!');
            }
            return;
        }

        this.monsters.forEach((monster, index) => {
            try {
                const screenX = centerX + monster.x * scale;
                const screenY = centerY + monster.z * scale;

                // Calculate pulsing size
                const pulse = Math.sin(this.rotation * 2 + index) * 3;
                const baseSize = monster.size + pulse;

                // Draw background circle
                ctx.fillStyle = monster.color + '40';
                ctx.beginPath();
                ctx.arc(screenX, screenY, baseSize, 0, Math.PI * 2);
                ctx.fill();

                // Draw border
                ctx.strokeStyle = monster.color;
                ctx.lineWidth = 3;
                ctx.stroke();

                // Draw emoji
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(monster.emoji, screenX, screenY);

                // Draw name
                ctx.font = 'bold 10px Arial';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillText(monster.monsterName, screenX, screenY + baseSize + 15);

                if (isFirstRender && index === 0) {
                    console.log(`✓ Monster ${index} gezeichnet:`, {
                        name: monster.monsterName,
                        emoji: monster.emoji,
                        screenX,
                        screenY,
                        color: monster.color
                    });
                }
            } catch (e) {
                console.error(`Fehler beim Zeichnen von Monster ${index}:`, e);
            }
        });

        // Draw center marker
        ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();

        if (isFirstRender) {
            console.log(`✓ Render() erfolgreich abgeschlossen! ${this.monsters.length} Monster gezeichnet`);
        }
    }

    animate() {
        this.rotation += 0.01;
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}
