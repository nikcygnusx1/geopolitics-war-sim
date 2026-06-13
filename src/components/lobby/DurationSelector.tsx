import React from 'react';

// Use exact uppercase types for strict compatibility with the existing Lobby states
interface DurationSelectorProps {
  durationMode: 'SCENARIO' | 'TIMED' | 'ENDLESS';
  setDurationMode: (mode: 'SCENARIO' | 'TIMED' | 'ENDLESS') => void;
  timedTicks: number;
  setTimedTicks: (ticks: number) => void;
  tickScale: 'DAY' | 'WEEK' | 'MONTH';
  setTickScale: (scale: 'DAY' | 'WEEK' | 'MONTH') => void;
  audio: { sfxKeyClick: () => void };
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  durationMode,
  setDurationMode,
  timedTicks,
  setTimedTicks,
  tickScale,
  setTickScale,
  audio
}) => {
  return (
    <div id="duration-config-cockpit" className="space-y-4 bg-black/50 p-3 rounded-lg border border-green-500/20 shadow-md">
      {/* Header */}
      <span className="text-[10px] text-[#00e5ff] font-bold uppercase tracking-widest block border-b border-green-900/40 pb-1.5 flex items-center justify-between">
        <span>⚙️ DURATION PROTOCOLS</span>
        <span className="text-[8px] opacity-70">METRIC_CALIBRATE_v2.0</span>
      </span>

      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider block font-semibold">
          CHOOSE MODE DIRECTION
        </label>
        
        <div className="grid grid-cols-1 gap-2">
          {/* Scenario Option */}
          <button
            id="op-scenario-mode"
            onClick={() => { audio.sfxKeyClick(); setDurationMode('SCENARIO'); }}
            className={`flex items-center justify-between p-2.5 rounded-md border text-left cursor-pointer transition-all ${
              durationMode === 'SCENARIO' 
                ? 'border-[#00ff44] bg-emerald-950/20 text-white shadow-[0_0_12px_rgba(0,255,68,0.15)] shadow-inner' 
                : 'border-green-950/30 bg-black/30 text-gray-400 hover:border-green-800 hover:bg-black/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${durationMode === 'SCENARIO' ? 'bg-[#00ff44] animate-pulse shadow-[0_0_8px_rgba(0,255,68,0.7)]' : 'bg-green-900'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wide">SCENARIO OBJECTIVE</span>
                <span className="text-[8px] text-gray-500">Run until scenario win or loss objectives are resolved</span>
              </div>
            </div>
            <span className="text-[8px] bg-green-900/20 px-1.5 py-0.5 rounded border border-green-500/10 font-bold text-green-400">OBJ_END</span>
          </button>

          {/* Timed Option */}
          <button
            id="op-timed-mode"
            onClick={() => { audio.sfxKeyClick(); setDurationMode('TIMED'); }}
            className={`flex items-center justify-between p-2.5 rounded-md border text-left cursor-pointer transition-all ${
              durationMode === 'TIMED' 
                ? 'border-[#00ff44] bg-emerald-950/20 text-white shadow-[0_0_12px_rgba(0,255,68,0.15)] shadow-inner' 
                : 'border-green-950/30 bg-black/30 text-gray-400 hover:border-green-800 hover:bg-black/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${durationMode === 'TIMED' ? 'bg-[#00ff44] animate-pulse shadow-[0_0_8px_rgba(0,255,68,0.7)]' : 'bg-green-900'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wide">TIMED BUDGET</span>
                <span className="text-[8px] text-gray-500">Play until exact tick budget; outcome evaluated on final step</span>
              </div>
            </div>
            {durationMode === 'TIMED' ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span className="text-[8px] text-[#00ff44] font-bold">TICKS:</span>
                <input
                  type="number"
                  min="5"
                  max="1000"
                  value={timedTicks}
                  onChange={(e) => setTimedTicks(Math.max(5, parseInt(e.target.value) || 100))}
                  className="w-14 bg-black border border-green-500/50 hover:border-green-400 font-extrabold text-[#00ff44] text-[9px] text-center rounded outline-none py-1 focus:ring-1 focus:ring-[#00ff44]"
                />
              </div>
            ) : (
              <span className="text-[8px] bg-green-950/50 px-1.5 py-0.5 rounded border border-green-950 text-gray-500 font-bold">{timedTicks} TICKS</span>
            )}
          </button>

          {/* Endless Option */}
          <button
            id="op-endless-mode"
            onClick={() => { audio.sfxKeyClick(); setDurationMode('ENDLESS'); }}
            className={`flex items-center justify-between p-2.5 rounded-md border text-left cursor-pointer transition-all ${
              durationMode === 'ENDLESS' 
                ? 'border-[#00ff44] bg-emerald-950/20 text-white shadow-[0_0_12px_rgba(0,255,68,0.15)] shadow-inner' 
                : 'border-green-950/30 bg-black/30 text-gray-400 hover:border-green-800 hover:bg-black/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${durationMode === 'ENDLESS' ? 'bg-[#00ff44] animate-pulse shadow-[0_0_8px_rgba(0,255,68,0.7)]' : 'bg-green-900'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wide">ENDLESS OPERATION</span>
                <span className="text-[8px] text-gray-500">Unbounded simulation sandbox with zero win/loss endings</span>
              </div>
            </div>
            <span className="text-[8px] bg-red-950/20 px-1.5 py-0.5 rounded border border-red-500/15 font-bold text-red-400 animate-pulse">NO EXIT</span>
          </button>
        </div>
      </div>

      {/* Tick Scale (Frequency Scale) */}
      <div className="grid grid-cols-1 gap-2 pt-2 border-t border-green-950/40">
        <div className="space-y-1">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider block font-semibold">
            CALENDAR ADVANCE SPEED (TICK WEIGHT)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['DAY', 'WEEK', 'MONTH'] as const).map(scale => (
              <button
                key={scale}
                id={`scale-btn-${scale}`}
                onClick={() => { audio.sfxKeyClick(); setTickScale(scale); }}
                className={`text-[9px] font-bold py-2 border rounded-md cursor-pointer transition-all ${
                  tickScale === scale 
                    ? 'border-[#00ff44] bg-emerald-950/30 text-[#00ff44] font-extrabold shadow-[0_0_8px_rgba(0,255,68,0.1)]' 
                    : 'border-green-950/30 bg-black/30 text-gray-500 hover:text-white hover:border-green-700'
                }`}
              >
                {scale}
              </button>
            ))}
          </div>
          <span className="text-[7.5px] text-gray-600 block mt-1 uppercase">
            * 1 tick advances: {tickScale === 'DAY' ? '1 day (2.0s)' : tickScale === 'WEEK' ? '1 week (3.5s)' : '1 month (6.0s)'}
          </span>
        </div>
      </div>
    </div>
  );
};
