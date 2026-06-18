import React, { useEffect, useRef } from 'react';
import { useCinematicsStore, CinematicScene } from '../../store/cinematicsStore';

import { NuclearExchangeScene } from './renderers/nuclear';
import { PDBSciRenderer } from './renderers/pdb';
import { OperativeBurnedRenderer as ExtOperativeBurnedRenderer } from './renderers/operative';
import { GameOverSceneRenderer } from './renderers/gameover';
import { CinematicsSyncController } from './CinematicsSyncController';

// === HELPER FOR SKIP BUTTON ===
function SkipButton({ onClick, isSkippable }: { onClick: () => void, isSkippable: boolean }) {
  if (!isSkippable) return null;
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 text-[10px] text-gray-500 hover:text-white uppercase tracking-widest px-3 py-1 border border-gray-700 hover:border-gray-300 transition-colors z-50 pointer-events-auto"
    >
      Skip Sequence [Esc]
    </button>
  );
}

// =========================================================================
// SCENE RENDERERS
// =========================================================================

function ScenarioBootRenderer({ scene }: { scene: CinematicScene }) {
  const { phase } = scene;
  
  if (phase === 0) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8 z-[9000]">
        <div style={{ animation: 'sceneFadeIn 1.5s ease-out forwards' }}>
          <div className="w-2 h-2 rounded-full bg-green-500 mx-auto shadow-[0_0_15px_#22c55e] animate-pulse mb-6"></div>
          <div className="text-green-500 font-mono tracking-[0.5em] text-[11px] uppercase">SOVEREIGN COMMAND</div>
          <div className="h-px bg-green-500/50 mt-4 mx-auto" style={{ width: '80%', animation: 'sceneFadeIn 1.5s ease-out forwards' }}></div>
        </div>
      </div>
    );
  }

  if (phase === 1) {
    const lines = [
      "// SOVEREIGN COMMAND SIMULATION v2.0-ALPHA",
      "// INITIALIZING WORLD STATE ENGINE...",
      "// LOADING GEOPOLITICAL MATRIX: 80 NATIONS",
      "// NUCLEAR POSTURE REGISTRY: ACTIVE",
      "// INTELLIGENCE APPARATUS: ONLINE",
      "// DEFCON STATUS: MONITORING",
      "// AI SOVEREIGN ACTORS: 79 INITIALIZED",
      "// ALLIANCE NETWORKS: CALIBRATED",
      "// ECONOMIC MODELS: RUNNING",
      "// CYBER WARFARE GRID: LIVE",
      "// CANONICAL WORLD STATE: ACTIVATED",
      "// AWAITING COMMANDER DIRECTIVE..."
    ];

    return (
      <div className="absolute inset-0 bg-black p-12 flex flex-col justify-end text-left z-[9000]">
        <div className="space-y-2 mb-12">
          {lines.map((line, idx) => (
            <div 
              key={idx} 
              className="text-green-500 font-mono text-[9px] uppercase pl-10 opacity-0"
              style={{ animation: `sceneFadeIn 0.1s linear forwards ${idx * 0.08}s` }}
            >
              {line}
              {idx === lines.length - 1 && (
                <span className="inline-block w-2 bg-green-500 h-[10px] ml-2 animate-pulse align-middle" style={{ animation: 'sceneCursorBlink 1s step-end infinite' }}></span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // phase 2
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center z-[9000]" style={{ animation: 'sceneFinalFade 0.8s ease-out forwards' }}>
      <div className="text-green-500 font-mono font-bold tracking-[0.2em] text-[13px] uppercase animate-pulse">
        CANONICAL WORLD STATE ACTIVATED
      </div>
    </div>
  );
}

function ScenarioStartRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;
  
  if (phase === 0) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[9000]">
        <div className="absolute top-10 w-full bg-red-900 border-y border-red-500 py-2 text-center" style={{ animation: 'sceneFadeIn 0.5s ease-out' }}>
          <span className="text-white font-bold tracking-[0.5em] text-[12px] uppercase">CLASSIFIED // EYES ONLY</span>
        </div>
        <div className="border-4 border-gray-800 p-12 text-center" style={{ animation: 'sceneSlideFromBottom 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <h1 className="text-4xl text-white font-bold tracking-widest uppercase">{payload.scenarioName || 'OPERATION'}</h1>
        </div>
      </div>
    );
  }

  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-black p-16 flex items-center justify-center z-[9000]">
        <div className="w-full max-w-2xl bg-[#0a0a0a] border border-gray-800 p-10 font-mono relative">
          <div className="absolute top-4 right-4 text-gray-500 text-[10px]">{payload.year || '2026'} | {payload.playerCountry || 'US'}</div>
          <h2 className="text-red-500 font-bold mb-6 text-[12px] border-b border-red-900 pb-2 uppercase text-left">PRESIDENTIAL DAILY BRIEFING</h2>
          <div className="text-left text-gray-300 text-[10px] leading-relaxed relative whitespace-pre-wrap">
            {payload.briefingText || 'AWAITING BRIEFING CONTENT'}
            <span className="inline-block w-2 bg-gray-500 h-[10px] ml-1 opacity-80" style={{ animation: 'sceneCursorBlink 1s step-end infinite' }}></span>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 2) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center z-[9000]">
        <div className="bg-[#111] border border-gray-700 p-8 shadow-2xl flex flex-col items-center" style={{ animation: 'sceneSlideFromRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="w-16 h-16 border-2 border-red-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-500 text-2xl">★</span>
          </div>
          <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">YOUR ROLE</div>
          <div className="text-white text-lg font-bold uppercase tracking-wider mb-6">{payload.playerPersona || 'EXECUTIVE AUTHORITY'}</div>
          <div className="text-green-500 text-[9px] uppercase tracking-[0.2em] border border-green-900 px-4 py-2 bg-green-950/30">
            MISSION PARAMETERS ACCEPTED
          </div>
        </div>
      </div>
    );
  }

  // phase 3
  return (
    <div className="absolute inset-0 z-[9000] pointer-events-none" style={{ animation: 'sceneCRTTearAway 0.8s cubic-bezier(0.7, 0, 0.3, 1) forwards' }}>
       {/* Transparent, lets the clip path anim reveal underneath */}
       <div className="w-full h-full bg-black"></div>
    </div>
  );
}

function DefconLockdownRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;

  if (phase === 0) {
    return (
      <div className="absolute inset-0 bg-red-600 flex items-center justify-center z-[9000]">
        <div className="text-white font-black text-2xl md:text-3xl tracking-widest uppercase text-center w-full bg-black py-4">
          NUCLEAR WAR PROTOCOLS ENGAGED
        </div>
      </div>
    );
  }

  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-red-950 flex flex-col items-center justify-center z-[9000] p-8" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 2px, transparent 2px, transparent 4px), #450a0a' }}>
        <div className="flex w-full max-w-4xl justify-between border-b-2 border-red-500 pb-8 mb-8 text-center text-white font-mono font-bold">
          <div className="flex-1 px-4">DEFCON STATUS: 1 // MAXIMUM</div>
          <div className="flex-1 px-4 border-l border-red-500 border-r">STRATEGIC COMMAND: NATIONAL AUTHORITY</div>
          <div className="flex-1 px-4">LAUNCH AUTHORITY: EXECUTIVE</div>
        </div>
        <div className="text-red-300 font-mono text-center text-[12px] uppercase tracking-widest bg-black px-6 py-3 border border-red-900">
          {payload.triggerReason || 'HOSTILE ESCALATION DETECTED'}
        </div>
      </div>
    );
  }

  if (phase === 2) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8 z-[9000]">
        <div className="relative w-full max-w-3xl h-64 border border-red-900 mb-8 opacity-80" style={{ backgroundImage: 'radial-gradient(circle, #3f0000 10%, #000 90%)' }}>
           {/* Abstract world map placeholder */}
           <div className="absolute inset-0 flex items-center justify-center opacity-30 text-red-700 text-9xl">🗺</div>
           <div className="absolute top-[30%] left-[20%] w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
           <div className="absolute top-[40%] right-[30%] w-3 h-3 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
           <div className="absolute top-[50%] right-[15%] w-3 h-3 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="text-white font-mono font-bold tracking-[0.2em] text-[12px] uppercase">
          ALL STRATEGIC FORCES AT MAXIMUM READINESS
        </div>
      </div>
    );
  }

  if (phase === 3) {
    return (
      <div className="absolute inset-0 bg-black z-[9000] flex items-center justify-center font-mono text-red-500 text-xs break-all overflow-hidden p-4">
        {/* Scramble effect using CSS or repeating text */}
        <div className="w-full text-justify leading-none opacity-80 mix-blend-screen" style={{ animation: 'sceneRadioStatic 0.5s infinite steps(2)' }}>
          {Array(200).fill(0).map(() => Math.random().toString(36).substring(2, 10).toUpperCase()).join(' ')}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[9000] bg-red-950 pointer-events-none" style={{ animation: 'sceneFadeIn 0.5s reverse forwards' }}></div>
  );
}

function NuclearExchangeRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;

  if (phase === 0) {
    return <div className="absolute inset-0 bg-white z-[9000]"></div>;
  }

  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[9000]">
        <div className="text-[120px] text-red-600 mb-4" style={{ animation: 'sceneNuclearPulse 2s infinite' }}>☢</div>
        <div className="text-red-500 font-black text-xl mb-8 tracking-widest uppercase text-center border-b border-red-900 pb-4">
          THERMONUCLEAR DETONATION CONFIRMED
        </div>
        <div className="text-white font-mono text-xs space-y-2 text-center opacity-0" style={{ animation: 'sceneFadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <div>INITIATOR: {payload.strikerCountry} // TARGET: {payload.targetCountry}</div>
          <div>WARHEADS CONFIRMED: {payload.weaponCount} // EST. YIELD: {payload.estimatedYield}</div>
          <div className="text-red-400 mt-4 opacity-0" style={{ animation: 'sceneFadeIn 0s forwards 1s' }}>CASUALTIES: CATASTROPHIC</div>
        </div>
      </div>
    );
  }

  if (phase === 2) {
    return (
      <div className="absolute inset-0 bg-black p-12 flex items-center justify-center gap-16 z-[9000]">
        <div className="relative w-48 h-48 border-4 border-red-900 rounded-full flex items-end justify-center overflow-hidden bg-black pb-4">
           {/* Geiger arc */}
           <div className="absolute top-1/2 left-1/2 w-40 h-40 border-[10px] border-transparent border-t-red-600 rounded-full -translate-x-1/2 -translate-y-1/2 transform -rotate-45"></div>
           {/* Needle */}
           <div className="absolute bottom-6 w-1 h-20 bg-red-500 origin-bottom" style={{ animation: 'sceneGeigerSweep 0.5s ease-out forwards' }}></div>
           <div className="text-red-500 font-bold text-xs uppercase z-10 bg-black px-2">CRITICAL</div>
        </div>

        <div className="text-gray-300 font-mono text-[10px] space-y-4 max-w-md text-left leading-relaxed">
          <div className="text-red-500 font-bold mb-4 uppercase">DAMAGE ASSESSMENT</div>
          <div>// BLAST RADIUS: CONFIRMED LETHAL ZONE ~12.5KM</div>
          <div>// THERMAL PULSE: THIRD-DEGREE BURNS ~24.0KM</div>
          <div>// EMP EFFECTS: ELECTRONICS DISABLED ~85.0KM</div>
          <div>// FALLOUT PROJECTION: DOWNWIND CONTAMINATION ACTIVE</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black z-[9000]" style={{ animation: 'sceneFadeIn 1s reverse forwards' }}></div>
  );
}

function RegimeChangeRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;

  if (phase === 0) {
    return <div className="absolute inset-0 bg-white opacity-90 z-[9000]" style={{ filter: 'url(#noise)', animation: 'sceneRadioStatic 0.5s forwards' }}></div>;
  }

  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8 z-[9000]">
        <div className="text-amber-500 font-bold text-[10px] uppercase tracking-widest border border-amber-500/50 px-4 py-1 animate-pulse absolute top-12">
          EMERGENCY BROADCAST // UNVERIFIED REPORT
        </div>
        <div className="relative mb-6 mt-16">
          <div className="text-white font-black text-4xl uppercase tracking-wider">{payload.country}</div>
          <div className="absolute inset-x-0 h-1 bg-red-600 top-1/2 -translate-y-1/2 transform -rotate-2"></div>
        </div>
        <div className="text-red-500 font-bold text-xl uppercase tracking-widest mb-8">GOVERNMENT: FALLEN</div>
        <div className="text-gray-400 font-mono text-[10px] uppercase space-y-2 text-center border-t border-gray-800 pt-6 min-w-[300px]">
          <div>METHOD: {payload.method}</div>
          <div>PREVIOUS AUTHORITY: {payload.oldLeader}</div>
        </div>
      </div>
    );
  }

  if (phase === 2) {
    return (
      <div className="absolute inset-0 bg-[#060a0b] flex flex-col items-center justify-center p-8 z-[9000]">
        <div className="w-full h-full absolute inset-0 bg-cyan-950/20" style={{ animation: 'sceneSlideFromRight 0.5s ease-out' }}></div>
        <div className="z-10 text-center space-y-6">
          <div className="text-cyan-400 font-bold text-[11px] tracking-[0.3em] uppercase">INCOMING ADMINISTRATION</div>
          <div className="text-white font-black text-2xl uppercase tracking-widest bg-cyan-900/30 px-6 py-2 border-l-4 border-cyan-500">
            {payload.newLeader}
          </div>
          <div className="text-gray-400 font-mono text-[10px] uppercase">
            BACKED BY: <span className="text-cyan-300">{payload.backingPower}</span>
          </div>
          <div className="text-white/50 text-[9px] uppercase tracking-widest pt-4">SOVEREIGNTY STATUS: TRANSITION PHASE</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#060a0b] z-[9000] scale-100" style={{ animation: 'sceneFinalFade 1s forwards' }}></div>
  );
}

function CeasefireEpilogueRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;
  
  if (phase === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-[#020508] to-[#04121a] flex flex-col items-center justify-center z-[9000]">
        <div className="text-white text-6xl opacity-0" style={{ animation: 'sceneDoveFadeIn 1.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards' }}>🕊</div>
      </div>
    );
  }

  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-[#020508] to-[#04121a] flex flex-col items-center justify-center p-12 z-[9000]">
        <div className="text-amber-400 font-black text-xl uppercase tracking-[0.2em] mb-12 text-center" style={{ animation: 'sceneFadeIn 0.8s ease-out' }}>
          CEASEFIRE AGREEMENT RATIFIED
        </div>
        <div className="flex w-full max-w-3xl items-center justify-between border border-gray-800 bg-[#000000]/50 p-8">
          <div className="flex flex-col items-center flex-1">
            <div className="w-16 h-10 bg-blue-900 border border-blue-500 mb-3 block"></div>
            <div className="text-white font-bold text-[11px] uppercase tracking-wider">{payload.party1}</div>
          </div>
          <div className="flex-1 text-center font-mono text-[9px] text-gray-400 uppercase space-y-2 border-l border-r border-gray-800 px-4">
            <div>MEDIATOR: {payload.mediator}</div>
            <div>CONFLICT DURATION: {payload.conflictDuration} TICKS</div>
          </div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-16 h-10 bg-red-900 border border-red-500 mb-3 block"></div>
            <div className="text-white font-bold text-[11px] uppercase tracking-wider">{payload.party2}</div>
          </div>
        </div>
        <div className="mt-8 text-center text-[10px] text-gray-300 font-mono space-y-1">
          {payload.terms && payload.terms.map((t: string, i: number) => (
            <div key={i} className="opacity-0" style={{ animation: `sceneFadeIn 0.5s ease-out forwards ${i * 0.5}s` }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // phase 2
  const particles = Array.from({ length: 20 }).map((_, i) => {
    const angle = (i * 360) / 20;
    const dist = 100 + Math.random() * 50;
    const dx = Math.cos(angle * Math.PI / 180) * dist;
    const dy = Math.sin(angle * Math.PI / 180) * dist;
    return (
      <div 
        key={i} 
        className="absolute w-1 h-1 rounded-full bg-amber-300"
        style={{ 
          top: '50%', left: '50%', 
          '--dx': `${dx}px`, '--dy': `${dy}px` 
        } as React.CSSProperties & { '--dx': string, '--dy': string }}
      />
    );
  });

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#020508] to-[#04121a] flex flex-col items-center justify-center z-[9000]" style={{ animation: 'sceneFinalFade 1.5s forwards' }}>
      <div className="relative w-full h-full flex items-center justify-center">
        {particles.map((p, i) => React.cloneElement(p, {
          style: { ...p.props.style, animation: `sceneParticleBurst 1s ease-out forwards` }
        }))}
      </div>
      <div className="absolute bottom-20 text-green-500 font-mono text-[10px] tracking-widest uppercase">
        HOSTILITIES CEASED — MONITORING ACTIVE
      </div>
    </div>
  );
}

function MarketCrashRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;
  
  if (phase === 0) {
    return (
      <div className="absolute inset-0 bg-red-950 flex flex-col items-center justify-center z-[9000] p-8">
        <div className="text-white font-black text-2xl uppercase tracking-[0.2em] text-center w-full bg-red-600 py-4 animate-pulse">
          BREAKING: GLOBAL MARKETS IN FREEFALL
        </div>
      </div>
    );
  }

  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-red-950/80 flex flex-col justify-center z-[9000]">
        <div className="bg-black py-1 border-y border-red-600 mb-12 flex overflow-hidden">
          <div className="whitespace-nowrap font-mono text-[14px] text-red-500 font-bold uppercase tracking-widest flex items-center shrink-0">
             <span className="inline-block mr-4 text-white bg-red-600 px-2 py-0.5 animate-pulse">CRITICAL ALERT</span>
             <marquee scrollamount="20">DJIA -18.4% ▼ | S&P 500 -21.2% ▼ | NIKKEI -16.8% ▼ | FTSE -14.1% ▼ | SSE -24.7% ▼ | SOVEREIGN -31.2% ▼</marquee>
          </div>
        </div>
        <div className="text-center font-mono space-y-4">
          <div className="text-white text-xl font-bold uppercase">CIRCUIT BREAKERS OFFLINE // TRADING HALTED</div>
          <div className="text-gray-400 text-xs uppercase">CENTRAL BANKS CONVENING EMERGENCY SESSION</div>
          <div className="text-red-400 text-sm uppercase pt-4">{payload.affectedMarkets}</div>
          <div className="text-red-500 text-6xl font-black mt-8 tracking-tighter">{payload.crashMagnitude}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[9000]" style={{ animation: 'sceneFinalFade 1s forwards' }}>
      <div className="text-green-500 font-mono uppercase text-xs tracking-widest">
        SOVEREIGN ECONOMIC RESPONSE MODULE: ACTIVE
      </div>
    </div>
  );
}

function NuclearAftermathRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;

  if (phase === 0) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center z-[9000]">
        <div className="text-white font-mono text-[10px] tracking-[0.8em] uppercase opacity-0" style={{ animation: 'sceneFadeIn 2s ease-in 1.5s forwards' }}>
          SIMULATION CONCLUDED
        </div>
      </div>
    );
  }

  if (phase === 1) {
    const lines = [
      `THE NUCLEAR EXCHANGE LASTED ${payload.totalWarheads} CONFIRMED DETONATIONS.`,
      `CIVILIZATIONAL DAMAGE ASSESSMENT: ${payload.globalDamage}% INFRASTRUCTURE LOSS.`,
      `ESTIMATED FATALITIES: COMPUTING... [OVERFLOW — DATA CORRUPTED]`,
      `INTERNATIONAL POLITICAL SYSTEM: COLLAPSED`,
      `REMAINING SOVEREIGN ENTITIES: UNKNOWN`
    ];

    return (
      <div className="absolute inset-0 bg-[#0f0000] flex flex-col items-center py-24 px-12 z-[9000]" style={{ background: 'radial-gradient(ellipse at center, #1a0000 0%, #000000 100%)', animation: 'sceneFadeIn 1s forwards' }}>
        <div className="w-full max-w-2xl text-left space-y-6">
          {lines.map((text, i) => (
            <div key={i} className="text-[#a8a8a8] font-mono text-[11px] uppercase opacity-0" style={{ animation: `sceneFadeIn 0.8s forwards ${i * 0.6}s` }}>
              {text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 2) {
    return (
      <div className="absolute inset-0 bg-[#050000] flex flex-col items-center justify-center p-12 z-[9000]">
        <div className="text-red-500 font-mono text-sm font-bold uppercase tracking-widest mb-12">KNOWN IMPACT ZONES</div>
        <div className="w-full max-w-3xl h-64 border border-red-900/30 relative opacity-0" style={{ animation: 'sceneFadeIn 1.5s forwards' }}>
          <div className="absolute inset-0 opacity-10 flex items-center justify-center text-8xl">🗺</div>
          <div className="absolute top-[30%] left-[20%] w-6 h-6 rounded-full border border-red-500/50 bg-red-500/20"></div>
          <div className="absolute top-[40%] right-[30%] w-8 h-8 rounded-full border border-red-500/50 bg-red-500/20"></div>
          <div className="absolute top-[50%] right-[15%] w-12 h-12 rounded-full border border-red-500/50 bg-red-500/20"></div>
        </div>
        <div className="text-[#888] font-mono text-[9px] uppercase mt-4">FALLOUT DRIFT: MODELED // CONFIDENCE: 14%</div>
      </div>
    );
  }

  if (phase === 3) {
    return (
      <div className="absolute inset-0 bg-[#050000] flex flex-col items-center justify-center z-[9000]">
        <div className="text-[#fff] font-mono text-[10px] tracking-[0.2em] leading-loose max-w-lg text-center space-y-2 uppercase opacity-0" style={{ animation: 'sceneSlideFromBottom 1.5s forwards' }}>
          <div>COMMANDER: {payload.playerCountry} — {payload.playerPersona || 'EXECUTIVE'}</div>
          <div>DEFCON LEVEL AT TERMINATION: 1</div>
          <div>TOTAL SIMULATION TICKS: {payload.currentTick}</div>
          <div>ACTIONS TAKEN: CLASSIFIED</div>
          <div className="mt-8 text-red-500 font-bold border-t border-red-900 pt-4">FINAL JUDGMENT: {payload.outcome}</div>
        </div>
      </div>
    );
  }

  // phase 4
  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[9000]">
      <div className="text-white font-serif italic text-lg tracking-wider mb-2 opacity-0" style={{ animation: 'sceneFadeIn 2s forwards' }}>
        "The living will envy the dead."
      </div>
      <div className="text-gray-600 font-sans text-[8px] uppercase tracking-widest mb-16 opacity-0" style={{ animation: 'sceneFadeIn 2s forwards 0.5s' }}>
        — Nikita Khrushchev
      </div>
      
      <div className="flex gap-8 opacity-0 pointer-events-auto" style={{ animation: 'sceneFadeIn 1s forwards 2s' }}>
        <button 
          className="border border-red-900 bg-red-950/30 text-red-500 px-6 py-2 text-[10px] font-mono uppercase hover:bg-red-900 hover:text-white transition"
          onClick={() => { useCinematicsStore.getState().clearAllScenes(); window.location.reload(); }}
        >
          RESTART SIMULATION
        </button>
        <button 
          className="border border-gray-800 bg-gray-900/30 text-gray-500 px-6 py-2 text-[10px] font-mono uppercase hover:bg-gray-800 transition"
        >
          EXIT
        </button>
      </div>
    </div>
  );
}

function CoupNarrativeRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;
  if (phase === 0) return <div className="absolute inset-0 bg-white z-[9000]" style={{ animation: 'sceneRadioStatic 0.3s forwards' }}></div>;
  
  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-[#0d1418] flex items-center justify-center z-[9000]">
        <div className="border border-gray-600 bg-[#111c20] p-8 max-w-md w-full font-mono text-left">
          <div className="text-gray-400 text-[9px] uppercase tracking-widest mb-6">INTELLIGENCE FIELD REPORT</div>
          <div className="space-y-2 text-xs uppercase text-white">
            <div className="flex"><span className="w-24 text-gray-500">ASSET:</span> <span>CLASSIFIED VANGUARD</span></div>
            <div className="flex"><span className="w-24 text-gray-500">TARGET:</span> <span>{payload.country || 'REGIME'}</span></div>
            <div className="flex"><span className="w-24 text-gray-500">METHOD:</span> <span>{payload.method || "COUP D'ÉTAT"}</span></div>
            <div className="flex"><span className="w-24 text-gray-500">BACKING:</span> <span>{payload.backingPower || 'AGENCY'}</span></div>
          </div>
          <div className="mt-6 border-t border-gray-600 pt-4 text-green-500 font-bold uppercase tracking-wider">OUTCOME: SUCCESS</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#0d1418] flex items-center justify-center z-[9000] opacity-0" style={{ animation: 'sceneFinalFade 1s forwards' }}>
      <div className="border-4 border-red-900 rotate-12 bg-red-950 px-8 py-2 text-red-500 text-2xl font-bold tracking-widest font-serif uppercase">
        FIELD REPORT CLASSIFIED — BURN AFTER READING
      </div>
    </div>
  );
}

function PeaceTreatyRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;
  
  if (phase === 0) {
    return (
      <div className="absolute inset-0 bg-[#02101a] flex flex-col items-center justify-center z-[9000]">
        <div className="w-full flex justify-center opacity-0" style={{ animation: 'sceneFadeIn 1s forwards' }}>
           <div className="w-48 h-32 border-b-2 border-cyan-700/50 rounded-b-full flex items-end justify-center pb-4">
             <div className="w-12 h-12 bg-cyan-900/30 rounded-full border border-cyan-500 flex items-center justify-center text-cyan-500">UN</div>
           </div>
        </div>
      </div>
    );
  }

  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-[#060a0b] flex flex-col items-center justify-center z-[9000] p-12">
         <div className="w-full max-w-2xl font-serif text-gray-300 text-sm italic leading-loose text-center space-y-6 opacity-0" style={{ animation: 'sceneSlideFromBottom 1.5s forwards' }}>
           <div>The undersigned parties, representing the sovereign authority of their respective states...</div>
           <div className="text-white font-sans font-bold uppercase not-italic tracking-widest">{payload.party1} &mdash; {payload.party2}</div>
           <div>...hereby ratify a comprehensive and legally binding cessation of unilateral hostilities.</div>
         </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#060a0b] flex flex-col items-center justify-center z-[9000]" style={{ animation: 'sceneFinalFade 2s forwards 1s' }}>
      <div className="w-64 h-32 relative">
        <svg viewBox="0 0 400 100" className="w-full h-full stroke-white stroke-2 fill-transparent">
          <path 
            d="M 50 80 Q 80 20, 120 70 T 180 30 T 260 80 Q 280 40, 320 60 L 380 40" 
            strokeDasharray="400" 
            strokeDashoffset="400" 
            style={{ animation: 'sceneSignatureStroke 1s ease-out forwards' }} 
          />
        </svg>
      </div>
      <div className="text-gray-500 font-mono text-[9px] tracking-widest uppercase mt-4">RATIFICATION CONFIRMED</div>
    </div>
  );
}

function AllianceSummitRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;
  if (phase === 0) {
    return (
      <div className="absolute inset-0 bg-[#0d1418] flex items-center justify-center gap-16 z-[9000]">
        <div className="w-24 h-16 bg-blue-900 border border-blue-500 opacity-0" style={{ animation: 'sceneSlideFromRight 0.5s reverse forwards' }}></div>
        <div className="w-24 h-16 bg-red-900 border border-red-500 opacity-0" style={{ animation: 'sceneSlideFromRight 0.5s forwards' }}></div>
      </div>
    );
  }
  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-[#0d1418] flex flex-col items-center justify-center z-[9000]">
        <div className="text-white font-serif text-lg text-center max-w-md italic mb-12">"A unified front to secure regional stability."</div>
        <div className="text-gray-400 font-mono text-xs uppercase text-center space-y-2">
          <div>JOINT COMMUNIQUÉ SIGNED</div>
          <div>{payload.party1}</div>
          <div>{payload.party2}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-[#0d1418] flex items-center justify-center z-[9000]" style={{ animation: 'sceneFinalFade 1s forwards' }}>
      <div className="text-blue-400 font-bold text-xl uppercase tracking-widest border border-blue-600 bg-blue-950/40 px-8 py-4">STRATEGIC PARTNERSHIP FORMALIZED</div>
    </div>
  );
}

function CyberWarRenderer({ scene }: { scene: CinematicScene }) {
  const { phase } = scene;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Matrix rain setup
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const chars = '01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    const interval = setInterval(() => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0f0';
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }, 33);
    
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === 0) {
    return (
      <div className="absolute inset-0 bg-black z-[9000] overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60"></canvas>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black text-green-500 text-3xl font-black font-mono tracking-widest uppercase p-4" style={{ animation: 'sceneTextReveal 0.5s ease-out forwards' }}>
            CYBER WAR COMMENCED
          </div>
        </div>
      </div>
    );
  }

  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center p-8 z-[9000]">
        <div className="border border-green-600 bg-black/90 p-8 max-w-xl w-full font-mono text-xs uppercase text-green-500 space-y-4">
          <div className="font-bold border-b border-green-800 pb-2">ATTRIBUTION REPORT // UNCLASSIFIED</div>
          <div className="grid grid-cols-2 gap-4 text-green-300">
            <div>THREAT ACTOR: APT-███</div>
            <div>TARGET VECTORS: CRITICAL INFRASTRUCTURE</div>
            <div className="col-span-2">DAMAGE EST: DATACENTERS SEVERED, GRID INSTABILITY</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[9000] gap-8" style={{ animation: 'sceneFinalFade 1s forwards 1s' }}>
      <div className="text-gray-500 font-mono text-sm uppercase">RECOMMENDED RESPONSES</div>
      <div className="flex gap-4">
        {['RETALIATE', 'ATTRIBUTE', 'DENY', 'ESCALATE'].map((btn, i) => (
          <div key={i} className="border border-green-800 bg-green-950/20 text-green-500 px-6 py-2 font-mono text-xs uppercase animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
            {btn}
          </div>
        ))}
      </div>
    </div>
  );
}

function OperativeBurnedRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;
  if (phase === 0) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center p-8 z-[9000]">
        <div className="bg-white w-full max-w-lg h-64 border-4 border-gray-800 flex flex-col items-center justify-center shadow-2xl relative">
          <div className="absolute top-2 left-2 text-black font-serif text-xs font-bold border-b-2 border-black pb-1">CENTRAL INTELLIGENCE</div>
          <div className="w-full mt-12 bg-black h-8 opacity-90"></div>
          <div className="w-3/4 mt-4 bg-black h-8 opacity-90"></div>
          <div className="w-5/6 mt-4 bg-black h-8 opacity-90"></div>
        </div>
      </div>
    );
  }
  
  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center p-8 z-[9000]">
        <div className="bg-white w-full max-w-lg min-h-64 border-4 border-gray-800 flex flex-col p-8 shadow-2xl relative font-mono text-black text-sm uppercase leading-relaxed" style={{ filter: 'blur(20px)', animation: 'sceneFadeIn 1.5s forwards', animationName: 'none', transition: 'filter 1.5s ease-out' }} ref={(el) => { if(el) setTimeout(() => { el.style.filter = 'blur(0px)' }, 50) }}>
          <div className="font-serif font-bold text-lg mb-6 border-b-2 border-black pb-2">FIELD ASSET COMPROMISE REPORT</div>
          <div className="font-bold">OPERATIVE ID: {payload.operativeName}</div>
          <div className="mb-4">COVER IDENTITY: {payload.coverIdentity}</div>
          <div className="text-xs">METHOD OF COMPROMISE: HOSTILE COUNTER-INTELLIGENCE INTERCEPT. ALL COMMS SEVERED. EXTRACTION IMPOSSIBLE.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[9000]" style={{ animation: 'sceneFinalFade 1s forwards 1s' }}>
      <div className="text-red-600 font-black text-2xl uppercase tracking-widest bg-red-950 px-8 py-4 border-y-4 border-red-600">
        ASSET TERMINATED // COVER BURNED
      </div>
      <div className="text-gray-500 font-mono text-xs mt-4">BLOWBACK: CALCULATING...</div>
    </div>
  );
}

