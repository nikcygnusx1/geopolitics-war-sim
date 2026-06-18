import { useWorldStore } from '../store/worldStore';
import { useDefconStore } from '../store/defconStore';

export type DefconLevel = 5 | 4 | 3 | 2 | 1;

export type TensionState = 
  | 'PEACETIME_MONITORING'    // DEFCON 5, no active crises
  | 'DIPLOMATIC_FRICTION'     // DEFCON 4 OR active sanctions/tensions
  | 'CRISIS_EMERGING'         // DEFCON 3 OR first military deployment
  | 'ACTIVE_CONFLICT'         // DEFCON 2 OR ongoing military engagement
  | 'NUCLEAR_ALERT'           // DEFCON 1 OR nuclear launch detected
  | 'ENDGAME'                 // Final tick countdown, victory/defeat imminent
  | 'RESOLUTION';             // Post-conflict, ceasefire/peace achieved

export type AcousticEnvironment = 'war_room' | 'oval_office' | 'underground_bunker' | 'field_ops' | 'submarine_comms';

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

  private musicLayers: any[] = [];
  
  // Tension state audio engine components
  public currentTensionState: TensionState = 'PEACETIME_MONITORING';
  private tensionLayers: any[] = [];
  
  // Convolver for environment setup
  private convolverNode: ConvolverNode | null = null;
  private convolverGain: GainNode | null = null;
  private currentAcousticEnv: string = 'war_room';
  
  setTensionState(state: TensionState, transitionDurationMs: number) {
    if (!this.ctx || !this.ambientGain) return;
    this.resume();
    
    if (this.currentTensionState === state && this.tensionLayers.length > 0) return;
    this.currentTensionState = state;
    const now = this.ctx.currentTime;
    const transitionSecs = transitionDurationMs / 1000;

    // Fade out previous layers
    this.tensionLayers.forEach(layer => {
      try {
        if (layer.gainNode) {
          layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
          layer.gainNode.gain.exponentialRampToValueAtTime(0.001, now + transitionSecs);
          setTimeout(() => { try { layer.osc.stop(); } catch(e){} }, transitionDurationMs + 100);
        }
      } catch (e) {}
    });
    this.tensionLayers = [];

    // Base settings for drone
    let droneGainTarget = 0.08;
    let lfoRate = 0.05;
    
    if (state === 'PEACETIME_MONITORING') {
      droneGainTarget = 0.08; lfoRate = 0.05;
      this.playHarmonicLayer(now, transitionSecs, 65, 'sine', 0.05); // C2
      this.playHarmonicLayer(now, transitionSecs, 98, 'sine', 0.04); // G2
      this.playHarmonicLayer(now, transitionSecs, 165, 'sine', 0.03); // E3
    } else if (state === 'DIPLOMATIC_FRICTION') {
      droneGainTarget = 0.12; lfoRate = 0.08;
      this.playHarmonicLayer(now, transitionSecs, 73, 'sawtooth', 0.04, 800); // D2
      this.playHarmonicLayer(now, transitionSecs, 110, 'sawtooth', 0.04, 800); // A2
    } else if (state === 'CRISIS_EMERGING') {
      droneGainTarget = 0.18;
      this.playPulseLayer(now, transitionSecs, 55, 'square', 2.4, 0.06); // A1 pulse
      this.playHarmonicLayer(now, transitionSecs, 440, 'sawtooth', 0.03, 600); // High strings
    } else if (state === 'ACTIVE_CONFLICT') {
      droneGainTarget = 0.25;
      this.playPulseLayer(now, transitionSecs, 55, 'square', 1.6, 0.08);
      this.playNoiseLayer(now, transitionSecs, 200, 800, 0.04);
      this.playHarmonicLayer(now, transitionSecs, 220, 'sine', 0.03); // Tritone base
      this.playHarmonicLayer(now, transitionSecs, 311, 'sine', 0.03); // Tritone top
    } else if (state === 'NUCLEAR_ALERT') {
      droneGainTarget = 0.35;
      this.playPulseLayer(now, transitionSecs, 55, 'square', 0.8, 0.1, 65); // Portamento pulse
      this.playNoiseLayer(now, transitionSecs, 400, 1200, 0.06);
      this.playHarmonicLayer(now, transitionSecs, 1760, 'sine', 0.02); // A6 pure sine
      
      // Tremolo on ambient
      const tremolo = this.ctx.createOscillator();
      tremolo.frequency.value = 0.3;
      const tGain = this.ctx.createGain();
      tGain.gain.value = 0.5;
      tremolo.connect(tGain);
      tremolo.start(now);
      this.tensionLayers.push({ osc: tremolo, gainNode: tGain });
    } else if (state === 'ENDGAME') {
      droneGainTarget = 0.02; // Score drops
      this.playHarmonicLayer(now, transitionSecs, 110, 'sine', 0.15); // A2 held breath
    } else if (state === 'RESOLUTION') {
      droneGainTarget = 0.03;
      // Pure major chord
      this.playHarmonicLayer(now, transitionSecs, 130, 'sine', 0.08, undefined, 3); // C3 fade slowly
      this.playHarmonicLayer(now, transitionSecs, 165, 'sine', 0.08, undefined, 3); // E3
      this.playHarmonicLayer(now, transitionSecs, 196, 'sine', 0.08, undefined, 3); // G3
      this.sfxPeaceResolution();
    }

    // Update ambient drone parameters
    if (this.ambientDroneGainNode) {
      this.ambientDroneGainNode.gain.setValueAtTime(this.ambientDroneGainNode.gain.value, now);
      this.ambientDroneGainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, droneGainTarget), now + transitionSecs);
    }
    if (this.ambientLFOSource) {
      this.ambientLFOSource.frequency.setValueAtTime(this.ambientLFOSource.frequency.value, now);
      this.ambientLFOSource.frequency.linearRampToValueAtTime(lfoRate, now + transitionSecs);
    }
  }

  getTensionState(): TensionState {
    return this.currentTensionState;
  }

  mapDefconToTensionState(defcon: number, worldTension: number): TensionState {
    if (defcon === 1) return 'NUCLEAR_ALERT';
    if (defcon === 2) return 'ACTIVE_CONFLICT';
    if (defcon === 3 || (defcon === 4 && worldTension > 0.8)) return 'CRISIS_EMERGING';
    if (defcon === 4 || worldTension > 0.6) return 'DIPLOMATIC_FRICTION';
    return 'PEACETIME_MONITORING';
  }

  private playHarmonicLayer(now: number, transitionDelay: number, freq: number, type: OscillatorType, targetGain: number, lpFreq?: number, fadeSecs?: number) {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(targetGain, now + (fadeSecs || transitionDelay));
    if (lpFreq) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lpFreq;
      osc.connect(filter);
      filter.connect(gainNode);
    } else {
      osc.connect(gainNode);
    }
    gainNode.connect(this.ambientGain);
    osc.start(now);
    this.tensionLayers.push({ osc, gainNode });
  }

  private playPulseLayer(now: number, transitionDelay: number, freq: number, type: OscillatorType, intervalSecs: number, targetGain: number, targetFreq?: number) {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    
    if (targetFreq) { // Portamento simulator
      const pitchLfo = this.ctx.createOscillator();
      pitchLfo.type = 'sawtooth';
      pitchLfo.frequency.value = 1 / intervalSecs;
      const pGain = this.ctx.createGain();
      pGain.gain.value = targetFreq - freq;
      pitchLfo.connect(pGain);
      pGain.connect(osc.frequency);
      pitchLfo.start(now);
      this.tensionLayers.push({ osc: pitchLfo, gainNode: null });
    }
    
    const pulseLfo = this.ctx.createOscillator();
    pulseLfo.type = 'sine';
    pulseLfo.frequency.value = 1 / intervalSecs;
    const pulseGain = this.ctx.createGain();
    pulseGain.gain.value = 1.0;
    pulseLfo.connect(pulseGain);
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(targetGain, now + transitionDelay);
    pulseGain.connect(gainNode.gain);
    
    osc.connect(gainNode);
    gainNode.connect(this.ambientGain);
    osc.start(now);
    pulseLfo.start(now);
    this.tensionLayers.push({ osc, gainNode });
    this.tensionLayers.push({ osc: pulseLfo, gainNode: null });
  }

  private playNoiseLayer(now: number, duration: number, minFreq: number, maxFreq: number, targetGain: number) {
    if (!this.ctx || !this.ambientGain) return;
    try {
      const bs = this.ctx.sampleRate * 2.0;
      const buf = this.ctx.createBuffer(1, bs, this.ctx.sampleRate);
      const dat = buf.getChannelData(0);
      for(let i=0; i<bs; i++) dat[i] = Math.random()*2-1;
      const n = this.ctx.createBufferSource();
      n.buffer = buf; n.loop = true;
      const flt = this.ctx.createBiquadFilter();
      flt.type = 'bandpass';
      flt.frequency.value = (minFreq + maxFreq)/2;
      flt.Q.value = 0.5;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(targetGain, now + duration);
      n.connect(flt); flt.connect(g); g.connect(this.ambientGain);
      n.start(now);
      this.tensionLayers.push({ osc: n, gainNode: g });
    } catch(e){}
  }

  playSIGINTIntercept(lang: string, urgency: 'routine' | 'priority' | 'flash') {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    this.sfxRadioIntercept();
    let dur = 2, spk = 1, stat = 0.05;
    if (urgency === 'priority') { dur = 3.5; spk = 2; stat = 0.1; }
    if (urgency === 'flash') { dur = 5; spk = 3; stat = 0.2; }
    for(let s=0; s<spk; s++) {
      const src = this.ctx.createOscillator();
      src.type = 'sawtooth';
      src.frequency.setValueAtTime(300 + Math.random()*200, now);
      const flt = this.ctx.createBiquadFilter();
      flt.type = 'bandpass'; flt.frequency.value = 1500; flt.Q.value = 5.0;
      const am = this.ctx.createOscillator();
      am.type = 'sine'; am.frequency.value = 0.5 + Math.random()*4;
      const amG = this.ctx.createGain(); amG.gain.value = 0.5;
      am.connect(amG);
      const oG = this.ctx.createGain();
      oG.gain.setValueAtTime(0, now); oG.gain.linearRampToValueAtTime(0.08, now+0.1);
      oG.gain.setValueAtTime(0.08, now + dur - 0.1); oG.gain.linearRampToValueAtTime(0, now+dur);
      amG.connect(oG.gain);
      src.connect(flt); flt.connect(oG); oG.connect(this.sfxGain || this.ctx.destination);
      src.start(now); am.start(now); src.stop(now+dur); am.stop(now+dur);
    }
    try {
      const bs = this.ctx.sampleRate * dur;
      const b = this.ctx.createBuffer(1, bs, this.ctx.sampleRate);
      const d = b.getChannelData(0);
      for(let i=0; i<bs; i++) d[i] = Math.random()*2-1;
      const n = this.ctx.createBufferSource(); n.buffer = b;
      const ng = this.ctx.createGain(); ng.gain.value = stat;
      n.connect(ng); ng.connect(this.sfxGain || this.ctx.destination);
      n.start(now);
    } catch(e){}
    setTimeout(() => { this.sfxRadioIntercept(); }, Math.max(0, dur*1000 - 200));
  }

  setAcousticEnvironment(env: AcousticEnvironment) {
    if (!this.ctx) return;
    this.resume();
    this.currentAcousticEnv = env;
    if (!this.convolverNode) {
      this.convolverNode = this.ctx.createConvolver();
      this.convolverGain = this.ctx.createGain();
      this.convolverGain.gain.value = 0.15;
      this.convolverNode.connect(this.convolverGain);
      this.convolverGain.connect(this.master || this.ctx.destination);
      if (this.sfxGain) this.sfxGain.connect(this.convolverNode);
    }
    let lMs = 1200, dcy = 5.0;
    if (env === 'oval_office') { lMs = 400; dcy = 8.0; }
    if (env === 'underground_bunker') { lMs = 2800; dcy = 2.0; }
    if (env === 'field_ops') { lMs = 200; dcy = 12.0; }
    if (env === 'submarine_comms') { lMs = 80; dcy = 20.0; }
    
    const sr = this.ctx.sampleRate;
    const ln = Math.max(1, sr * (lMs/1000));
    const imp = this.ctx.createBuffer(2, ln, sr);
    for(let ch=0; ch<2; ch++){
      const dat = imp.getChannelData(ch);
      for(let i=0; i<ln; i++) dat[i] = (Math.random()*2-1)*Math.pow(1-i/ln, dcy);
    }
    this.convolverNode.buffer = imp;
    if (env === 'underground_bunker') {
      const comb = this.ctx.createBiquadFilter();
      comb.type = 'peaking'; comb.frequency.value = 180; comb.Q.value = 8.0;
      this.convolverNode.disconnect();
      this.convolverNode.connect(comb);
      comb.connect(this.convolverGain!);
    } else {
      this.convolverNode.disconnect();
      this.convolverNode.connect(this.convolverGain!);
    }
  }

  enterCinematicSilence(durationMs: number) {
    if (!this.ctx || !this.master) return;
    this.resume();
    const now = this.ctx.currentTime;
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.02, now + 0.8);
  }

  exitCinematicSilence(restoreToVolume: number) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(this.isMuted ? 0.0 : restoreToVolume, now + 1.2);
  }

  private currentMusicDefcon: DefconLevel = 5;
  private distortionNode: WaveShaperNode | null = null;

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

  private makeDistortionCurve(amount = 20) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private clearDistortion() {
    if (this.distortionNode && this.master && this.ctx) {
      try {
        this.master.disconnect();
        this.distortionNode.disconnect();
        this.master.connect(this.ctx.destination);
      } catch (e) {}
      this.distortionNode = null;
    }
  }

  buildAdaptiveScore(defcon: DefconLevel) {
    if (!this.ctx || !this.ambientGain) return;
    this.resume();

    const now = this.ctx.currentTime;

    // Stop all current music layers
    this.musicLayers.forEach((node) => {
      try {
        node.stop();
      } catch (e) {}
    });
    this.musicLayers = [];

    // Reset/Apply distortion node for DEFCON 1 master bus
    if (defcon === 1) {
      if (!this.distortionNode && this.master) {
        try {
          this.distortionNode = this.ctx.createWaveShaper();
          this.distortionNode.curve = this.makeDistortionCurve(10);
          this.master.disconnect();
          this.master.connect(this.distortionNode);
          this.distortionNode.connect(this.ctx.destination);
        } catch (e) {
          console.warn('Distortion application failed:', e);
        }
      }
    } else {
      this.clearDistortion();
    }

    // Determine target overall ambient gain for crossfading
    let targetOverallGain = 0.12;
    if (defcon === 5) targetOverallGain = 0.12;
    else if (defcon === 4) targetOverallGain = 0.18;
    else if (defcon === 3) targetOverallGain = 0.20;
    else if (defcon === 2) targetOverallGain = 0.28;
    else if (defcon === 1) targetOverallGain = 0.38;

    // Crossfade ambientGain node value to new target over 2 seconds
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
    this.ambientGain.gain.linearRampToValueAtTime(targetOverallGain, now + 2.0);

    /* --- LEVEL-SPECIFIC HARMONIC LAYERING --- */
    
    // Modulation depth variables depending on defcon tension
    let lfoDepth = 4.0;
    let lfoRate = 0.08;
    if (defcon <= 4) { lfoDepth = 8.0; lfoRate = 0.1; }
    if (defcon === 1) { lfoDepth = 16.0; lfoRate = 0.2; } // doubled depth and rate

    // Standard base LFO for core drone pitch modulation
    const baseLfo = this.ctx.createOscillator();
    baseLfo.type = 'sine';
    baseLfo.frequency.setValueAtTime(lfoRate, now);
    const baseLfoGain = this.ctx.createGain();
    baseLfoGain.gain.setValueAtTime(lfoDepth, now);
    baseLfo.connect(baseLfoGain);
    baseLfo.start();
    this.musicLayers.push(baseLfo);

    // Layer 1 (Base Drone frequency 38Hz sinusoid modulated by LFO)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(38, now);
    baseLfoGain.connect(osc1.frequency);
    const g1 = this.ctx.createGain();
    g1.gain.setValueAtTime(0, now);
    g1.gain.linearRampToValueAtTime(0.06, now + 2.0); // fade in 2s
    osc1.connect(g1);
    g1.connect(this.ambientGain);
    osc1.start();
    this.musicLayers.push(osc1);

    // Layer 2 (Sine 76Hz / Octave Above - with gating if defcon <= 4)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(76, now);
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.02, now + 2.0);

    if (defcon <= 4) {
      // 0.5Hz LFO gating the volume of Layer 2 dynamically
      const gateLfo = this.ctx.createOscillator();
      gateLfo.type = 'sine';
      gateLfo.frequency.setValueAtTime(0.5, now);
      const gateLfoGain = this.ctx.createGain();
      // vary gain subtly between 0.01 and 0.03
      gateLfoGain.gain.setValueAtTime(0.01, now);
      gateLfo.connect(gateLfoGain);
      gateLfoGain.connect(g2.gain);
      gateLfo.start();
      this.musicLayers.push(gateLfo);
    }
    osc2.connect(g2);
    g2.connect(this.ambientGain);
    osc2.start();
    this.musicLayers.push(osc2);

    // Layer 3 (Sine 57Hz / Perfect Fifth)
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(57, now);
    const g3 = this.ctx.createGain();
    g3.gain.setValueAtTime(0, now);
    g3.gain.linearRampToValueAtTime(0.015, now + 2.0);
    osc3.connect(g3);
    g3.connect(this.ambientGain);
    osc3.start();
    this.musicLayers.push(osc3);

    // DEFCON 4 / 3 / 2 / 1: Layer 4 (Triangle 110Hz)
    if (defcon <= 4) {
      const osc4 = this.ctx.createOscillator();
      osc4.type = 'triangle';
      osc4.frequency.setValueAtTime(110, now);
      const g4 = this.ctx.createGain();
      g4.gain.setValueAtTime(0, now);
      g4.gain.linearRampToValueAtTime(0.03, now + 2.0);
      osc4.connect(g4);
      g4.connect(this.ambientGain);
      osc4.start();
      this.musicLayers.push(osc4);
    }

    // DEFCON 3 / 2 / 1: Layer 5 (Sawtooth 55Hz + lowpass filter 400Hz + 0.8Hz square gate)
    if (defcon <= 3) {
      const osc5 = this.ctx.createOscillator();
      osc5.type = 'sawtooth';
      osc5.frequency.setValueAtTime(55, now);
      
      const filter5 = this.ctx.createBiquadFilter();
      filter5.type = 'lowpass';
      filter5.frequency.setValueAtTime(400, now);

      const g5 = this.ctx.createGain();
      g5.gain.setValueAtTime(0, now);

      const gateLfo = this.ctx.createOscillator();
      gateLfo.type = 'square';
      gateLfo.frequency.setValueAtTime(0.8, now);
      const gateLfoGain = this.ctx.createGain();
      gateLfoGain.gain.setValueAtTime(0.04, now);
      
      gateLfo.connect(gateLfoGain);
      gateLfoGain.connect(g5.gain);
      gateLfo.start();
      this.musicLayers.push(gateLfo);

      osc5.connect(filter5);
      filter5.connect(g5);
      g5.connect(this.ambientGain);
      osc5.start();
      this.musicLayers.push(osc5);
    }

    // DEFCON 2 / 1: Layer 6 (Sawtooth 220Hz + bandpass filter 180-260Hz + 1.2Hz gate + 0.03Hz pitch drift)
    if (defcon <= 2) {
      const osc6 = this.ctx.createOscillator();
      osc6.type = 'sawtooth';
      osc6.frequency.setValueAtTime(220, now);

      const driftLfo = this.ctx.createOscillator();
      driftLfo.type = 'sine';
      driftLfo.frequency.setValueAtTime(0.03, now);
      const driftGain = this.ctx.createGain();
      driftGain.gain.setValueAtTime(lfoDepth / 2.0, now); // scale with LFO depth setting
      driftLfo.connect(driftGain);
      driftGain.connect(osc6.frequency);
      driftLfo.start();
      this.musicLayers.push(driftLfo);

      const filter6 = this.ctx.createBiquadFilter();
      filter6.type = 'bandpass';
      filter6.frequency.setValueAtTime(220, now);
      filter6.Q.setValueAtTime(2.5, now);

      const g6 = this.ctx.createGain();
      g6.gain.setValueAtTime(0, now);

      const gate6 = this.ctx.createOscillator();
      gate6.type = 'square';
      gate6.frequency.setValueAtTime(1.2, now);
      const gate6Gain = this.ctx.createGain();
      gate6Gain.gain.setValueAtTime(0.035, now);
      gate6.connect(gate6Gain);
      gate6Gain.connect(g6.gain);
      gate6.start();
      this.musicLayers.push(gate6);

      osc6.connect(filter6);
      filter6.connect(g6);
      g6.connect(this.ambientGain);
      osc6.start();
      this.musicLayers.push(osc6);
    }

    // DEFCON 1 exclusive: White noise burst + sub-bass 22Hz rumble
    if (defcon === 1) {
      // Low sub-bass sine at 22Hz
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(22, now);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.08, now + 2.0);
      subOsc.connect(subGain);
      subGain.connect(this.ambientGain);
      subOsc.start();
      this.musicLayers.push(subOsc);

      // Looping white noise burst simulator (1s on, 0.5s off) using LFO square gating
      try {
        const bufferSize = this.ctx.sampleRate * 1.5; // 1.5s total cycle
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        // fill with noise but zero out the last 0.5s
        const cutOffIndex = this.ctx.sampleRate * 1.0;
        for (let i = 0; i < bufferSize; i++) {
          if (i < cutOffIndex) {
            data[i] = Math.random() * 2 - 1;
          } else {
            data[i] = 0;
          }
        }
        const noiseNode1 = this.ctx.createBufferSource();
        noiseNode1.buffer = buffer;
        noiseNode1.loop = true;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(400, now);
        noiseFilter.Q.setValueAtTime(0.8, now);

        const noiseGainNode = this.ctx.createGain();
        noiseGainNode.gain.setValueAtTime(0, now);
        noiseGainNode.gain.linearRampToValueAtTime(0.06, now + 2.0);

        noiseNode1.connect(noiseFilter);
        noiseFilter.connect(noiseGainNode);
        noiseGainNode.connect(this.ambientGain);
        noiseNode1.start(now);
        this.musicLayers.push(noiseNode1);
      } catch (err) {
        console.warn('White noise loop injection failed:', err);
      }
    }
  }

  updateAmbientScore(defcon: DefconLevel) {
    this.currentDefcon = defcon;
    this.updateAdaptiveScore(defcon);
  }

  updateAdaptiveScore(defcon: DefconLevel) {
    if (defcon === this.currentMusicDefcon) return;
    this.buildAdaptiveScore(defcon);
    this.currentMusicDefcon = defcon;
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

    if (level === 1) {
      this.sfxNuclearAlarm();
    }

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

  /* --- GEOPOLITICAL SIMULATOR CINEMATIC AUDIO SYSTEMS --- */

  playCinematicCue(sceneType: string, phase: number) {
    if (!this.ctx) return;
    switch (sceneType) {
      case 'SCENARIO_BOOT':
        if (phase === 0) this.startIntroDrone();
        if (phase === 2) this.playPhaseReveal();
        break;
      case 'SCENARIO_START':
        if (phase === 0) this.playDefconTransition(5);
        if (phase === 3) this.sfxSuccessConfirmation();
        break;
      case 'DEFCON_1_LOCKDOWN':
        if (phase === 0) this.sfxWarKlaxon();
        if (phase === 1) this.playDefconTransition(1);
        if (phase === 4) this.sfxCrisisWarning();
        break;
      case 'NUCLEAR_EXCHANGE':
        if (phase === 0) {
          this.sfxMissileLaunch();
          setTimeout(() => this.sfxMissileImpact(), 400);
        }
        if (phase === 3) this.sfxCrisisWarning();
        break;
      case 'NUCLEAR_AFTERMATH':
        if (phase === 0) {
          this.startIntroDrone();
        }
        if (phase === 4) this.sfxPeaceResolution();
        break;
      case 'REGIME_CHANGE_SEQUENCE':
        if (phase === 0) this.sfxCoupStaticBurst();
        if (phase === 2) this.sfxFactionAlert();
        break;
      case 'CEASEFIRE_EPILOGUE':
        if (phase === 0) this.sfxPeaceResolution();
        break;
      case 'MARKET_CRASH_BROADCAST':
        if (phase === 0) this.sfxMarketCrash();
        break;
      case 'COUP_NARRATIVE':
        if (phase === 0) {
          this.sfxCoupStaticBurst();
          this.sfxFactionAlert();
        }
        break;
      case 'PEACE_TREATY_CEREMONY':
        if (phase === 0) this.sfxUNVote();
        if (phase === 2) this.sfxPeaceResolution();
        break;
      case 'ALLIANCE_SUMMIT':
        if (phase === 2) this.sfxSuccessConfirmation();
        break;
      case 'CYBER_WAR_DECLARATION':
        if (phase === 0) {
          this.playIntelPing('cyber');
          setTimeout(() => this.playIntelPing('cyber'), 200);
          setTimeout(() => this.playIntelPing('cyber'), 400);
        }
        break;
      case 'OPERATIVE_BURNED_REPORT':
        if (phase === 0) this.sfxCoupStaticBurst();
        break;
      case 'NUCLEAR_DETERRENCE_WIN':
        if (phase === 0) this.sfxPeaceResolution();
        break;
      case 'GAME_OVER_DEFEAT':
        if (phase === 0) this.sfxWarKlaxon();
        break;
      case 'GAME_OVER_VICTORY':
        if (phase === 0) {
          this.sfxSuccessConfirmation();
          setTimeout(() => this.sfxSuccessConfirmation(), 500);
          setTimeout(() => this.sfxSuccessConfirmation(), 1000);
        }
        break;
      default:
        break;
    }
  }

  sfxTensionPulse(intensity: number) {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);

    const actualGain = 0.1 * Math.max(0, Math.min(1, intensity));
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(actualGain, now + 0.2); // attack 200ms
    gain.gain.setValueAtTime(actualGain, now + 0.5);          // hold 300ms
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1); // release 600ms

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  sfxRadioIntercept() {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 1. White noise band-pass filtered at 1200Hz Q=3 for 80ms
    try {
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseNode1 = this.ctx.createBufferSource();
      noiseNode1.buffer = buffer;
      const filter1 = this.ctx.createBiquadFilter();
      filter1.type = 'bandpass';
      filter1.frequency.setValueAtTime(1200, now);
      filter1.Q.setValueAtTime(3.0, now);
      const gain1 = this.ctx.createGain();
      gain1.gain.setValueAtTime(0.08, now);
      
      noiseNode1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(this.sfxGain || this.ctx.destination);
      noiseNode1.start(now);
    } catch (e) {}

    // 2. Short burst of 1000Hz sine for 40ms
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1000, now + 0.08);
    gain2.gain.setValueAtTime(0.05, now + 0.08);
    gain2.gain.setValueAtTime(0, now + 0.12);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain || this.ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.12);

    // 3. More noise 600Hz for 60ms
    try {
      const bufferSize3 = this.ctx.sampleRate * 0.06;
      const buffer3 = this.ctx.createBuffer(1, bufferSize3, this.ctx.sampleRate);
      const data3 = buffer3.getChannelData(0);
      for (let i = 0; i < bufferSize3; i++) {
        data3[i] = Math.random() * 2 - 1;
      }
      const noiseNode3 = this.ctx.createBufferSource();
      noiseNode3.buffer = buffer3;
      const filter3 = this.ctx.createBiquadFilter();
      filter3.type = 'bandpass';
      filter3.frequency.setValueAtTime(600, now + 0.12);
      filter3.Q.setValueAtTime(2.0, now + 0.12);
      const gain3 = this.ctx.createGain();
      gain3.gain.setValueAtTime(0.08, now + 0.12);
      
      noiseNode3.connect(filter3);
      filter3.connect(gain3);
      gain3.connect(this.sfxGain || this.ctx.destination);
      noiseNode3.start(now + 0.12);
    } catch (e) {}

    // 4. Tone sweep 800 -> 1400Hz over 100ms
    const osc4 = this.ctx.createOscillator();
    const gain4 = this.ctx.createGain();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(800, now + 0.18);
    osc4.frequency.linearRampToValueAtTime(1400, now + 0.28);
    gain4.gain.setValueAtTime(0.05, now + 0.18);
    gain4.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    
    osc4.connect(gain4);
    gain4.connect(this.sfxGain || this.ctx.destination);
    osc4.start(now + 0.18);
    osc4.stop(now + 0.285);
  }

  sfxNuclearAlarm() {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const dur = 1.2; // 1.2s per cycle, 2 cycles = 2.4s total

    for (let cycle = 0; cycle < 2; cycle++) {
      const cycleStart = now + cycle * dur;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';

      // Sweep frequency: 800Hz -> 1200Hz -> 800Hz over 1.2 seconds
      osc.frequency.setValueAtTime(800, cycleStart);
      osc.frequency.linearRampToValueAtTime(1200, cycleStart + 0.6);
      osc.frequency.linearRampToValueAtTime(800, cycleStart + 1.2);

      // Vibrato: 4Hz LFO at ±30Hz depth
      const vib = this.ctx.createOscillator();
      vib.frequency.setValueAtTime(4.0, cycleStart);
      const vibGain = this.ctx.createGain();
      vibGain.gain.setValueAtTime(30.0, cycleStart);

      vib.connect(vibGain);
      vibGain.connect(osc.frequency);

      // Gain: attack 100ms -> peak 0.12 -> hold -> release 400ms
      gain.gain.setValueAtTime(0, cycleStart);
      gain.gain.linearRampToValueAtTime(0.12, cycleStart + 0.1);
      gain.gain.setValueAtTime(0.12, cycleStart + dur - 0.4);
      gain.gain.linearRampToValueAtTime(0.001, cycleStart + dur);

      vib.start(cycleStart);
      vib.stop(cycleStart + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(cycleStart);
      osc.stop(cycleStart + dur);
    }
  }

  sfxEMPBurst() {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 1. Wide-spectrum noise
    try {
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'allpass';
      const gain1 = this.ctx.createGain();
      gain1.gain.setValueAtTime(0.18, now);

      noiseNode.connect(filter);
      filter.connect(gain1);
      gain1.connect(this.sfxGain || this.ctx.destination);
      noiseNode.start(now);
    } catch (e) {}

    // 3. Triangle sweep from 20Hz -> 20000Hz -> 20Hz over 400ms starting after 200ms silence
    const sweepStart = now + 0.28;
    const osc = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(20, sweepStart);
    osc.frequency.exponentialRampToValueAtTime(20000, sweepStart + 0.2);
    osc.frequency.exponentialRampToValueAtTime(20, sweepStart + 0.4);

    gain2.gain.setValueAtTime(0, sweepStart);
    gain2.gain.linearRampToValueAtTime(0.03, sweepStart + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, sweepStart + 0.4);

    osc.connect(gain2);
    gain2.connect(this.sfxGain || this.ctx.destination);

    osc.start(sweepStart);
    osc.stop(sweepStart + 0.41);
  }

  sfxWhiteout() {
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    // Massive clipping noise burst to simulate blinding light
    try {
      const bufferSize = this.ctx.sampleRate * 2.0; // 2 seconds of noise
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.linearRampToValueAtTime(8000, now + 1.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      noiseNode.start(now);
    } catch (e) {}
  }

  setSceneVolume(targetVolume: number, durationMs: number) {
    if (this.master && this.ctx) {
      const targetTime = this.ctx.currentTime + (durationMs / 1000);
      this.master.gain.setValueAtTime(this.master.gain.value, this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(this.isMuted ? 0.0 : targetVolume, targetTime);
    }
  }

  restoreSimVolume(durationMs: number = 1200) {
    this.exitCinematicSilence(0.7);
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
        // Read new events and see if SIGINT applies
        const newEvents = currentLog.slice(lastEventLogLength);
        newEvents.forEach(evt => {
          const text = evt.text.toLowerCase();
          const categoryRaw = evt.severity || '';
          
          if (text.includes('sigint') || text.includes('humint')) {
            audio.playSIGINTIntercept('english_encrypted', 'routine');
          }
        });

        const latestEvent = currentLog[currentLog.length - 1];
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
