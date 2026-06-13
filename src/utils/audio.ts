import { useWorldStore } from '../store/worldStore';
import { useDefconStore } from '../store/defconStore';

export type DefconLevel = 5 | 4 | 3 | 2 | 1;

class AudioEngine {
  // Public core Web Audio API components (Non-Negotiable requirement)
  public ctx: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public sfxGain: GainNode | null = null;

  // Custom audio buses / registers
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private currentDefcon: DefconLevel = 5;
  private isMuted: boolean = false;

  // Drone safety tracking variables to prevent oscillation stacking/memory leaks
  private ambientOscillator: OscillatorNode | null = null;
  private ambientLFOSource: OscillatorNode | null = null;
  private ambientLFOGain: GainNode | null = null;
  private ambientDroneGainNode: GainNode | null = null;
  private isDroneRunning: boolean = false;

  init() {
    if (this.ctx) return; // Prevent double initialization
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.master = this.ctx.createGain();
      this.master.gain.value = this.isMuted ? 0.0 : 0.7;
      this.master.connect(this.ctx.destination);
      this.masterGain = this.master; // Keep alias compliant with core spec

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.12;
      this.ambientGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.65; // Balanced to prevent clipping
      this.sfxGain.connect(this.master);

      // Start the drone automatically once initialized and unlocked
      this.startAmbientDrone();
    } catch (e) {
      console.warn('Web Audio compilation / initialization failed:', e);
    }
  }

  resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. AMBIENT DRONE IMPLEMENTATION (Non-Negotiable requirement)
  startAmbientDrone() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.resume();

    // Prevent stacking duplicate ambient drone oscillators
    if (this.isDroneRunning) return;

    try {
      // Base frequency 38Hz (Required)
      const baseFreq = 38;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      // Slow LFO modulation ±4Hz (Required)
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow pace ~ 0.08Hz

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(4.0, this.ctx.currentTime); // ±4Hz depth

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Gain tied to global tension (Defcon levels 5 to 1)
      const droneGain = this.ctx.createGain();
      const initialDefcon = useDefconStore.getState().currentDefconLevel || 5;
      const initialGain = this.getDroneGainForDefcon(initialDefcon);
      droneGain.gain.setValueAtTime(initialGain, this.ctx.currentTime);

      osc.connect(droneGain);
      droneGain.connect(this.ambientGain || this.ctx.destination);

      lfo.start();
      osc.start();

      // Store node pointers to manipulate on runtime change
      this.ambientOscillator = osc;
      this.ambientLFOSource = lfo;
      this.ambientLFOGain = lfoGain;
      this.ambientDroneGainNode = droneGain;
      this.isDroneRunning = true;
    } catch (err) {
      console.warn('Failed to start ambient drone:', err);
    }
  }

  private getDroneGainForDefcon(defcon: DefconLevel): number {
    switch (defcon) {
      case 5: return 0.04;
      case 4: return 0.08;
      case 3: return 0.14;
      case 2: return 0.20;
      case 1: return 0.26;
      default: return 0.04;
    }
  }

  // Backward compatibility alias
  startAmbient() {
    this.startAmbientDrone();
  }

  updateAmbientScore(defcon: DefconLevel) {
    this.currentDefcon = defcon;
    const targetGain = this.getDroneGainForDefcon(defcon);
    if (this.ambientDroneGainNode && this.ctx) {
      this.ambientDroneGainNode.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 1.5);
    }
    if (this.ambientGain && this.ctx) {
      const overallTarget = defcon === 5 ? 0.08 : defcon === 4 ? 0.12 : defcon === 3 ? 0.16 : defcon === 2 ? 0.22 : 0.32;
      this.ambientGain.gain.linearRampToValueAtTime(overallTarget, this.ctx.currentTime + 1.5);
    }
  }

  // 2. INTEL PINGS IMPLEMENTATION (Non-Negotiable requirement)
  playIntelPing(category: string) {
    if (!this.ctx) return;
    this.resume();

    // Exact frequency mapping required:
    // conflict=880, military=660, nuclear=440, economic=1100, cyber=1320
    let freq = 880;
    switch (category.toLowerCase()) {
      case 'conflict':
        freq = 880;
        break;
      case 'military':
        freq = 660;
        break;
      case 'nuclear':
        freq = 440;
        break;
      case 'economic':
        freq = 1100;
        break;
      case 'cyber':
        freq = 1320;
        break;
      default:
        freq = 880;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Exponential decay of 0.3s (Required)
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  // Backward compatibility alias for maps / alerts
  playMarkerPing(type: 'conflict' | 'military' | 'nuclear' | 'economic') {
    this.playIntelPing(type);
  }

  // 3. DEFCON HARMONY IMPLEMENTATION (Non-Negotiable requirement)
  playDefconTransition(level: DefconLevel) {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    let freqs: number[] = [];
    let waveshape: OscillatorType = 'sine';
    let includeWhiteNoise = false;

    // Complete chord sets for all levels 5, 4, 3, 2, 1
    switch (level) {
      case 5:
        // C Major: stable and clear [523, 659, 784] (Required)
        freqs = [523, 659, 784];
        waveshape = 'sine';
        break;
      case 4:
        // F Major7 (Unsettled but contained)
        freqs = [349.23, 440.00, 523.25];
        waveshape = 'sine';
        break;
      case 3:
        // D# diminished (Narrow, highly tense)
        freqs = [311.13, 370.00, 440.00];
        waveshape = 'triangle';
        break;
      case 2:
        // Augmented Flat-Fifth (Ominous, heavily unstable)
        freqs = [220.00, 311.13, 392.00];
        waveshape = 'sawtooth';
        break;
      case 1:
        // Catastrophic chord [277, 370, 415] + noise (Required)
        freqs = [277, 370, 415];
        waveshape = 'sawtooth';
        includeWhiteNoise = true;
        break;
    }

    // Play harmonious synthesized tones with clean gain-shaping
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = waveshape;
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.3);
    });

    // Layer in synthesized low-bandpass white noise if DEFCON 1
    if (includeWhiteNoise && this.ctx) {
      const bufferSize = this.ctx.sampleRate * 1.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(700, now);
      filter.Q.value = 1.5;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      noiseNode.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain || this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 1.3);
    }
  }

  // 4. ADDITIONAL SPECIAL EVENT HANDLERS (Non-Negotiable requirement)
  
  // War Klaxon - military alarm with sweeping oscillator sirens
  sfxWarKlaxon() {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    for (let cycle = 0; cycle < 3; cycle++) {
      const start = now + cycle * 0.45;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(440, start);
      osc1.frequency.linearRampToValueAtTime(320, start + 0.4);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(445, start);
      osc2.frequency.linearRampToValueAtTime(325, start + 0.4);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc1.start(start);
      osc1.stop(start + 0.42);
      osc2.start(start);
      osc2.stop(start + 0.42);
    }
  }

  // Backward compatibility alias
  sfxKlaxon() {
    this.sfxWarKlaxon();
  }

  // Coup Static Burst - television signal break and hostile takeover signal
  sfxCoupStaticBurst() {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.85;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const rawNoise = Math.random() * 2 - 1;
      const staticHum = Math.sin(i * 0.008) * 0.25;
      data[i] = (rawNoise * 0.75 + staticHum) * Math.sin(i * 0.002);
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + 0.8);
    filter.Q.value = 1.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + 0.85);
  }

  // Peace Resolution Chord - solemn, stabilizing major-ninth soundscape
  sfxPeaceResolution() {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    // F Major 9 soft chord: F3, C4, E4, G4, A4
    const freqs = [174.61, 261.63, 329.63, 392.00, 440.00];

    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      // Add gentle, warm vibrato
      const vibrato = this.ctx.createOscillator();
      vibrato.frequency.value = 3.8;
      const vibratoGain = this.ctx.createGain();
      vibratoGain.gain.value = 1.2;

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.4 + idx * 0.06); // slowly staggered
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      vibrato.start(now);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.95);
    });
  }

  // Core SFX Utilities - fully synthesized on the fly

  sfxKeyClick() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = Math.random() > 0.5 ? 800 : 900;
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
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
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
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
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
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
    osc.frequency.exponentialRampToValueAtTime(15, this.ctx.currentTime + 1.4);
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.4);
  }

  sfxIntercept() {
    if (!this.ctx) return;
    this.resume();
    [880, 1100].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.09);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.1);
      osc.stop(this.ctx.currentTime + idx * 0.1 + 0.1);
    });
  }

  sfxMarketCrash() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
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
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, this.ctx.currentTime + delay + 0.07);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.09);
    });
  }

  sfxUNVote() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 523; 
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  sfxNewspaper() {
    if (!this.ctx) return;
    this.resume();
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.value = 580 + Math.random() * 180;
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.05 + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.05);
      osc.stop(this.ctx.currentTime + i * 0.05 + 0.05);
    }
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

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.8);
    osc2.stop(this.ctx.currentTime + 0.8);
  }

  startIntroDrone() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(38, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(42, this.ctx.currentTime + 15);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 4);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 16);
    osc.connect(gain);
    gain.connect(this.master || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 16);
  }

  playPhaseReveal() {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playDocumentBreak() {
    if (!this.ctx) return;
    this.resume();
    
    try {
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
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      source.start();
    } catch (e) {}

    const targetCtx = this.ctx;
    const targetMaster = this.master;
    setTimeout(() => {
      if (!targetCtx || targetCtx.state === 'closed') return;
      try {
        [880, 1320, 1760].forEach((freq, idx) => {
          const o = targetCtx.createOscillator();
          const g = targetCtx.createGain();
          o.frequency.value = freq;
          o.type = 'sine';
          g.gain.setValueAtTime(0.05, targetCtx.currentTime + idx * 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, targetCtx.currentTime + idx * 0.05 + 0.3);
          o.connect(g);
          o.connect(targetMaster || targetCtx.destination);
          o.start(targetCtx.currentTime + idx * 0.05);
          o.stop(targetCtx.currentTime + idx * 0.05 + 0.4);
        });
      } catch (err) {}
    }, 600);
  }

  sfxIntelChime() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    [1046.50, 1567.98].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.1);
      osc.stop(this.ctx.currentTime + idx * 0.1 + 0.3);
    });
  }

  sfxSuccessConfirmation() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.06);
      osc.stop(this.ctx.currentTime + idx * 0.06 + 0.4);
    });
  }

  sfxCrisisWarning() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.master) {
      this.master.gain.value = muted ? 0.0 : 0.7;
    }
  }

  getMute() {
    return this.isMuted;
  }
}

