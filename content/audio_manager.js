class AudioManager {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  playWeaponSound(weapon) {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    switch (weapon) {
      case 'pistol':
        this.playPistolSound();
        break;
      case 'shotgun':
        this.playShotgunSound();
        break;
      case 'flamethrower':
        this.playFlamethrowerSound();
        break;
      case 'rifle':
        this.playRifleSound();
        break;
      case 'rpg':
        this.playExplosionSound();
        break;
      case 'laser':
        this.playLaserSound();
        break;
      default:
        this.playPistolSound();
    }
  }

  createNoiseBuffer() {
    const bufferSize = this.audioCtx.sampleRate * 2; // 2 seconds
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playPistolSound() {
    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.1);

    // Add a small noise burst for "crack"
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    noise.connect(noiseGain);
    noiseGain.connect(this.audioCtx.destination);
    noise.start(t);
    noise.stop(t + 0.05);
  }

  playShotgunSound() {
    const t = this.audioCtx.currentTime;
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    // Lowpass filter for "boom"
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(t);
    noise.stop(t + 0.4);
  }

  playFlamethrowerSound() {
    const t = this.audioCtx.currentTime;
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.5);

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(t);
    noise.stop(t + 0.5);
  }

  playExplosionSound() {
    const t = this.audioCtx.currentTime;
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(50, t + 1.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(t);
    noise.stop(t + 1.5);
  }

  playLaserSound() {
    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playRifleSound() {
    const t = this.audioCtx.currentTime;

    // Sharp, quick automatic rifle "crack"
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.06);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.06);

    // Add a sharp noise burst for mechanical "clack"
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    // High pass filter for crisp sound
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, t);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.audioCtx.destination);
    noise.start(t);
    noise.stop(t + 0.04);
  }

  playBackgroundMusic() {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.stopBackgroundMusic(); // Ensure no duplicates
    this.isPlayingMusic = true;
    this.musicNodes = [];

    // Start the drone
    this.startDrone();

    // Start the rhythm loop
    this.nextNoteTime = this.audioCtx.currentTime;
    this.scheduler();
  }

  stopBackgroundMusic() {
    this.isPlayingMusic = false;

    // Stop all tracked nodes
    if (this.musicNodes) {
      this.musicNodes.forEach(node => {
        try {
          node.stop();
          node.disconnect();
        } catch (e) {
          // Ignore if already stopped
        }
      });
    }
    this.musicNodes = [];

    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  startDrone() {
    const t = this.audioCtx.currentTime;

    // Create two detuned oscillators for a thick, dark drone
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.value = 55; // Low A

    osc2.type = 'sawtooth';
    osc2.frequency.value = 55.5; // Slightly detuned

    // Filter for that muffled industrial sound
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 1;

    // LFO to modulate filter cutoff slowly
    const lfo = this.audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2; // Very slow
    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.value = 100;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    gain.gain.value = 0.15; // Keep it background level

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc1.start(t);
    osc2.start(t);
    lfo.start(t);

    this.musicNodes.push(osc1, osc2, lfo);
  }

  scheduler() {
    // Lookahead of 0.1 seconds
    while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
      this.scheduleBeat(this.nextNoteTime);
      this.nextNoteTime += 0.6; // ~100 BPM (60/100 = 0.6s per beat)
    }

    if (this.isPlayingMusic) {
      this.schedulerTimer = setTimeout(() => this.scheduler(), 25);
    }
  }

  scheduleBeat(time) {
    // Simple Industrial Beat Pattern
    // Beat 1: Kick + Metallic Clang
    // Beat 2: Snare
    // Beat 3: Kick
    // Beat 4: Snare + Distortion

    const beatIndex = Math.floor(time / 0.6) % 4;

    if (beatIndex === 0) {
      this.playKick(time);
      this.playMetallicClang(time);
    } else if (beatIndex === 1) {
      this.playSnare(time);
    } else if (beatIndex === 2) {
      this.playKick(time);
      // Occasional double kick
      this.playKick(time + 0.3);
    } else if (beatIndex === 3) {
      this.playSnare(time);
      this.playIndustrialNoise(time);
    }

    // Constant 16th note hi-hats
    for (let i = 0; i < 4; i++) {
      this.playHiHat(time + (i * 0.15));
    }
  }

  playKick(time) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  playSnare(time) {
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(time);
    noise.stop(time + 0.2);
  }

  playHiHat(time) {
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  playMetallicClang(time) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    // FM Synthesis for metallic sound
    const modulator = this.audioCtx.createOscillator();
    const modGain = this.audioCtx.createGain();

    modulator.frequency.value = 240;
    modGain.gain.value = 500;

    modulator.connect(modGain);
    modGain.connect(osc.frequency);

    osc.type = 'square';
    osc.frequency.setValueAtTime(400, time);

    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 1.0);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    modulator.start(time);

    osc.stop(time + 1.0);
    modulator.stop(time + 1.0);
  }

  playIndustrialNoise(time) {
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, time);
    filter.frequency.linearRampToValueAtTime(100, time + 0.5); // Downward sweep
    filter.Q.value = 10; // High resonance

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(time);
    noise.stop(time + 0.5);
  }
}

window.AudioManager = AudioManager;
