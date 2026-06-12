import React, { useMemo, useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { useLinkedAnalysisStore } from '../../store/linkedAnalysisStore';
import { parseGlobalEvent, StructuredEvent } from '../../utils/eventConverter';

export default function TimelineStrip() {
  const globalEventLog = useWorldStore((s) => s.globalEventLog);
  const currentTick = useWorldStore((s) => s.currentTick);
  
  const {
    selectedEventId,
    selectEvent,
    selectedCountryId,
    selectCountry,
  } = useLinkedAnalysisStore();

  const [hoveredEvent, setHoveredEvent] = useState<StructuredEvent | null>(null);

  // Parse logs into structured events
  const parsedEvents = useMemo(() => {
    return globalEventLog
      .map((raw, idx) => parseGlobalEvent(raw, idx))
      // Only keep actual events of interest and skip purely repetitive system loading events if too many
      .reverse(); // chronological order (tick 0 to currentTick)
  }, [globalEventLog]);

  // Color mappings for event types
  const typeStyles: Record<string, { bg: string; border: string; label: string }> = {
    STRIKE: { bg: 'bg-red-500', border: 'border-red-400', label: '💥 STRIKE' },
    SANCTION: { bg: 'bg-orange-500', border: 'border-orange-400', label: '🚫 SANCTIONS' },
    DIPLOMACY: { bg: 'bg-emerald-500', border: 'border-emerald-400', label: '🤝 DIPLOMACY' },
    COVERT_OP: { bg: 'bg-fuchsia-500', border: 'border-fuchsia-400', label: '🕵️ COVERT OP' },
    RESEARCH: { bg: 'bg-cyan-500', border: 'border-cyan-400', label: '🔬 RESEARCH' },
    FISCAL: { bg: 'bg-pink-500', border: 'border-pink-400', label: '⚖️ DECREE' },
    MARKET: { bg: 'bg-amber-400', border: 'border-amber-300', label: '📈 MARKET SHOCK' },
    SYSTEM: { bg: 'bg-slate-400', border: 'border-slate-300', label: '⚙️ SYSTEM' },
    OTHER: { bg: 'bg-slate-600', border: 'border-slate-500', label: '📡 SIGNAL' },
  };

  const handleEventClick = (evt: StructuredEvent) => {
    selectEvent(evt.id);
    // Linked Propagation: If event has a source/target, select it!
    if (evt.sourceCountryId) {
      selectCountry(evt.sourceCountryId);
    } else if (evt.targetCountryId) {
      selectCountry(evt.targetCountryId);
    }
  };

  return (
    <div className="w-full bg-[#020502] border-t border-[#1a5c1a] p-2 flex flex-col font-mono text-[10px] shrink-0 select-none relative">
      {/* 1. Header with details or active selection tracker */}
      <div className="flex justify-between items-center text-[9px] text-gray-400 mb-1 leading-none uppercase">
        <div className="flex items-center gap-1.5">
          <span className="animate-ping w-1.5 h-1.5 rounded-full bg-[#00ff44]" />
          <span className="font-bold text-white tracking-widest text-[8.5px]">CHRONOLOGICAL TELEMETRY RAIL</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500 text-[8px]">ACTIVE RECORD: {parsedEvents.length} SCANS</span>
        </div>

        {/* Hover info overview */}
        <div className="h-4 flex items-center">
          {hoveredEvent ? (
            <div className="text-[8.5px] text-[#ffb000] flex gap-2 items-center font-bold bg-[#0a1e0a] border border-[#1a5c1a]/30 px-2 py-0.5 rounded-[1px] animate-fade-in">
              <span>[TICK {hoveredEvent.tick}]</span>
              <span>{typeStyles[hoveredEvent.type]?.label}:</span>
              <span className="text-white truncate max-w-[200px] sm:max-w-[320px]">{hoveredEvent.description}</span>
            </div>
          ) : selectedEventId ? (
            <div className="text-[8.5px] text-[#00ff44] font-bold">
              [LOCKED EVENT REFERENCE SELECTED - PINNED IN WS]
            </div>
          ) : (
            <span className="text-gray-600 italic">[HOVER DOT TO TRACE WAVEFORM]</span>
          )}
        </div>
      </div>

      {/* 2. Interactive SVG Track */}
      <div className="relative h-6 bg-[#010401] rounded border border-[#123612]/60 overflow-visible mt-1 flex items-center px-2">
        {/* Underlay tick grid lines */}
        <div className="absolute inset-x-0 bottom-0 top-0 flex justify-between pointer-events-none opacity-20">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="h-full w-[1px] bg-[#1a5c1a] relative">
              <span className="absolute bottom-0 text-[6.5px] text-[#00ff44] -translate-x-1/2 scale-75 select-none origin-bottom">
                {Math.round((i / 10) * currentTick)}
              </span>
            </div>
          ))}
        </div>

        {/* Track slider node path */}
        <div className="absolute inset-x-3 h-[1px] bg-[#1a5c1a]/30" />

        {/* Active event node markers */}
        <div className="absolute inset-x-3 left-4 right-4 h-full flex items-center relative overflow-visible">
          {parsedEvents.map((evt) => {
            const ratio = currentTick > 0 ? (evt.tick / currentTick) : 0.5;
            const style = typeStyles[evt.type] || typeStyles.OTHER;
            const isSelected = selectedEventId === evt.id;
            const isRelated = selectedCountryId && (evt.sourceCountryId === selectedCountryId || evt.targetCountryId === selectedCountryId);

            return (
              <button
                key={evt.id}
                onMouseEnter={() => setHoveredEvent(evt)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => handleEventClick(evt)}
                style={{ left: `${ratio * 100}%` }}
                className={`absolute w-2 h-2 rounded-full cursor-pointer transition-all hover:scale-150 transform -translate-x-1/2 ${style.bg} ${
                  isSelected 
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-125 z-20' 
                    : isRelated 
                    ? 'ring-1 ring-[#00ff44] scale-110 z-10 animate-pulse' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
export { parseGlobalEvent };