export const audio = new AudioEngine();

// Automatic subscription to map raw crisis log events into strategic category Intel Pings!
if (typeof window !== 'undefined') {
  let lastEventLogLength = 0;

  // Let's defer subscription activation briefly so starting load noise doesn't pop
  setTimeout(() => {
    useWorldStore.subscribe((state) => {
      const currentLog = state.globalEventLog || [];
      if (currentLog.length > lastEventLogLength) {
        const latestEvent = currentLog[0];
        if (latestEvent && latestEvent.tick > 0) { // avoid bootstrap startup noise
          const text = latestEvent.text.toLowerCase();
          let category: 'conflict' | 'military' | 'nuclear' | 'economic' | 'cyber' | null = null;

          if (text.includes('thermonuclear') || text.includes('silo') || text.includes('icbm') || text.includes('slbm') || text.includes('nuclear') || text.includes('strike')) {
            category = 'nuclear';
          } else if (text.includes('cyber') || text.includes('penetration') || text.includes('database')) {
            category = 'cyber';
          } else if (text.includes('treasury') || text.includes('insolvency') || text.includes('default') || text.includes('bond') || text.includes('financial') || text.includes('economic') || text.includes('market') || text.includes('cash')) {
            category = 'economic';
          } else if (text.includes('military') || text.includes('recon') || text.includes('satellite') || text.includes('drone') || text.includes('kinetic') || text.includes('signals')) {
            category = 'military';
          } else if (text.includes('war') || text.includes('clerk') || text.includes('treaty') || text.includes('alliance') || text.includes('sanctions') || text.includes('blockade') || text.includes('ceasefire')) {
            category = 'conflict';
          }

          if (category) {
            audio.playIntelPing(category);
          } else {
            audio.sfxIntelChime();
          }
        }
      }
      lastEventLogLength = currentLog.length;
    });
  }, 1200);

  // AUTOMATED AUDIO UNLOCK PATTERN ON FIRST GESTURE (Required)
  const unlockAudioContext = () => {
    audio.resume();
    audio.startAmbientDrone();
    window.removeEventListener('click', unlockAudioContext, { capture: true });
    window.removeEventListener('keydown', unlockAudioContext, { capture: true });
  };

  window.addEventListener('click', unlockAudioContext, { capture: true });
  window.addEventListener('keydown', unlockAudioContext, { capture: true });
}

export default audio;