function NuclearDeterrenceRenderer({ scene }: { scene: CinematicScene }) {
  const { phase } = scene;
  if (phase === 0) {
    return (
      <div className="absolute inset-0 bg-blue-900 flex items-center justify-center z-[9000]">
        <div className="text-white font-sans text-xl uppercase tracking-widest text-center px-4">MUTUAL ASSURED DESTRUCTION ACHIEVED.</div>
      </div>
    );
  }
  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-blue-950 flex flex-col items-center justify-center z-[9000] space-y-8">
        <div className="text-blue-300 font-mono text-lg uppercase tracking-wider">ALL PARTIES STAND DOWN</div>
        <div className="flex gap-4 items-center font-mono">
          <span className="text-red-500 font-bold border border-red-500 p-2 opacity-50">DEFCON 1</span>
          <span className="text-white">→</span>
          <span className="text-orange-500 font-bold border border-orange-500 p-2 opacity-50">DEFCON 2</span>
          <span className="text-white">→</span>
          <span className="text-amber-500 font-bold border border-amber-500 p-2 shadow-[0_0_10px_#f59e0b]">DEFCON 3</span>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-blue-950 flex flex-col items-center justify-center z-[9000]" style={{ animation: 'sceneFinalFade 2s forwards 1.5s' }}>
      <div className="text-white font-serif text-2xl uppercase tracking-widest mb-4">THE GAME THEORY HELD.</div>
      <div className="text-blue-500 font-sans text-sm uppercase tracking-widest">PEACE THROUGH TERROR — THIS TIME.</div>
    </div>
  );
}

function GameOverDefeatRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;
  if (phase === 0) return <div className="absolute inset-0 bg-white z-[9000]" style={{ animation: 'sceneRadioStatic 0.5s infinite' }}></div>;
  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[9000] space-y-6">
        <div className="text-red-600 text-6xl animate-pulse">☠</div>
        <div className="text-red-600 font-black text-3xl uppercase tracking-[0.2em] border-y-4 border-red-900 py-4 w-full text-center">SOVEREIGN COMMAND: LOST.</div>
        <div className="text-red-400 font-mono text-sm max-w-lg text-center leading-relaxed px-4">{payload.reason || 'CATASTROPHIC STRATEGIC FAILURE'}</div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[9000] p-12">
      <div className="w-full max-w-md border border-gray-800 bg-gray-900/40 p-8 font-mono text-gray-300 text-center space-y-6 mb-12">
        <div className="text-white font-bold tracking-widest uppercase mb-4 border-b border-gray-700 pb-2">SIMULATION TERMINATED</div>
        <div className="text-xs space-y-2">
          <div className="flex justify-between"><span>TICKS SURVIVED:</span> <span>{payload.tick}</span></div>
          <div className="flex justify-between"><span>FINAL DEFCON:</span> <span>{payload.defcon}</span></div>
        </div>
      </div>
      <button className="pointer-events-auto border border-red-600 text-red-500 bg-red-950/30 px-8 py-3 text-xs tracking-widest font-mono uppercase hover:bg-red-900 hover:text-white transition" onClick={() => { useCinematicsStore.getState().clearAllScenes(); window.location.reload(); }}>
        RESTART SIMULATION
      </button>
    </div>
  );
}

