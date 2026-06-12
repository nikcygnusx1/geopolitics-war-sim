import React from 'react';

export interface IntroPhase {
  startTime: number;  // ms from intro start
  label: string;
  briefingLines: string[];  // Lines that appear in the text panel during this phase
}

export const INTRO_PHASES: IntroPhase[] = [
  {
    startTime: 2000,
    label: 'UPLINK',
    briefingLines: [
      'SECURE UPLINK ESTABLISHED...',
      'VERIFYING CLEARANCE: COSMIC TOP SECRET // LEVEL-9',
      'NODE: SOVEREIGN-ALPHA // PING: 12ms',
      'AUTHENTICATION: CONFIRMED',
      '',
      'GLOBAL SITUATION ASSESSMENT LOADING...',
    ],
  },
  {
    startTime: 4000,
    label: 'CONFLICTS',
    briefingLines: [
      '▶ CONFLICT INTELLIGENCE LAYER — ACTIVE',
      'SCANNING ACLED CONFLICT DATABASE...',
      'ACTIVE THEATRES IDENTIFIED: 9',
      'HIGHEST THREAT: TAIWAN STRAIT // CRITICAL SHIELD',
      'EASTERN EUROPE: ACTIVE KINETIC OPERATIONS',
      'LEVANT BASIN: RED ALERT — ESCALATION RISK HIGH',
    ],
  },
  {
    startTime: 9000,
    label: 'MILITARY',
    briefingLines: [
      '▶ SOVEREIGN FORCE DEPLOYMENTS — CLASSIFIED',
      'CARRIER GROUPS: 7 OPERATIONAL / 2 IN TRANSIT',
      'NATO FORWARD POSTURE: ELEVATED',
      'PLA EASTERN COMMAND: EXERCISES ONGOING',
      'RUSSIAN SIBERIAN DIVISION: REPOSITIONED',
    ],
  },
  {
    startTime: 14000,
    label: 'NUCLEAR',
    briefingLines: [
      '▶ NUCLEAR POSTURE ASSESSMENT — EYES ONLY',
      'STATES WITH ACTIVE LAUNCH AUTHORITY: 9',
      'DEFCON STATUS: 4 // INCREASED WATCH',
      'ICBM READINESS: MULTIPLE NATIONS ELEVATED',
      'HAARP WEATHER PLATFORM: STANDBY',
      '⚠ NUCLEAR EXCHANGE PROBABILITY: 4.7%',
    ],
  },
  {
    startTime: 19000,
    label: 'ECONOMIC',
    briefingLines: [
      '▶ GLOBAL SUPPLY CHAIN INTELLIGENCE',
      'STRAIT OF HORMUZ: 18% GLOBAL OIL AT RISK',
      'BAB AL-MANDAB: TRAFFIC DIVERTED — +$8.4B COST',
      'SEMICONDUCTOR SUPPLY: CRITICAL — 2 NATIONS',
      'FOOD SECURITY INDEX: AMBER — 14 NATIONS',
      'SOVEREIGN DEFAULT RISK: ELEVATED — 6 NATIONS',
    ],
  },
  {
    startTime: 24000,
    label: 'ASSIGNMENT',
    briefingLines: [
      '▶ COMMANDER ASSIGNMENT CONFIRMED',
      '',
      'SOVEREIGN COMMAND AUTHORIZATION: GRANTED',
      'THEATRE: GLOBAL // CLEARANCE: COSMIC TOP SECRET',
      'STANDING ORDERS: NONE. THE WORLD IS YOURS.',
      '',
      '> ENTERING SECURE COMMAND ARCHITECTURE...',
    ],
  },
];

export interface IntroProgressBarProps {
  elapsedMs: number;
  totalMs: number;   // 30000
  onSkip: () => void;
}

export const IntroProgressBar: React.FC<IntroProgressBarProps> = ({
  elapsedMs,
  totalMs,
  onSkip,
}) => {
  const progress = Math.min(elapsedMs / totalMs, 1);
  const segments = INTRO_PHASES;

  return (
    <div 
      className="fixed bottom-7 left-0 right-0 px-6 z-[200] flex items-center gap-3.5 pointer-events-none select-none font-mono"
    >
      {/* SKIP button — left, pointer-events on */}
      <button
        id="intro-skip-button"
        onClick={onSkip}
        className="pointer-events-auto shrink-0 bg-transparent text-[8px] font-bold tracking-[0.2em] text-[#8ea4adbf] border border-[#1e3540cc] px-3.5 py-1.5 cursor-pointer uppercase transition-all duration-300 hover:text-[#e8f0f2] hover:border-[#2e5060]"
      >
        SKIP BRIEFING ›
      </button>

      {/* Progress bar */}
      <div className="flex-1 h-0.5 bg-[#1e3540cc] relative">
        {/* Phase segment markers */}
        {segments.map((phase, i) => (
          <div
            key={i}
            className="absolute -top-0.5 w-[1px] h-2 transition-colors duration-300"
            style={{
              left: `${(phase.startTime / totalMs) * 100}%`,
              backgroundColor: elapsedMs >= phase.startTime
                ? '#00e5c8'
                : '#3d5a63cc',
            }}
          />
        ))}

        {/* Filled progress */}
        <div 
          className="h-full transition-all duration-100 ease-linear"
          style={{
            width: `${progress * 100}%`,
            background: 'linear-gradient(to right, #006b5e, #00e5c8)',
            boxShadow: '0 0 6px rgba(0,229,200,0.6)',
          }}
        />

        {/* Leading pulse */}
        <div 
          className="absolute -top-0.5 w-0.5 h-2 bg-[#00e5c8] -translate-x-1/2"
          style={{
            left: `${progress * 100}%`,
            boxShadow: '0 0 8px #00e5c8',
          }}
        />
      </div>

      {/* Phase label */}
      <div className="shrink-0 min-w-[90px] text-right text-[8px] tracking-[0.18em] text-[#8ea4adbf] uppercase">
        T+ {(elapsedMs / 1000).toFixed(1)}s
      </div>
    </div>
  );
};
