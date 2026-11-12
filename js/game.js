// Babylon.js Spielszene / Fallback 3D Renderer
let scene, engine, camera, light;
let monsterMeshes = {};
let minimap = null;
let simple3dScene = null;
let useFallbackRenderer = false;

function initializeBabylonScene() {
    const canvas = document.getElementById('renderCanvas');

    // Canvas-Größe setzen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Check if Babylon.js is available
    if (typeof BABYLON === 'undefined') {
        console.warn('Babylon.js nicht verfügbar, verwende Fallback 2D-Renderer');
        useFallbackRenderer = true;
        simple3dScene = new Simple3DScene('renderCanvas');
        renderFallback3DScene();
        return;
    }

    engine = new BABYLON.Engine(canvas, true);

    // Szene erstellen
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.15, 0.25, 0.35);
    scene.collisionsEnabled = true;

    // Kamera - Top-Down View
    camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 150, 0));
    camera.attachControl(canvas, true);
    camera.speed = 0;
    camera.inertia = 0.5;
    camera.angularSensibility = 1000;

    // Lichter
    light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0.5, 1, 0.5), scene);
    light.intensity = 1.3;

    const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(0, 150, 0), scene);
    light2.intensity = 1.0;
    light2.range = 800;

    // Arena-Boden
    createGround();

    // Monster erstellen
    createMonsters();

    // Eingabe-Listener
    setupInputListeners();

    // Game Loop
    engine.runRenderLoop(() => {
        if (!gameState.gamePaused) {
            updateGame();
        }
        scene.render();
        updateMinimap();
    });

    // Window Resize
    window.addEventListener('resize', () => {
        engine.resize();
    });
}

function renderFallback3DScene() {
    const playerTeam = gameState.getPlayerTeam();

    // Add player monsters
    if (playerTeam && playerTeam.monsters) {
        playerTeam.monsters.forEach((monster, index) => {
            const angle = (index / Math.max(playerTeam.monsters.length, 1)) * Math.PI * 2;
            const radius = 20;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const rarityConfig = GAME_CONFIG.RARITIES[monster.rarity];
            const rgb = hexToRGB(rarityConfig.color);
            const color = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

            simple3dScene.addMonster(x, z, color);
        });
    }

    // Add AI monsters (random positions)
    gameState.teams.forEach((team) => {
        if (team.id !== gameState.playerTeamId && team.monsters) {
            team.monsters.forEach((monster, index) => {
                const angle = Math.random() * Math.PI * 2;
                const radius = 50 + Math.random() * 100;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;

                const rarityConfig = GAME_CONFIG.RARITIES[monster.rarity];
                const rgb = hexToRGB(rarityConfig.color);
                const color = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

                simple3dScene.addMonster(x, z, color);
            });
        }
    });

    simple3dScene.animate();
}

function createGround() {
    const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);

    // Farben basierend auf Welt
    let color;
    switch(gameState.world) {
        case 'ice':
            color = new BABYLON.Color3(0.6, 0.85, 1.0);
            break;
        case 'fire':
            color = new BABYLON.Color3(1.0, 0.6, 0.2);
            break;
        case 'water':
            color = new BABYLON.Color3(0.3, 0.6, 1.0);
            break;
        case 'air':
            color = new BABYLON.Color3(0.8, 0.95, 1.0);
            break;
        case 'normal':
            color = new BABYLON.Color3(0.4, 0.7, 0.3);
            break;
        default:
            color = new BABYLON.Color3(0.6, 0.6, 0.6);
    }

    groundMaterial.diffuse = color;
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    const ground = BABYLON.MeshBuilder.CreateGround(
        'ground',
        { width: GAME_CONFIG.ARENA_SIZE * 3, height: GAME_CONFIG.ARENA_SIZE * 3 },
        scene
    );
    ground.material = groundMaterial;
    ground.checkCollisions = true;
}