function GameOverVictoryRenderer({ scene }: { scene: CinematicScene }) {
  const { phase, payload } = scene;
  if (phase === 0) {
    return <div className="absolute inset-0 bg-green-950 z-[9000] animate-pulse"></div>;
  }
  if (phase === 1) {
    return (
      <div className="absolute inset-0 bg-gradient-to-t from-green-950 to-black flex flex-col items-center justify-center p-12 z-[9000] space-y-8">
        <div className="text-yellow-500 font-black text-3xl md:text-5xl uppercase tracking-[0.2em] text-center" style={{ animation: 'sceneSlideFromBottom 1s ease-out' }}>
          SOVEREIGN DOMINANCE ACHIEVED
        </div>
        <div className="text-green-400 font-mono text-sm uppercase max-w-2xl text-center leading-relaxed">
          {payload.reason || 'ALL STRATEGIC OBJECTIVES COMPLETED. GLOBAL HEGEMONY SECURED.'}
        </div>
        <div className="w-full max-w-md border border-green-800 bg-green-900/20 p-6 font-mono text-green-200 text-xs mt-8">
          <div className="flex justify-between mb-2"><span>COMPLETION TIME:</span> <span>{payload.tick} TICKS</span></div>
          <div className="flex justify-between"><span>FINAL ALIGNMENT:</span> <span>SUPREME</span></div>
        </div>
      </div>
    );
  }
  
  // Phase 2 - Golden particle burst + credits
  const particles = Array.from({ length: 30 }).map((_, i) => {
    const angle = (i * 360) / 30;
    const dist = 150 + Math.random() * 100;
    const dx = Math.cos(angle * Math.PI / 180) * dist;
    const dy = Math.sin(angle * Math.PI / 180) * dist;
    return (
      <div 
        key={i} 
        className="absolute w-2 h-2 rounded-full bg-yellow-400 opacity-80"
        style={{ 
          top: '50%', left: '50%', 
          '--dx': `${dx}px`, '--dy': `${dy}px` 
        } as React.CSSProperties & { '--dx': string, '--dy': string }}
      />
    );
  });

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[9000] overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        {particles.map((p, i) => React.cloneElement(p, {
          style: { ...p.props.style, animation: `sceneParticleBurst 2s ease-out forwards` }
        }))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none">
         <div className="text-yellow-500 font-serif italic text-3xl mb-16" style={{ animation: 'sceneFadeIn 2s forwards' }}>
           The world bends to your will.
         </div>
      </div>
      <button className="absolute bottom-16 pointer-events-auto border border-green-600 text-green-500 bg-green-950/30 px-8 py-3 text-xs tracking-widest font-mono uppercase hover:bg-green-900 hover:text-white transition z-50" onClick={() => { useCinematicsStore.getState().clearAllScenes(); window.location.reload(); }}>
        RETURN TO DESK
      </button>
    </div>
  );
}

// =========================================================================
// MASTER MANAGER COMPONENT
// =========================================================================

export default function CinematicsManager() {
  const { activeScene, skipScene, completeScene } = useCinematicsStore();

  if (!activeScene) return null;

  const renderScene = () => {
    switch (activeScene.type) {
      case 'SCENARIO_BOOT': return <ScenarioBootRenderer scene={activeScene} />;
      case 'SCENARIO_START': return <ScenarioStartRenderer scene={activeScene} />;
      case 'PRESIDENTIAL_DAILY_BRIEF': return <PDBSciRenderer scene={activeScene} onComplete={completeScene} />;
      case 'DEFCON_1_LOCKDOWN': return <DefconLockdownRenderer scene={activeScene} />;
      case 'NUCLEAR_EXCHANGE': return <NuclearExchangeScene scene={activeScene} onComplete={completeScene} />;
      case 'REGIME_CHANGE_SEQUENCE': return <RegimeChangeRenderer scene={activeScene} />;
      case 'CEASEFIRE_EPILOGUE': return <CeasefireEpilogueRenderer scene={activeScene} />;
      case 'MARKET_CRASH_BROADCAST': return <MarketCrashRenderer scene={activeScene} />;
      case 'NUCLEAR_AFTERMATH': return <NuclearAftermathRenderer scene={activeScene} />;
      case 'COUP_NARRATIVE': return <CoupNarrativeRenderer scene={activeScene} />;
      case 'PEACE_TREATY_CEREMONY': return <PeaceTreatyRenderer scene={activeScene} />;
      case 'ALLIANCE_SUMMIT': return <AllianceSummitRenderer scene={activeScene} />;
      case 'CYBER_WAR_DECLARATION': return <CyberWarRenderer scene={activeScene} />;
      case 'OPERATIVE_BURNED_REPORT': return <ExtOperativeBurnedRenderer scene={activeScene} />;
      case 'NUCLEAR_DETERRENCE_WIN': return <NuclearDeterrenceRenderer scene={activeScene} />;
      case 'GAME_OVER_DEFEAT': return <GameOverSceneRenderer scene={activeScene} onComplete={completeScene} isVictory={false} />;
      case 'GAME_OVER_VICTORY': return <GameOverSceneRenderer scene={activeScene} onComplete={completeScene} isVictory={true} />;
      default: return null;
    }
  };

  return (
    <>
      <CinematicsSyncController />
      {/* 
        Container must span full screen and be absolutely positioned above HUD.
        Pointer events none is on shake root in App, but here we can block clicks
        except for the skip button. 
      */}
      <div className="absolute inset-0 z-[9999] pointer-events-none">
        {renderScene()}
        <SkipButton onClick={skipScene} isSkippable={activeScene.isSkippable} />
      </div>
    </>
  );
}
