import React, { useEffect, useState } from 'react';
import { useDefconStore } from '../../store/defconStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { audio } from '../../utils/audio';
import { PersonaId } from '../../types/defconPersona';

export default function DefconBar() {
  const defconLevel = useDefconStore((s) => s.currentDefconLevel);
  const transitionHistory = useDefconStore((s) => s.transitionHistory);
  const previousLevel = transitionHistory.length > 0 ? transitionHistory[0].fromLevel : 5;
  const setDefconLevel = useDefconStore((s) => s.setDefconLevel);
  const activePersona = useDefconStore((s) => s.activePersona);
  const setPersona = useDefconStore((s) => s.setPersona);
  
  const tick = useWorldStore(s => s.currentTick);
  const [localTime, setLocalTime] = useState('');

  // Clock
  useEffect(() => {
    const inter = setInterval(() => {
      const d = new Date();
      setLocalTime(d.toISOString().substring(11, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(inter);
  }, []);

  // Alert sounds
  useEffect(() => {
    if (defconLevel < previousLevel) {     
      if (defconLevel === 1) {
        audio.sfxNuclearAlarm();
      } else if (defconLevel <= 3) {
        audio.sfxCrisisWarning();
      } else {
        audio.sfxIntelChime();
      }
    }
  }, [defconLevel, previousLevel]);

  const levelColors: Record<number, string> = {
    5: 'text-cyan-400 bg-cyan-950 border-cyan-800 shadow-[0_0_15px_rgba(34,211,238,0.2)]',
    4: 'text-green-400 bg-green-950 border-green-800 shadow-[0_0_15px_rgba(74,222,128,0.2)]',
    3: 'text-yellow-400 bg-yellow-950 border-yellow-800 shadow-[0_0_15px_rgba(250,204,21,0.2)]',
    2: 'text-orange-500 bg-orange-950 border-orange-800 shadow-[0_0_20px_rgba(249,115,22,0.3)] animate-pulse',
    1: 'text-red-500 bg-red-950 border-red-700 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-ping'
  };

  const textColors: Record<number, string> = {
    5: 'text-cyan-400', 4: 'text-green-400', 3: 'text-yellow-400', 2: 'text-orange-500', 1: 'text-red-500'
  };

  const activeColorClass = levelColors[defconLevel] || levelColors[5];
  const activeTextColor = textColors[defconLevel] || textColors[5];

  const getWarningMessage = () => {
    switch (defconLevel) {
      case 5: return "NORMAL READINESS // ROUTINE STATE WATCH // NO IMMINENT THREATS DETECTED";
      case 4: return "INCREASED INTELLIGENCE WATCH // HEIGHTENED REGIONAL TENSIONS // MAINTAIN SURVEILLANCE";
      case 3: return "FORCE READINESS INCREASED // MOBILIZING ASSETS // PREPARE FOR POTENTIAL HOSTILITIES";
      case 2: return "FURTHER INCREASES TO READINESS // IMMINENT THREAT ACTIVE // ARMING ORDNANCE";
      case 1: return "!!! MAXIMUM READINESS !!! // NUCLEAR WAR IMMINENT OBTAIN COMMAND CODES // !!! STANDBY LAUNCH !!!";
      default: return "";
    }
  };

  return (
    <div className={`fixed top-0 left-0 w-full z-50 transition-colors duration-[1500ms] ${defconLevel === 1 ? 'bg-red-950/30 border-b border-red-600/50' : 'bg-black/85 border-b border-[#222]'} backdrop-blur-md`}>
      {/* CRT SCANLINE */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }}></div>
      
      <div className="flex h-16 w-full items-stretch font-mono relative">
        {/* LEFT COMPARTMENT */}
        <div className="flex-1 flex flex-col justify-between px-6 py-2 border-r border-[#333] relative">
          <div className="flex justify-between items-center w-full">
            <span className={`text-[10px] font-bold tracking-widest uppercase opacity-80 ${activeTextColor}`}>SOVEREIGN COMMAND // SECURE LINK</span>
            <span className="text-[10px] text-gray-400">{localTime}</span>
          </div>
          
          <div className="overflow-hidden whitespace-nowrap text-[9px] text-gray-500 tracking-widest mt-auto">
            <div className={`inline-block whitespace-nowrap flex gap-8 ${defconLevel <= 3 ? 'animate-[marquee_15s_linear_infinite]' : ''}`}>
              <span className={defconLevel === 1 ? 'text-red-400 font-bold' : ''}>{getWarningMessage()}</span>
              {defconLevel <= 3 && <span className={defconLevel === 1 ? 'text-red-400 font-bold' : ''}>{getWarningMessage()}</span>}
            </div>
          </div>
        </div>

        {/* CENTER COMPARTMENT / DEFCON BOARD */}
        <div className="w-[420px] shrink-0 border-r border-l border-[#444] bg-[#0c0c0c] flex items-center justify-center p-1 relative z-10 box-border">
          <div className="flex gap-2 items-center justify-center h-full w-full">
            {[5, 4, 3, 2, 1].map((lvl) => {
              const isActive = defconLevel === lvl;
              const lvlColor = levelColors[lvl];
              const textC = textColors[lvl];
              return (
                <button
                  key={lvl}
                  onClick={() => { audio.sfxKeyClick(); setDefconLevel(lvl as import('../../store/defconStore').DefconLevel, 'PLAYER', 'Manual Override', tick); }}
                  className={`
                    relative flex flex-col items-center justify-center transition-all cursor-pointer select-none
                    ${isActive ? 'w-24 h-14 border border-current shadow-inner scale-105 z-10' : 'w-12 h-10 border border-gray-800 opacity-40 hover:opacity-100 hover:scale-100 bg-black scale-95'}
                    ${isActive ? lvlColor : 'text-gray-600'}
                  `}
                  style={{
                    clipPath: 'polygon(15% 0, 85% 0, 100% 100%, 0% 100%)'
                  }}
                >
                  <span className={`text-[8px] font-black tracking-widest uppercase mb-[-2px] ${isActive ? '' : 'hidden'}`}>DEFCON</span>
                  <span className={`text-xl font-black ${isActive ? '' : 'text-sm'}`}>{lvl}</span>
                  {isActive && lvl === 1 && (
                    <span className="absolute inset-0 bg-red-500 mix-blend-screen opacity-20 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COMPARTMENT */}
        <div className="flex-1 flex flex-col justify-center px-6 py-2 relative gap-1 border-l border-[#333]">
          <div className="flex justify-between items-center text-[10px] tracking-wide text-gray-400">
            <span>T-TICK <span className="text-white">{tick}</span></span>
            <div className="flex gap-2">
              <span>PERSONA:</span>
              <button 
                onClick={() => { audio.sfxKeyClick(); setPersona('STRATEGIC_COMMAND'); }}
                className={`px-1.5 rounded transition ${activePersona === 'STRATEGIC_COMMAND' ? 'bg-zinc-800 text-white font-bold' : 'hover:bg-zinc-900'}`}>
                STRATEGIC_COMMAND
              </button>
              <button 
                onClick={() => { audio.sfxKeyClick(); setPersona('ANALYST'); }}
                className={`px-1.5 rounded transition ${activePersona === 'ANALYST' ? 'bg-zinc-800 text-cyan-400 font-bold' : 'hover:bg-zinc-900'}`}>
                ANALYST
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* MARQUEE ANIMATION STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}
