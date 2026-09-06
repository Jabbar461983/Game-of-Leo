document.addEventListener('DOMContentLoaded', () => {
    const btnPlay = document.getElementById('btn-play');
    const btnLeaderboard = document.getElementById('btn-leaderboard');
    const btnSettings = document.getElementById('btn-settings');

    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            document.getElementById('character-select').classList.remove('hidden');
        });
    }

    if (btnLeaderboard) {
        btnLeaderboard.addEventListener('click', showLeaderboard);
    }

    if (btnSettings) {
        btnSettings.addEventListener('click', showSettings);
    }

    const characterCards = document.querySelectorAll('.character-card');
    characterCards.forEach(card => {
        card.addEventListener('click', () => {
            const character = card.getAttribute('data-character');
            selectCharacter(character);
        });

        const button = card.querySelector('.select-btn');
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const character = card.getAttribute('data-character');
            selectCharacter(character);
        });
    });

    leaderboard.loadFromStorage();
    updateLeaderboardDisplay();
});

function selectCharacter(character) {
    GAME_STATE.currentCharacter = character;
    GAME_STATE.currentWorld = 0;
    GAME_STATE.currentLevel = 1;

    window.location.href = 'game.html';
}

function showLeaderboard() {
    document.getElementById('leaderboard-modal').classList.remove('hidden');
    updateLeaderboardDisplay();
}

function closeLeaderboard() {
    document.getElementById('leaderboard-modal').classList.add('hidden');
}

function showSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
    const nameInput = document.getElementById('player-name');
    const musicToggle = document.getElementById('music-toggle');
    const sfxToggle = document.getElementById('sfx-toggle');

    nameInput.value = GAME_STATE.playerName;
    musicToggle.checked = GAME_STATE.musicEnabled;
    sfxToggle.checked = GAME_STATE.sfxEnabled;
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function saveSettings() {
    const nameInput = document.getElementById('player-name');
    const musicToggle = document.getElementById('music-toggle');
    const sfxToggle = document.getElementById('sfx-toggle');

    GAME_STATE.playerName = nameInput.value || 'Spieler';
    GAME_STATE.musicEnabled = musicToggle.checked;
    GAME_STATE.sfxEnabled = sfxToggle.checked;

    closeSettings();
}

function updateLeaderboardDisplay() {
    const entries = leaderboard.getTopEntries(100);
    const container = document.getElementById('leaderboard-entries');

    if (entries.length === 0) {
        container.innerHTML = '<div class="empty-leaderboard">Noch keine Einträge. Spiele das Spiel!</div>';
        return;
    }

    container.innerHTML = '';
    entries.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'leaderboard-entry';
        div.innerHTML = `
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-name">${escapeHtml(entry.playerName)}</div>
            <div class="leaderboard-character">${entry.characterIcon}</div>
            <div class="leaderboard-level">${entry.worldName} - ${entry.level}</div>
            <div class="leaderboard-date">${new Date(entry.date).toLocaleDateString('de-CH')}</div>
        `;
        container.appendChild(div);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const leaderboard = document.getElementById('leaderboard-modal');
        const settings = document.getElementById('settings-modal');
        const characterSelect = document.getElementById('character-select');

        if (!leaderboard.classList.contains('hidden')) {
            closeLeaderboard();
        } else if (!settings.classList.contains('hidden')) {
            closeSettings();
        } else if (!characterSelect.classList.contains('hidden')) {
            characterSelect.classList.add('hidden');
        }
    }
});
