import React from 'react';
import { useLeaderStore } from '../../store/leaderStore';

interface LeaderPortraitProps {
  countryId: string;
}

export const LeaderPortrait: React.FC<LeaderPortraitProps> = ({ countryId }) => {
  const leader = useLeaderStore((state) => state.leadersByCountryId[countryId]);

  if (!leader || !leader.portraitDataUrl) {
    return (
      <div className="w-[124px] h-[154px] border border-[#1a5c1a] bg-[#071307] rounded flex items-center justify-center text-[9px] text-[#00ff44] font-mono tracking-widest uppercase animate-pulse">
        [SCANNING...]
      </div>
    );
  }

  return (
    <div className="relative w-[124px] h-[154px] border border-[#1a5c1a] bg-black p-1 rounded shadow-lg overflow-hidden flex flex-col items-center justify-center">
      {/* 64x64 crisp procedural face with retro scaling and fallback references */}
      <img 
        src={leader.portraitDataUrl} 
        alt={leader.name}
        className="w-[112px] h-[112px] object-cover border border-[#1a5c1a]/55 rounded mb-1 bg-[#050a05]"
        style={{ imageRendering: 'pixelated' }}
        referrerPolicy="no-referrer"
      />
      
      {/* ID classification subtitle tag */}
      <div className="text-[7px] font-mono text-green-500/75 leading-tight tracking-wider uppercase flex items-center gap-1 select-all">
        <span className="w-1 h-1 bg-[#ff2244] rounded-full animate-pulse inline-block" />
        <span>{leader.id}</span>
      </div>

      {/* Retro CRT Phosphor Line overlay wrapper */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,255,0,0.02)_50%,rgba(0,0,0,0.08)_50%)] bg-[length:100%_3px]" />
    </div>
  );
};

export default LeaderPortrait;
