class MedievalAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.currentMode = 'none';
        this.intensity = 0;
        this.isUrgentTempo = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopMusic();
        } else if (this.currentMode !== 'none') {
            this.startMusic(this.currentMode, this.intensity);
        }
        return this.muted;
    }

    stopMusic() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    /* ------------------------------------------------------------------------
       TRILHA SONORA PROCEDURAL E ADAPTATIVA
       ------------------------------------------------------------------------ */
    startMusic(mode, intensity = 0) {
        this.init();
        this.currentMode = mode;
        this.intensity = intensity;
        this.isUrgentTempo = false;
        this.stopMusic();
        if (this.muted) return;

        this.bgmStep = 0;
        const regionTempos = [430, 355, 295, 240, 190];
        const baseTempo = regionTempos[Math.min(intensity, regionTempos.length - 1)] || 430;
        const tempoMs = mode === 'victory' ? 235 : baseTempo;

        this.bgmTimer = setInterval(() => {
            if (this.muted || !this.ctx) return;
            if (mode === 'dungeon') {
                this._playDungeonStep(this.bgmStep, this.intensity);
            } else if (mode === 'victory') {
                this._playVictoryStep(this.bgmStep);
            }
            this.bgmStep++;
        }, tempoMs);
    }

    setUrgentTempo(urgent) {
        if (this.currentMode !== 'dungeon' || this.muted) return;
        if (this.isUrgentTempo === urgent) return;
        this.isUrgentTempo = urgent;
        this.stopMusic();

        const regionTempos = [430, 355, 295, 240, 190];
        const baseTempo = regionTempos[Math.min(this.intensity, regionTempos.length - 1)] || 430;
        const tempoMs = urgent ? Math.max(145, Math.round(baseTempo * 0.78)) : baseTempo;

        this.bgmTimer = setInterval(() => {
            if (this.muted || !this.ctx) return;
            this._playDungeonStep(this.bgmStep, this.intensity);
            this.bgmStep++;
        }, tempoMs);
    }

    _playDungeonStep(step, intensity) {
        const now = this.ctx.currentTime;
        const scale = [146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66];
        const pattern = [0, 2, 4, 3, 2, 1, 0, 4, 5, 4, 2, 3, 1, 0, 2, 0];
        const noteFreq = scale[pattern[step % pattern.length]];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = intensity >= 3 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(noteFreq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750 + intensity * 220, now);

        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.37);

        if (step % 4 === 0) {
            const bass = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();
            bass.type = 'sine';
            const bassNotes = [73.42, 73.42, 65.41, 82.41];
            bass.frequency.setValueAtTime(bassNotes[Math.floor(step / 4) % bassNotes.length], now);
            bGain.gain.setValueAtTime(0.07, now);
            bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
            bass.connect(bGain);
            bGain.connect(this.ctx.destination);
            bass.start(now);
            bass.stop(now + 0.86);
        }
    }

    _playVictoryStep(step) {
        const now = this.ctx.currentTime;
        const melody = [392.00, 493.88, 587.33, 783.99, 659.25, 587.33, 659.25, 783.99];
        const freq = melody[step % melody.length];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
    }

    /* ------------------------------------------------------------------------
       EFEITOS SONOROS (SFX) DE JOGO
       ------------------------------------------------------------------------ */
    playStep() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(95 + Math.random() * 20, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    playDoorOpen() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(85, now);
        osc.frequency.linearRampToValueAtTime(145, now + 0.22);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
    }

    playDoorBreak() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.32);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
    }

    playCorrect() {
        if (this.muted) return;
        this.init();
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const now = this.ctx.currentTime + i * 0.065;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.29);
        });
    }

    playWrong() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(165, now);
        osc.frequency.linearRampToValueAtTime(92, now + 0.35);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.37);
    }

    playJump() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.18);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playFirework() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
    }
}