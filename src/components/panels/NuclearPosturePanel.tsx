import React from 'react';
import { useDefconStore } from '../../store/defconStore';

export default function NuclearPosturePanel() {
  const currentDefconLevel = useDefconStore((s) => s.currentDefconLevel);

  return (
    <div className="h-full flex flex-col p-6 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-red-950/20 pointer-events-none" />
      
      <div className="flex justify-between items-center mb-6 border-b border-red-500/50 pb-4 relative z-10">
        <h2 className="text-red-500 text-xl font-bold tracking-[0.3em] flex items-center shadow-text">
          <span className="animate-pulse mr-3 text-2xl">☢</span>
          STRATEGIC DETERRENCE & NUCLEAR POSTURE
        </h2>
        {currentDefconLevel > 2 && (
          <div className="px-3 py-1 bg-red-950 border border-red-500/50 text-red-500 text-[10px] font-bold tracking-widest uppercase animate-pulse">
            POSTURE LOCKED
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 relative z-10">
        <div className="border border-red-500/20 bg-[#0a0000] p-4 p-8 text-center text-red-500 space-y-4">
          <h3 className="text-sm font-bold tracking-widest text-red-400">STRATEGIC ARSENAL</h3>
          {currentDefconLevel > 2 ? (
             <div className="p-8 border border-red-500/10 text-red-500/50 uppercase tracking-widest text-xs">
                Launch keys securely held. DEFCON elevation required for access.
             </div>
          ) : (
            <div className="p-8 border border-red-500/50 bg-red-950/30 text-red-400 uppercase tracking-widest text-xs animate-pulse">
                ARSENAL PRIMED. AWAITING EXECUTIVE ORDER.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
