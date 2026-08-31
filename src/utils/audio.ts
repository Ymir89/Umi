// Web Audio API Synthesizer for Timer Alerts

class AudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a gentle alert sound
  playAlert(type: 'bell' | 'chime' | 'wood' | 'gong' = 'bell', volume = 0.6) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const gainNode = this.ctx.createGain();
      gainNode.connect(this.ctx.destination);
      gainNode.gain.setValueAtTime(volume * 0.4, now);

      if (type === 'bell') {
        // Singing bowl / tibetan bell harmonic
        const fundamental = 528; // Solfeggio 528Hz
        const harmonics = [1, 2.01, 3.01, 4.2];
        const harmonicGains = [1, 0.4, 0.2, 0.1];

        harmonics.forEach((ratio, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const hGain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(fundamental * ratio, now);

          hGain.gain.setValueAtTime(harmonicGains[i] * volume * 0.3, now);
          hGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

          osc.connect(hGain);
          hGain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 2.6);
        });
      } else if (type === 'gong') {
        // Deep resonant bronze gong
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(140, now);
        osc1.frequency.exponentialRampToValueAtTime(130, now + 3);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(285, now);

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(70, now);

        gainNode.gain.setValueAtTime(volume * 0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        subOsc.connect(gainNode);

        osc1.start(now);
        osc2.start(now);
        subOsc.start(now);

        osc1.stop(now + 3.6);
        osc2.stop(now + 3.6);
        subOsc.stop(now + 3.6);
      } else if (type === 'wood') {
        // Wooden temple block / klave
        const osc = this.ctx.createOscillator();
        const bandpass = this.ctx.createBiquadFilter();

        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(900, now);
        bandpass.Q.setValueAtTime(5, now);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);

        gainNode.gain.setValueAtTime(volume * 0.7, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(bandpass);
        bandpass.connect(gainNode);

        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        // Crystal Chime
        const freqs = [659.25, 880, 1318.51]; // E5, A5, E6
        freqs.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();
          const startTime = now + idx * 0.08;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          noteGain.gain.setValueAtTime(volume * 0.25, startTime);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.8);

          osc.connect(noteGain);
          noteGain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 1.9);
        });
      }
    } catch {
      // Ignore audio block/error on user interaction restrictions
    }
  }

  // Subtle 3-2-1 countdown tick
  playTick(secondLeft: number, volume = 0.4) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = secondLeft === 1 ? 880 : 660;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(volume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio context silenced
    }
  }

  // Session completed celebratory chime chord
  playSessionComplete(volume = 0.6) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const chord = [440, 554.37, 659.25, 880, 1108.73]; // A major chord
      const now = this.ctx.currentTime;

      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const startTime = now + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        noteGain.gain.setValueAtTime(volume * 0.2, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.5);

        osc.connect(noteGain);
        noteGain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 2.6);
      });
    } catch {
      // ignore
    }
  }
}

export const audioEngine = new AudioEngine();
