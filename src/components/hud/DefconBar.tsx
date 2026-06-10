import React from 'react';
import { useDefconStore, DEFCON_PALETTES } from '../../store/defconStore';
import { useClockStore } from '../../store/clockStore';
import { usePlayerStore } from '../../store/playerStore';
import { fmtDate, fmtSession } from '../../utils/format';

export const DefconBar: React.FC = () => {
  const currentDefcon = useDefconStore((state) => state.currentDefconLevel);
  const playerCountryId = usePlayerStore((state) => state.countryId);
  
  // Clocks (Section 4.3)
  const calendarDate = useClockStore((state) => state.currentCalendarDate);
  const sessionElapsed = useClockStore((state) => state.sessionElapsedSeconds);
  const currentTick = useClockStore((state) => state.currentTick);

  // Palette details
  const palette = DEFCON_PALETTES[currentDefcon];

  const levels = [
    { value: 5, name: '5 PEACE' },
    { value: 4, name: '4 WATCH' },
    { value: 3, name: '3 ELEVATED' },
    { value: 2, name: '2 ARMED' },
    { value: 1, name: '1 NUCLEAR' },
  ];

  return (
    <div 
      className="w-full bg-[#030603] border-b border-[#1a5c1a] relative z-40 select-none font-mono py-1 px-4 flex justify-between items-center text-[10px]"
      style={{
        borderBottom: `2px solid ${palette.primary}`,
        boxShadow: `0 2px 10px ${palette.panelBg}`,
        animation: currentDefcon === 1 ? 'blink 1.2s infinite' : 'none'
      }}
    >
      {/* HUD left brand */}
      <div className="flex items-center gap-2">
        <span 
          className="font-display font-medium tracking-widest text-[#00ff44] uppercase"
          style={{ color: palette.primary, textShadow: currentDefcon <= 2 ? `0 0 5px ${palette.primary}` : 'none' }}
        >
          SOVEREIGN COMMAND HUB
        </span>
        <span className="text-gray-600">/</span>
        <span className="text-white font-bold tracking-widest">
          COGNATE: {playerCountryId}
        </span>
      </div>

      {/* DEFCON status pips inside HUD with correct palette indicators (Section 6.3) */}
      <div className="flex items-center gap-3">
        <span className="text-gray-500 uppercase tracking-widest text-[8px] font-bold">MILITARY ALERT INDEX:</span>
        <div className="flex gap-2">
          {levels.map((lvl) => {
            const isActive = lvl.value === currentDefcon;
            return (
              <div 
                key={lvl.value}
                className="flex items-center gap-1.5 px-2 py-0.5 border rounded-sm"
                style={{
                  borderColor: isActive ? palette.primary : '#0d2e0d',
                  backgroundColor: isActive ? `${palette.primary}12` : 'transparent',
                  color: isActive ? palette.primary : '#335533',
                  opacity: isActive ? 1 : 0.4
                }}
              >
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{
                    backgroundColor: isActive ? palette.primary : '#0d2e0d',
                    boxShadow: isActive ? `0 0 4px ${palette.primary}` : 'none'
                  }}
                />
                <span className="text-[8px] font-bold tracking-wider">{lvl.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clocks & Chronos Display (Section 4.3) */}
      <div className="flex items-center gap-4 text-[9px]">
        <div className="flex items-center gap-1.5 text-[#ffb300]">
          <span>📅 Date:</span>
          <span className="font-bold tracking-wider uppercase">{fmtDate(calendarDate)}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-[#00ff44]">
          <span>⏱ Session:</span>
          <span className="font-bold tracking-wider">{fmtSession(sessionElapsed)}</span>
        </div>

        <div className="flex items-center gap-1 bg-[#102010] p-1 border border-[#0d2e0d] text-[#00ff44]">
          <span className="text-gray-500">TICK:</span>
          <span className="font-bold">{String(currentTick).padStart(4, '0')}</span>
        </div>
      </div>
    </div>
  );
};

export default DefconBar;
