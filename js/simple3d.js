// Fallback 3D renderer using Canvas 2D if Babylon.js is not available
class Simple3DScene {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.monsters = [];
        this.rotation = 0;
    }

    addMonster(x, z, color) {
        this.monsters.push({ x, z, color, size: 20 });
    }

    render() {
        // Clear canvas with dark blue
        this.ctx.fillStyle = '#1f2e42';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const scale = 2;

        // Draw ground grid
        this.ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
        this.ctx.lineWidth = 1;
        for (let i = -500; i <= 500; i += 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + i * scale, centerY - 500 * scale);
            this.ctx.lineTo(centerX + i * scale, centerY + 500 * scale);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 500 * scale, centerY + i * scale);
            this.ctx.lineTo(centerX + 500 * scale, centerY + i * scale);
            this.ctx.stroke();
        }

        // Draw monsters
        this.monsters.forEach(monster => {
            const screenX = centerX + monster.x * scale;
            const screenY = centerY + monster.z * scale;

            // Draw monster as circle
            this.ctx.fillStyle = monster.color;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, monster.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw outline
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        // Draw center marker
        this.ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    animate() {
        this.rotation += 0.01;
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}
