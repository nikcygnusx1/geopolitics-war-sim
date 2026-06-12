export type DefconLevel = 5 | 4 | 3 | 2 | 1;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private currentDefcon: DefconLevel = 5;

  init() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.ctx.destination);
      
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.15;
      this.ambientGain.connect(this.master);
      
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.master);
    } catch (e) {
      console.warn('Web Audio compilation / initialization failed:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  sfxKeyClick() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = Math.random() > 0.5 ? 800 : 900;
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.02);
  }

  sfxRadarPing() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  sfxKlaxon() {
    if (!this.ctx) return;
    this.resume();
    [0, 0.25, 0.5].forEach((delay, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = i % 2 === 0 ? 440 : 550;
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.0, this.ctx.currentTime + delay + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.22);
    });
  }

  sfxMissileLaunch() {
    if (!this.ctx) return;
    this.resume();
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(1500, this.ctx.currentTime + 0.4);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    source.start();
  }

  sfxMissileImpact() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(15, this.ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
  }

  sfxIntercept() {
    if (!this.ctx) return;
    this.resume();
    [880, 1100].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.12 + 0.10);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.12);
      osc.stop(this.ctx.currentTime + i * 0.12 + 0.12);
    });
  }

  sfxMarketCrash() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  sfxFactionAlert() {
    if (!this.ctx) return;
    this.resume();
    [0, 0.1, 0.2].forEach(delay => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 220;
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, this.ctx.currentTime + delay + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.1);
    });
  }

  sfxUNVote() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 523; 
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.7);
  }

  sfxNewspaper() {
    if (!this.ctx) return;
    this.resume();
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.value = 600 + Math.random() * 200;
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.05 + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.05);
      osc.stop(this.ctx.currentTime + i * 0.05 + 0.06);
    }
  }

  updateAmbientScore(defcon: DefconLevel) {
    this.currentDefcon = defcon;
    const targetGain = defcon === 5 ? 0.08 : defcon === 4 ? 0.12 : defcon === 3 ? 0.18 : defcon === 2 ? 0.25 : 0.35;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 2.0);
    }
  }

  startAmbient() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.resume();
    if (this.ambientOscillators.length > 0) return; // already running
    
    const baseFreqs = [55, 110, 82.5];
    baseFreqs.forEach((freq, i) => {
      if (!this.ctx || !this.ambientGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = i === 2 ? 'sawtooth' : 'sine';
      osc.frequency.value = freq;
      
      const gain = this.ctx.createGain();
      gain.gain.value = i === 0 ? 0.03 : i === 1 ? 0.02 : 0.01;
      
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.15 + i * 0.1;
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = freq * 0.005;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      lfo.start();
      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start();
      
      this.ambientOscillators.push(osc, lfo);
    });
  }

  sfxSatDestroy() {
    if (!this.ctx) return;
    this.resume();
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.8);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.82);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.85);
    osc2.stop(this.ctx.currentTime + 0.85);
  }

  startIntroDrone() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(38, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(42, this.ctx.currentTime + 30);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 4);
    gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 20);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 31);
    osc.connect(gain);
    gain.connect(this.master || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 32);

    // Sub-bass heartbeat pulse every 2.2 seconds
    const targetCtx = this.ctx;
    const targetMaster = this.master;
    const pulseInterval = setInterval(() => {
      if (!targetCtx || targetCtx.state === 'closed') return;
      try {
        const p = targetCtx.createOscillator();
        const pg = targetCtx.createGain();
        p.frequency.value = 28;
        pg.gain.setValueAtTime(0.15, targetCtx.currentTime);
        pg.gain.exponentialRampToValueAtTime(0.001, targetCtx.currentTime + 0.6);
        p.connect(pg);
        p.connect(targetMaster || targetCtx.destination);
        p.start();
        p.stop(targetCtx.currentTime + 0.7);
      } catch (err) {
        // Handle gracefully if context was closed
      }
    }, 2200);
    setTimeout(() => {
      clearInterval(pulseInterval);
    }, 30000);
  }

  playMarkerPing(type: 'conflict' | 'military' | 'nuclear' | 'economic') {
    if (!this.ctx) return;
    this.resume();
    const FREQS = { conflict: 880, military: 660, nuclear: 440, economic: 1100 };
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = FREQS[type];
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playPhaseReveal() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playDocumentBreak() {
    if (!this.ctx) return;
    this.resume();
    
    try {
      // Burst of noise for the crack
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
      }
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3000;
      filter.Q.value = 0.5;
      source.buffer = buffer;
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      source.start();
    } catch (e) {
      // Background context issue helper
    }

    // CLEARANCE CONFIRMED chime
    const targetCtx = this.ctx;
    const targetMaster = this.master;
    setTimeout(() => {
      if (!targetCtx || targetCtx.state === 'closed') return;
      try {
        [880, 1320, 1760].forEach((freq, i) => {
          const o = targetCtx.createOscillator();
          const g = targetCtx.createGain();
          o.frequency.value = freq;
          o.type = 'sine';
          g.gain.setValueAtTime(0.08, targetCtx.currentTime + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, targetCtx.currentTime + i * 0.06 + 0.4);
          o.connect(g);
          o.connect(targetMaster || targetCtx.destination);
          o.start(targetCtx.currentTime + i * 0.06);
          o.stop(targetCtx.currentTime + i * 0.06 + 0.5);
        });
      } catch (err) {}
    }, 700);
  }
}

export const audio = new AudioEngine();
export default audio;
