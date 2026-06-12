import React from 'react';
import { useLinkedAnalysisStore, AnalysisMode, PresetFocusMode } from '../../store/linkedAnalysisStore';

export default function AnalysisModeSwitcher() {
  const {
    analysisMode,
    setAnalysisMode,
    presetFocusMode,
    setPresetFocusMode,
  } = useLinkedAnalysisStore();

  const modes: { id: AnalysisMode; label: string; icon: string }[] = [
    { id: 'MAP', label: 'STRATEGIC MAP', icon: '🗺️' },
    { id: 'GRAPH', label: 'RELATION GRAPH', icon: '🕸️' },
    { id: 'TIMELINE', label: 'EVENT TIMELINE', icon: '⏱️' },
    { id: 'SPLIT', label: 'SPLIT WORKSTATION', icon: '🖥️' },
  ];

  const presets: { id: PresetFocusMode; label: string; color: string; indicator: string }[] = [
    { id: 'STRATEGIC', label: 'GLOBAL THEATER', color: 'text-cyan-400 border-cyan-950/40 hover:border-cyan-500/30', indicator: '🟢' },
    { id: 'CONFLICT', label: 'CONFLICT INDEX', color: 'text-red-500 border-red-950/40 hover:border-red-500/30', indicator: '🔴' },
    { id: 'DIPLOMACY', label: 'DIPLOMATIC NETS', color: 'text-emerald-400 border-emerald-950/40 hover:border-emerald-500/30', indicator: '🔵' },
    { id: 'NUCLEAR', label: 'NUCLEAR ALERT', color: 'text-amber-500 border-amber-950/40 hover:border-amber-500/30', indicator: '☢️' },
    { id: 'ECONOMIC', label: 'ECONOMIC PATHS', color: 'text-indigo-400 border-indigo-950/40 hover:border-indigo-500/30', indicator: '🟡' },
  ];

  return (
    <div className="w-full bg-[#020502] border-b border-[#1a3a1a] p-1.5 flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] font-mono shrink-0 select-none">
      {/* 1. Primary Analysis Switcher */}
      <div className="flex gap-1 items-center w-full justify-start overflow-x-auto py-0.5">
        <span className="text-gray-500 font-bold uppercase mr-1 tracking-wider text-[9px] shrink-0">WORKSTATION:</span>
        {modes.map((mode) => {
          const isActive = analysisMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setAnalysisMode(mode.id)}
              className={`px-3 py-1 border text-[9px] flex items-center gap-1.5 uppercase font-bold tracking-wider cursor-pointer transition-all rounded-[1px] ${
                isActive
                  ? 'bg-[#153a15] text-[#00ff44] border-[#00ff44] text-shadow-sm'
                  : 'bg-black/30 border-[#1a3a1a] text-gray-400 hover:text-[#00ff44] hover:bg-[#071307]'
              }`}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Preset Focus Overlays */}
      <div className="flex gap-1 items-center w-full sm:w-auto justify-start sm:justify-end overflow-x-auto py-0.5">
        <span className="text-gray-500 font-bold uppercase mr-1 tracking-wider text-[9px] shrink-0">FOCUS OVERLAY:</span>
        {presets.map((preset) => {
          const isActive = presetFocusMode === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setPresetFocusMode(preset.id)}
              className={`px-2 py-0.5 border text-[8.5px] uppercase font-semibold cursor-pointer transition-all rounded-[1px] flex items-center gap-1 ${
                isActive
                  ? 'bg-amber-950/50 text-[#ffb000] border-[#ffb000] font-bold text-shadow-sm'
                  : `bg-[#030603] ${preset.color} text-current/70`
              }`}
            >
              <span>{preset.indicator}</span>
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
