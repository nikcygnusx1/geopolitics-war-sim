import React from 'react';
import { useDefconStore, DEFCON_PALETTES } from '../../store/defconStore';
import { useClockStore } from '../../store/clockStore';
import { usePlayerStore } from '../../store/playerStore';
import { fmtDate, fmtSession } from '../../utils/format';
import { RadiationCounter } from './RadiationCounter';

export const DefconBar: React.FC = () => {
  const currentDefcon = useDefconStore((state) => state.currentDefconLevel);
  const playerCountryId = usePlayerStore((state) => state.countryId);
  
  // Clocks
  const calendarDate = useClockStore((state) => state.currentCalendarDate);
  const sessionElapsed = useClockStore((state) => state.sessionElapsedSeconds);
  const currentTick = useClockStore((state) => state.currentTick);

  // Palette details for legacy safety
  const palette = DEFCON_PALETTES[currentDefcon];

  const levels = [
    { value: 5, name: 'PEACE 5' },
    { value: 4, name: 'WATCH 4' },
    { value: 3, name: 'ELEVATED 3' },
    { value: 2, name: 'ARMED 2' },
    { value: 1, name: 'NUCLEAR 1' },
  ];

  return (
    <div 
      id="defcon-bar-root"
      className="w-full bg-[#020502] border-b relative z-40 select-none py-1.5 px-4 flex justify-between items-center transition-all duration-300"
      style={{
        borderBottom: `2.5px solid var(--defcon-accent)`,
        boxShadow: `0 2px 14px var(--defcon-accent-soft)`,
        animation: currentDefcon === 1 ? 'flicker 1.5s infinite' : 'none'
      }}
    >
      {/* Top micro line accent */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1.5px] opacity-70"
        style={{ backgroundColor: 'var(--defcon-accent)' }}
      />

      {/* HUD left brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: 'var(--defcon-accent)', boxShadow: 'var(--defcon-accent-glow)' }} />
          <span 
            className="classification font-bold tracking-widest text-[9.5px]"
            style={{ 
              color: 'var(--defcon-accent)', 
              textShadow: 'var(--green-glow-sm)'
            }}
          >
            TOP SECRET SOVEREIGN COMMAND EYES ONLY
          </span>
        </div>
        <span className="chrome text-gray-700 font-bold">/</span>
        <span className="chrome text-gray-300 text-[9.5px] font-black tracking-wider bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">
          COGNATE DIRECTORY: {playerCountryId || 'SEC-01'}
        </span>
      </div>

      {/* DEFCON status pips inside HUD with smooth transitioning indicators */}
      <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-3 py-1 rounded-sm shadow-inner">
        <span className="chrome text-[9.5px] font-extrabold text-gray-500 tracking-wider">DEFCON APERTURE STATE:</span>
        <div className="flex gap-1.5">
          {levels.map((lvl) => {
            const isActive = lvl.value === currentDefcon;
            return (
              <div 
                key={lvl.value}
                id={`defcon-pip-btn-${lvl.value}`}
                onClick={() => useDefconStore.getState().setDefconLevel(lvl.value as any, 'PLAYER', 'Manual command override', currentTick)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 border rounded-sm cursor-pointer transition-all"
                style={{
                  borderColor: isActive ? 'var(--defcon-accent)' : 'rgba(255, 255, 255, 0.04)',
                  backgroundColor: isActive ? 'var(--defcon-accent-soft)' : 'transparent',
                  color: isActive ? 'var(--defcon-accent)' : '#444c45',
                  opacity: isActive ? 1 : 0.45,
                  boxShadow: isActive ? 'var(--green-glow-sm)' : 'none'
                }}
              >
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{
                    backgroundColor: isActive ? 'var(--defcon-accent)' : '#19241b',
                    boxShadow: isActive ? 'var(--defcon-accent-glow)' : 'none'
                  }}
                />
                <span className="data-inline text-[8px] font-black tracking-widest">{lvl.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clocks, Radiation, and Chronos Display */}
      <div className="flex items-center gap-3 text-[9.5px]">
        <RadiationCounter />
        <div className="flex items-center gap-1.5 border border-white/5 bg-black/30 px-2 py-0.5 rounded">
          <span className="chrome text-gray-500 font-bold uppercase tracking-wider">📅 date:</span>
          <span className="data-inline font-black tracking-wider uppercase animate-pulse" style={{ color: 'var(--defcon-accent)' }}>{fmtDate(calendarDate)}</span>
        </div>
        
        <div className="flex items-center gap-1.5 border border-white/5 bg-black/30 px-2 py-0.5 rounded">
          <span className="chrome text-gray-500 font-bold uppercase tracking-wider">⏱ elapsed:</span>
          <span className="data-inline font-black tracking-widest text-[#00ff44]">{fmtSession(sessionElapsed)}</span>
        </div>

        <div className="flex items-center gap-1.5 border px-2 py-0.5 bg-[#0a100a]/70 rounded" style={{ borderColor: 'var(--defcon-accent)' }}>
          <span className="chrome text-gray-500 font-extrabold tracking-wider">TICK:</span>
          <span className="data-inline font-black tracking-widest animate-pulse" style={{ color: 'var(--defcon-accent)' }}>
            {String(currentTick).padStart(4, '0')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DefconBar;