function createMonsters() {
    const playerTeam = gameState.getPlayerTeam();

    // Spieler-Monster erstellen - mit besseren Positionen
    if (playerTeam && playerTeam.monsters) {
        playerTeam.monsters.forEach((monster, index) => {
            const mesh = BABYLON.MeshBuilder.CreateBox(
                `monster_${playerTeam.id}_${index}`,
                { size: 5 },
                scene
            );

            const material = new BABYLON.StandardMaterial(`monsterMat_${playerTeam.id}_${index}`, scene);
            const rarityConfig = GAME_CONFIG.RARITIES[monster.rarity];

            // Farbe basierend auf Seltenheit
            const rgb = hexToRGB(rarityConfig.color);
            material.diffuse = new BABYLON.Color3(rgb.r / 255, rgb.g / 255, rgb.b / 255);
            material.emissiveColor = new BABYLON.Color3(rgb.r / 255 * 0.3, rgb.g / 255 * 0.3, rgb.b / 255 * 0.3);

            mesh.material = material;

            // Position neben dem Spieler
            const angle = (index / Math.max(playerTeam.monsters.length, 1)) * Math.PI * 2;
            const radius = 20;
            mesh.position = new BABYLON.Vector3(
                Math.cos(angle) * radius,
                2.5,
                Math.sin(angle) * radius
            );

            mesh.checkCollisions = true;
            monsterMeshes[`${playerTeam.id}_${index}`] = mesh;
        });
    }
}

function hexToRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 128, g: 128, b: 128 };
}

function setupInputListeners() {
    document.getElementById('renderCanvas').addEventListener('click', (event) => {
        const canvas = document.getElementById('renderCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        console.log('Klick auf Arena:', x, y);
    });
}

function updateGame() {
    // Update Monster-Positionen (Babylon.js)
    if (!useFallbackRenderer && scene) {
        gameState.teams.forEach((team) => {
            if (team.monsters) {
                team.monsters.forEach((monster, index) => {
                    const meshKey = `${team.id}_${index}`;
                    if (monsterMeshes[meshKey]) {
                        const mesh = monsterMeshes[meshKey];
                        mesh.position = new BABYLON.Vector3(
                            monster.position.x,
                            2.5,
                            monster.position.z
                        );
                    }
                });
            }
        });
    }

    // Update HUD
    uiManager.updateHUD();

    // Überprüfe Kampfende
    checkGameEnd();
}

function updateMinimap() {
    const minimapCanvas = document.getElementById('minimapCanvas');
    if (!minimapCanvas) return;

    const ctx = minimapCanvas.getContext('2d');
    const scale = minimapCanvas.width / (GAME_CONFIG.ARENA_SIZE * 3.5);

    // Hintergrund
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // Border
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    const centerX = minimapCanvas.width / 2;
    const centerY = minimapCanvas.height / 2;

    // Teams zeichnen
    gameState.teams.forEach((team) => {
        if (team.alive && team.monsters && team.monsters.length > 0) {
            const isPlayerTeam = team.id === gameState.playerTeamId;
            const color = isPlayerTeam
                ? '#00d4ff'
                : `rgb(${Math.round(team.teamColor.r * 255)}, ${Math.round(team.teamColor.g * 255)}, ${Math.round(team.teamColor.b * 255)})`;

            const x = centerX + team.position.x * scale;
            const y = centerY + team.position.z * scale;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Spieler-Team hervorheben
            if (isPlayerTeam) {
                ctx.strokeStyle = '#00d4ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    });
}

function checkGameEnd() {
    const aliveTeams = gameState.teams.filter(t => t.alive && t.monsters && t.monsters.length > 0);

    if (aliveTeams.length === 1) {
        const winner = aliveTeams[0];
        const isPlayerWinner = winner.id === gameState.playerTeamId;

        gameState.gameActive = false;
        const message = isPlayerWinner
            ? '🎉 Du hast gewonnen!'
            : '💀 Du bist eliminiert!';

        uiManager.showGameOver(message);
    } else {
        const playerTeam = gameState.getPlayerTeam();
        if (!playerTeam || !playerTeam.alive || !playerTeam.monsters || playerTeam.monsters.length === 0) {
            gameState.gameActive = false;
            uiManager.showGameOver('💀 Alle deine Monster sind eliminiert!');
        }
    }
}

// Initialisierung beim Laden
window.addEventListener('load', () => {
    gameState.loadGameState();
});
