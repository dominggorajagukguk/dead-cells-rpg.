// Web Audio API Procedural Synthesizer & Dynamic Soundtrack
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmNode = null;
    this.bgmTimer = null;
    this.currentTrack = null;
    this.bgmGain = null;
    this.sfxGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Sound FX ---

  playSlash(combo = 1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const baseFreq = 180 + combo * 80;
    osc.frequency.setValueAtTime(baseFreq * 2, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.12);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 + combo * 300, now);
    filter.Q.setValueAtTime(2, now);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    // Add white noise puff for swoosh
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1800, now);
    noiseFilter.Q.setValueAtTime(3, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
    noise.start(now);
    noise.stop(now + 0.1);
  }

  playHit(isCrit = false, isHeavy = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Low sub thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isCrit ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isCrit ? 320 : (isHeavy ? 120 : 180), now);
    osc.frequency.exponentialRampToValueAtTime(30, now + (isHeavy ? 0.25 : 0.15));

    gain.gain.setValueAtTime(isCrit ? 0.9 : 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.25 : 0.15));

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (isHeavy ? 0.26 : 0.16));

    // Metallic crunch
    if (isCrit || isHeavy) {
      const metalOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metalOsc.type = 'sawtooth';
      metalOsc.frequency.setValueAtTime(isCrit ? 1200 : 600, now);
      metalOsc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

      metalGain.gain.setValueAtTime(0.5, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      metalOsc.connect(metalGain);
      metalGain.connect(this.sfxGain);
      metalOsc.start(now);
      metalOsc.stop(now + 0.09);
    }
  }

  playRoll() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  playJump(isDouble = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = isDouble ? 340 : 200;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.2, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playDownSmash() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Ground slam rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  playBowShoot() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playExplosion() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.45);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  playPotion() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Chime & bubble
    [400, 550, 700, 950].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.3, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.2);
    });
  }

  playGold() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playCell() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playUpgrade() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [300, 450, 600, 900, 1200].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.35, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.26);
    });
  }

  playBossRoar() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.5);
    osc.frequency.exponentialRampToValueAtTime(40, now + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.4);
    filter.frequency.exponentialRampToValueAtTime(300, now + 1.2);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.3);
  }

  // --- Dynamic Procedural Background Music ---
  playBGM(stage = 1) {
    if (!this.ctx) return;
    if (this.currentTrack === stage && this.bgmTimer) return;
    this.stopBGM();
    this.currentTrack = stage;

    let beat = 0;
    const tempo = stage === 3 ? 140 : (stage === 2 ? 118 : 100);
    const intervalMs = (60 / tempo) * 1000 / 2; // 8th note step

    // Note scales for procedural dark fantasy composition (A Minor / Phrygian)
    const scale = [110, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00, 220]; // A2 -> A3

    const tick = () => {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;

      // 1. Kick on beats 0, 4, 8, 12
      if (beat % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(stage === 3 ? 140 : 100, now);
        kickOsc.frequency.exponentialRampToValueAtTime(28, now + 0.12);
        kickGain.gain.setValueAtTime(0.35, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.bgmGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.13);
      }

      // 2. Bass synth line
      if (beat % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        const bassNoteIdx = (Math.floor(beat / 4) * 2) % scale.length;
        const bassFreq = scale[bassNoteIdx] * 0.5; // Sub octave
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);

        bassGain.gain.setValueAtTime(0.2, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.bgmGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.22);
      }

      // 3. Arpeggiator Melody / Atmospheric Chime
      if (beat % 2 === 1 || (stage === 3 && Math.random() > 0.3)) {
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        arpOsc.type = stage === 3 ? 'sawtooth' : 'sine';
        
        const noteIdx = (beat * 3 + Math.floor(beat / 8)) % scale.length;
        const noteFreq = scale[noteIdx] * (stage === 3 ? 4 : 2);
        arpOsc.frequency.setValueAtTime(noteFreq, now);

        arpGain.gain.setValueAtTime(0.12, now);
        arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        arpOsc.connect(arpGain);
        arpGain.connect(this.bgmGain);
        arpOsc.start(now);
        arpOsc.stop(now + 0.26);
      }

      beat = (beat + 1) % 16;
    };

    this.bgmTimer = setInterval(tick, intervalMs);
  }

  playEnemyDeath() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.soundEngine = new SoundEngine();
