class AudioManager {
    constructor() {
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.sounds = {};
        this.music = null;
        this.loadSettings();
    }

    loadSettings() {
        this.musicEnabled = GAME_STATE.musicEnabled;
        this.sfxEnabled = GAME_STATE.sfxEnabled;
    }

    playSound(name) {
        if (!this.sfxEnabled) return;
        console.log('Sound:', name);
    }

    playMusic(name) {
        if (!this.musicEnabled) return;
        console.log('Music:', name);
    }

    stopMusic() {
        if (this.music) {
            console.log('Music stopped');
        }
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        GAME_STATE.musicEnabled = enabled;
        localStorage.setItem('gameOfLeo_music', enabled);
    }

    setSfxEnabled(enabled) {
        this.sfxEnabled = enabled;
        GAME_STATE.sfxEnabled = enabled;
        localStorage.setItem('gameOfLeo_sfx', enabled);
    }
}

const audio = new AudioManager();
