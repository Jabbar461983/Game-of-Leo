// Babylon.js Spielszene
let scene, engine, camera, light;
let monsterMeshes = {};
let minimap = null;

function initializeBabylonScene() {
    const canvas = document.getElementById('renderCanvas');
    engine = new BABYLON.Engine(canvas, true);

    // Szene erstellen
    scene = new BABYLON.Scene(engine);
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());
    scene.collisionsEnabled = true;

    // Kamera - Top-Down View
    camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 200, 0));
    camera.attachControl(canvas, true);
    camera.speed = 0;
    camera.angularSensibility = 1000;

    // Licht
    light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 1), scene);
    light.intensity = 1.0;

    const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(0, 100, 0), scene);
    light2.intensity = 0.8;

    // Skybox (je nach Welt)
    createSkybox();

    // Arena-Boden
    createGround();

    // Welt-spezifische Objekte
    createWorldElements();

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

function createSkybox() {
    const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
    skyboxMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.7, 0.9);

    const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 2000 }, scene);
    skybox.material = skyboxMaterial;
}

function createGround() {
    const worldConfig = GAME_CONFIG.WORLDS[gameState.world];

    const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
    groundMaterial.diffuse = new BABYLON.Color3(
        worldConfig.color.charCodeAt(0) / 255,
        worldConfig.color.charCodeAt(1) / 255,
        worldConfig.color.charCodeAt(2) / 255
    );

    const ground = BABYLON.MeshBuilder.CreateGround(
        'ground',
        { width: GAME_CONFIG.ARENA_SIZE * 2, height: GAME_CONFIG.ARENA_SIZE * 2 },
        scene
    );
    ground.material = groundMaterial;
    ground.checkCollisions = true;
}

function createWorldElements() {
    const worldConfig = GAME_CONFIG.WORLDS[gameState.world];

    // Dekorative Elemente basierend auf Welt
    for (let i = 0; i < 10; i++) {
        const x = (Math.random() - 0.5) * GAME_CONFIG.ARENA_SIZE * 1.5;
        const z = (Math.random() - 0.5) * GAME_CONFIG.ARENA_SIZE * 1.5;

        let sphere = BABYLON.MeshBuilder.CreateSphere('rock' + i, { diameter: 10 }, scene);
        sphere.position = new BABYLON.Vector3(x, 5, z);

        let material = new BABYLON.StandardMaterial('rockMat' + i, scene);
        material.diffuse = new BABYLON.Color3(0.5, 0.5, 0.5);
        sphere.material = material;
    }
}

function createMonsters() {
    const playerTeam = gameState.getPlayerTeam();

    // Spieler-Monster erstellen
    playerTeam.monsters.forEach((monster, index) => {
        const mesh = BABYLON.MeshBuilder.CreateBox(
            `monster_${playerTeam.id}_${index}`,
            { size: 2 },
            scene
        );

        const material = new BABYLON.StandardMaterial(`monsterMat_${playerTeam.id}_${index}`, scene);
        const rarityConfig = GAME_CONFIG.RARITIES[monster.rarity];

        // Farbe basierend auf Seltenheit
        const rgb = BABYLON.Color3.FromHexString(rarityConfig.color);
        material.diffuse = rgb;
        material.emissiveColor = rgb.scale(0.3);

        mesh.material = material;
        mesh.position = new BABYLON.Vector3(
            monster.position.x,
            2,
            monster.position.z
        );

        mesh.checkCollisions = true;
        monsterMeshes[`${playerTeam.id}_${index}`] = mesh;
    });

    // KI-Teams
    gameState.teams.forEach((team) => {
        if (team.isAI) {
            team.monsters.forEach((monster, index) => {
                const mesh = BABYLON.MeshBuilder.CreateBox(
                    `monster_${team.id}_${index}`,
                    { size: 2 },
                    scene
                );

                const material = new BABYLON.StandardMaterial(`monsterMat_${team.id}_${index}`, scene);
                material.diffuse = new BABYLON.Color3(
                    team.teamColor.r,
                    team.teamColor.g,
                    team.teamColor.b
                );

                mesh.material = material;
                mesh.position = new BABYLON.Vector3(
                    monster.position.x,
                    2,
                    monster.position.z
                );

                mesh.checkCollisions = true;
                monsterMeshes[`${team.id}_${index}`] = mesh;
            });
        }
    });
}

function setupInputListeners() {
    document.getElementById('renderCanvas').addEventListener('click', (event) => {
        const canvas = document.getElementById('renderCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Raycast
        const ray = BABYLON.Ray.CreateNew(camera.position, camera.getDirection(BABYLON.Axis.Z), 500);
        const hit = scene.pickWithRay(ray, (mesh) => {
            return mesh.name.startsWith('monster_');
        });

        if (hit && hit.hit) {
            console.log('Clicked on:', hit.pickedMesh.name);
            // TODO: Monster-Aktion
        } else {
            // Boden geklickt - Monster dorthin bewegen
            console.log('Clicked ground at:', x, y);
            // TODO: Bewegungs-Befehl
        }
    });
}

function updateGame() {
    // Update Monster-Positionen
    gameState.teams.forEach((team) => {
        team.monsters.forEach((monster, index) => {
            const meshKey = `${team.id}_${index}`;
            if (monsterMeshes[meshKey]) {
                const mesh = monsterMeshes[meshKey];
                mesh.position = new BABYLON.Vector3(
                    monster.position.x,
                    2,
                    monster.position.z
                );
            }
        });
    });

    // Update HUD
    uiManager.updateHUD();

    // Überprüfe Kampfende
    checkGameEnd();
}

function updateMinimap() {
    const minimapCanvas = document.getElementById('minimapCanvas');
    if (!minimapCanvas) return;

    const ctx = minimapCanvas.getContext('2d');
    const scale = minimapCanvas.width / (GAME_CONFIG.ARENA_SIZE * 2.5);

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
        if (team.alive && team.monsters.length > 0) {
            const isPlayerTeam = team.id === gameState.playerTeamId;
            const color = isPlayerTeam
                ? '#00d4ff' // Blau für Spieler
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
    const aliveTeams = gameState.teams.filter(t => t.alive && t.monsters.length > 0);

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
        if (!playerTeam.alive || playerTeam.monsters.length === 0) {
            gameState.gameActive = false;
            uiManager.showGameOver('💀 Alle deine Monster sind eliminiert!');
        }
    }
}

// Initialisierung beim Laden
window.addEventListener('load', () => {
    gameState.loadGameState();
});
