import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Landmark, FileTerminal, FileText, CalendarCheck2 } from 'lucide-react';

interface ShareCardProps {
  id: string;
  playerCountryId: string;
  playerCountryName: string;
  flagEmoji: string;
  tick: number;
  outcomeType: 'VICTORY' | 'DEFEAT' | 'NONE';
  outcomeReason: string;
  legacyNarrative: string;
  stats: {
    totalWars: number;
    totalCasualties: number;
    totalGdpDestroyed: number;
    nukesDetonated: number;
  };
}

export const ShareCard: React.FC<ShareCardProps> = ({
  id,
  playerCountryId,
  playerCountryName,
  flagEmoji,
  tick,
  outcomeType,
  outcomeReason,
  legacyNarrative,
  stats,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      // Small timeout to allow styles to settle
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Double-density high-res crisp typography
        useCORS: true,
        backgroundColor: '#020617', // Enforce solid ultra-dark background in export
        logging: false,
        allowTaint: true,
      });

      const url = canvas.toDataURL('image/png', 1.0);
      const trigger = document.createElement('a');
      trigger.href = url;
      trigger.download = `SOVEREIGN_COMMAND_DEBRIEF_${playerCountryId}_TICK_${tick}.png`;
      document.body.appendChild(trigger);
      trigger.click();
      document.body.removeChild(trigger);
    } catch (e) {
      console.error('Debrief screenshot capture failure', e);
    } finally {
      setIsExporting(false);
    }
  };

  const isVictory = outcomeType === 'VICTORY';

  return (
    <div id={id} className="relative flex flex-col items-center">
      {/* 1. Captured Snapshot Block */}
      <div 
        ref={cardRef}
        id="debrief-snapshot-canvas"
        className="relative w-full max-w-[620px] p-7 border-2 rounded-[2px] bg-slate-950 text-slate-100 font-sans shadow-2xl overflow-hidden"
        style={{
          borderColor: isVictory ? '#10b981' : '#ef4444',
          backgroundImage: 'linear-gradient(135deg, rgba(3, 7, 18, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
        }}
      >
        {/* Dossier watermark grid decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.08] pointer-events-none" />

        {/* Top classified banner info */}
        <div className="flex items-center justify-between border-b border-dashed border-slate-800 pb-3 font-mono text-[9px] uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-cyan-400" />
            <span>Sovereign Command Network v4.4 // System Debrief</span>
          </div>
          <span>Security clearance level: ALPHA-1</span>
        </div>

        {/* Header section with big bold outcome */}
        <div className="mt-5 flex items-start justify-between">
          <div className="flex flex-col">
            <h1 
              className="text-3xl font-extrabold tracking-wider font-mono uppercase text-shadow-sm leading-none"
              style={{ color: isVictory ? '#10b981' : '#f43f5e' }}
            >
              {isVictory ? 'CAMPAIGN ACCOMPLISHED' : 'COMMAND MATRIX DEGRADED'}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-slate-400 uppercase tracking-wide">
              <span>NATION CODE: <strong className="text-white">{playerCountryId}</strong></span>
              <span>•</span>
              <span>NOMINAL: <strong className="text-white">{playerCountryName} {flagEmoji}</strong></span>
              <span>•</span>
              <span>TIMELINE: <strong className="text-white">{tick} WEEKS</strong></span>
            </div>
          </div>

          <div 
            className="px-2.5 py-1 text-[8px] font-mono rounded-[2.5px] uppercase border font-extrabold animate-pulse"
            style={{ 
              borderColor: isVictory ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              color: isVictory ? '#10b981' : '#f43f5e',
              background: isVictory ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
            }}
          >
            {isVictory ? 'CLOSED WIN' : 'CRITICAL FAULT'}
          </div>
        </div>

        {/* Sub-text reason display */}
        <div className="mt-3 text-[11px] font-sans text-slate-400 border-l-2 bg-slate-900/40 p-2.5 rounded-[1.5px] border-slate-700 leading-normal font-medium max-w-[95%]">
          <strong>Outcome Report:</strong> {outcomeReason}
        </div>

        {/* Grid metrics summary */}
        <div className="mt-6 grid grid-cols-2 gap-3 font-mono">
          <div className="p-3 border border-slate-900 bg-slate-950/90 rounded-[2px] flex items-center gap-3">
            <CalendarCheck2 className="w-5 h-5 text-slate-500 opacity-60" />
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 tracking-wider font-semibold uppercase leading-tight">Theater Escalations</span>
              <span className="text-xs font-bold text-white mt-0.5">{stats.totalWars} Active Wars</span>
            </div>
          </div>

          <div className="p-3 border border-slate-900 bg-slate-950/90 rounded-[2px] flex items-center gap-3">
            <Landmark className="w-5 h-5 text-slate-500 opacity-60" />
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 tracking-wider font-semibold uppercase leading-tight">Destroyed GDP (Est.)</span>
              <span className="text-xs font-bold text-slate-200 mt-0.5">${stats.totalGdpDestroyed.toLocaleString()} Billion</span>
            </div>
          </div>

          <div className="p-3 border border-slate-900 bg-slate-950/90 rounded-[2px] flex items-center gap-3">
            <FileTerminal className="w-5 h-5 text-slate-500 opacity-60" />
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 tracking-wider font-semibold uppercase leading-tight">Global Casualties</span>
              <span className="text-xs font-bold text-slate-200 mt-0.5">{stats.totalCasualties.toLocaleString()} Lives</span>
            </div>
          </div>

          <div className="p-3 border border-slate-900 bg-slate-950/90 rounded-[2px] flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-500 opacity-60" />
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 tracking-wider font-semibold uppercase leading-tight">Nuclear Launches</span>
              <span className="text-xs font-bold text-slate-200 mt-0.5">{stats.nukesDetonated} Impacts</span>
            </div>
          </div>
        </div>

        {/* Narrative core legacy text */}
        <div className="mt-6 border-t border-dashed border-slate-800 pt-5">
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 block mb-2.5">
            HISTORICAL COMMAND DOSSIER LEGACY
          </span>
          <p className="text-[12px] text-slate-300 font-sans leading-relaxed text-justify antialiased pr-2 pb-1 font-medium bg-slate-900/20 p-3 rounded border border-slate-900">
            {legacyNarrative}
          </p>
        </div>

        {/* Brand footers */}
        <div className="mt-7 pt-3.5 border-t border-dashed border-slate-800/60 flex items-center justify-between font-mono text-[8px] text-slate-600">
          <span>CLASSIFIED RECORD // DO NOT DISTRIBUTE PUBLICLY</span>
          <span>SYSTEM REPORT REFERENCE: #{Math.floor(100000 + Math.random() * 900000)}</span>
        </div>
      </div>

      {/* 2. Export Button controls */}
      <button
        id="debrief-share-export-btn"
        disabled={isExporting}
        onClick={handleExportPng}
        className="mt-6 flex items-center justify-center gap-2.5 px-6 py-3 border border-cyan-500 hover:border-cyan-400 bg-cyan-950/15 text-cyan-400 hover:text-cyan-300 rounded font-semibold text-xs tracking-wider uppercase cursor-pointer select-none transition-all disabled:opacity-50 disabled:cursor-wait font-mono"
      >
        <Download className="w-4 h-4 animate-bounce" />
        {isExporting ? 'EXPORTING DOSSIER EMBARGO...' : 'Export Branded Intelligence Dossier (PNG)'}
      </button>
    </div>
  );
};
