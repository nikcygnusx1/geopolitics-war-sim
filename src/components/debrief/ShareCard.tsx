import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Landmark, FileTerminal, FileText, CalendarCheck2, ShieldAlert, Check } from 'lucide-react';
import { audio } from '../../utils/audio';

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
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    setExportSuccess(false);
    audio.resume();
    audio.sfxKeyClick();

    try {
      // Allow visual styles to settle
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2.2, // Ultra high-definition crisp scaling
        useCORS: true,
        backgroundColor: '#020617', // Solid midnight canvas backing
        logging: false,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: cardRef.current.offsetWidth,
        windowHeight: cardRef.current.offsetHeight
      });

      const url = canvas.toDataURL('image/png', 1.0);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `SOVEREIGN_COMMAND_DEBRIEF_${playerCountryId}_TICK_${tick}.png`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      
      // Secondary tactile audio buzz for success confirming
      audio.playDefconTransition(5); // Play stable harmonic chord
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (e) {
      console.error('Unified screenshot capture error occurred', e);
    } finally {
      setIsExporting(false);
    }
  };

  const isVictory = outcomeType === 'VICTORY';
  const accentColor = isVictory ? '#10b981' : '#f43f5e';
  const secondaryAccent = isVictory ? '#34d399' : '#fb7185';

  return (
    <div id={id} className="relative flex flex-col items-center w-full max-w-[620px]">
      
      {/* 1. SOLID STATIC CARD FRAME (DURABLE EXPORT CANVAS TARGET) */}
      <div 
        ref={cardRef}
        id="debrief-snapshot-canvas"
        className="relative w-full p-8 border border-slate-900 rounded-[2px] bg-slate-950 text-slate-100 font-sans shadow-2xl overflow-hidden select-none"
        style={{
          borderLeftWidth: '5px',
          borderLeftColor: accentColor,
          backgroundImage: 'linear-gradient(to bottom, #020617 0%, #050814 100%)'
        }}
      >
        {/* Ambient grids */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-[0.08] pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/5 to-transparent pointer-events-none" />

        {/* Top classified military header strip */}
        <div className="flex items-center justify-between border-b border-dashed border-slate-800 pb-3 font-mono text-[9px] uppercase tracking-widest text-[#64748b]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
            <span>SOVEREIGN COMMAND INTEL REGISTRY</span>
          </div>
          <span className="font-bold tracking-wider text-slate-500">CLEARANCE: LEVEL-5 DECLASSIFIED</span>
        </div>

        {/* Big Bold Status Resolution & Barcode */}
        <div className="mt-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 
              className="text-2xl md:text-3xl font-black tracking-wider font-mono uppercase leading-none"
              style={{ color: accentColor }}
            >
              {isVictory ? 'CAMPAIGN RESOLVED' : 'SYSTEM OVERRUN'}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2.5 font-mono text-[9px] text-[#94a3b8] uppercase tracking-wide">
              <span>NATION CODE: <strong className="text-white font-black">{playerCountryId}</strong></span>
              <span>•</span>
              <span>CABINET: <strong className="text-white font-black">{playerCountryName} {flagEmoji}</strong></span>
              <span>•</span>
              <span>TIMELINE: <strong className="text-white font-black">{tick} WEEKS</strong></span>
            </div>
          </div>

          {/* Dynamic Authentic Monospace Barcode */}
          <div className="flex flex-col items-end shrink-0 font-mono text-[#334155]">
            <span className="text-[12px] leading-none tracking-tighter">||| | |||| | | |||| | || | ||| ||</span>
            <span className="text-[6.5px] mt-1.5 tracking-widest uppercase">REGISTRY-ID-X-{playerCountryId}</span>
          </div>
        </div>

        {/* Summary Outcome Report Details Box */}
        <div className="mt-4 text-[11px] font-sans text-slate-300 border border-slate-900 border-l-[3px] bg-slate-900/30 p-4 leading-relaxed rounded-[1px]" style={{ borderLeftColor: accentColor }}>
          <div className="font-mono text-[8.5px] text-slate-500 uppercase font-black mb-1.5 tracking-wider">COMMAND DECISION MEMORANDUM // DECLASSIFIED REPORT:</div>
          <p className="text-slate-350 select-text leading-relaxed font-normal">
            <strong className="text-white uppercase font-mono tracking-tight mr-1 text-[10px]" style={{ color: secondaryAccent }}>Verdict:</strong> {outcomeReason}
          </p>
        </div>

        {/* Divided section: mini map + stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Mini Static Vector Map representation for screenshot */}
          <div className="md:col-span-5 bg-slate-950/90 border border-slate-900 p-3.5 rounded-[1.5px] h-[135px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:10px_10px] opacity-[0.06] pointer-events-none" />
            <div className="flex justify-between items-center font-mono text-[7px] text-slate-500 uppercase z-10">
              <span>THEATRE COORDINATES</span>
              <span className="text-[#00ffd5] tracking-widest">[ ACTIVE GRID ]</span>
            </div>
            
            {/* Beautiful static vector schematic lines resembling radar target nodes */}
            <div className="relative flex-1 flex items-center justify-center my-1 select-none">
              <svg className="w-full h-full max-h-[80px]" viewBox="0 0 200 80">
                <circle cx="100" cy="40" r="35" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <circle cx="100" cy="40" r="15" fill="none" stroke="#475569" strokeWidth="0.5" />
                <line x1="30" y1="40" x2="170" y2="40" stroke="#1e293b" strokeWidth="0.5" />
                <line x1="100" y1="5" x2="100" y2="75" stroke="#1e293b" strokeWidth="0.5" />
                {/* Concentric targets for player nation and critical hits */}
                <circle cx="65" cy="30" r="4.5" fill="#00e1ff" fillOpacity="0.25" stroke="#00e1ff" strokeWidth="0.75" />
                <circle cx="65" cy="30" r="1" fill="#fff" />
                <text x="65" y="24" fill="#00e1ff" fontSize="5" fontFamily="monospace" textAnchor="middle">{playerCountryId}</text>

                <circle cx="135" cy="45" r="4.5" fill={accentColor} fillOpacity="0.2" stroke={accentColor} strokeWidth="0.75" />
                <circle cx="135" cy="45" r="1" fill={accentColor} />
                <text x="135" y="55" fill={accentColor} fontSize="5" fontFamily="monospace" textAnchor="middle">OPR-TGT</text>
                
                {/* Trajectory path representing strikes */}
                <path d="M 65 30 Q 100 10 135 45" fill="none" stroke={accentColor} strokeWidth="0.75" strokeDasharray="3 1.5" />
                {/* Secondary radar sweep sweep line */}
                <line x1="100" y1="40" x2="128" y2="18" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.4" />
              </svg>
            </div>

            <div className="font-mono text-[7px] text-[#475569] uppercase flex justify-between z-10 leading-none">
              <span>SCAN INTERVAL: T-0{tick}</span>
              <span>GRID SCALE: DECLASSIFIED</span>
            </div>
          </div>

          {/* Grouped Grid Statistics Block */}
          <div className="md:col-span-7 grid grid-cols-2 gap-3 font-mono">
            
            <div className="p-3 border border-slate-900 bg-slate-950/80 rounded-[1.5px] flex items-center gap-2.5">
              <CalendarCheck2 className="w-5 h-5 text-cyan-500/80 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-500 tracking-wider font-semibold uppercase leading-none">TACTICAL COLLISIONS</span>
                <span className="text-xs font-black text-white mt-1 uppercase">{stats.totalWars} Active Wars</span>
              </div>
            </div>

            <div className="p-3 border border-slate-900 bg-slate-950/80 rounded-[1.5px] flex items-center gap-2.5">
              <Landmark className="w-5 h-5 text-amber-500/80 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-500 tracking-wider font-semibold uppercase leading-none">FINANCIAL FRACTION</span>
                <span className="text-xs font-black text-slate-200 mt-1 uppercase">${stats.totalGdpDestroyed.toLocaleString()}B Lost</span>
              </div>
            </div>

            <div className="p-3 border border-slate-900 bg-slate-950/80 rounded-[1.5px] flex items-center gap-2.5">
              <FileTerminal className="w-5 h-5 text-rose-500/85 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-500 tracking-wider font-semibold uppercase leading-none">DEMOGRAPHIC LOSS</span>
                <span className="text-xs font-black text-slate-200 mt-1 uppercase">{stats.totalCasualties.toLocaleString()} Lost</span>
              </div>
            </div>

            <div className="p-3 border border-slate-900 bg-slate-950/80 rounded-[1.5px] flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-red-500/90 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-500 tracking-wider font-semibold uppercase leading-none">BALLISTIC ATTACK</span>
                <span className="text-xs font-black text-slate-200 mt-1 uppercase">{stats.nukesDetonated} Detonated</span>
              </div>
            </div>

          </div>
        </div>

        {/* Narrative core legacy text block */}
        <div className="mt-6 border-t border-slate-900 pt-5 relative">
          <span className="font-mono text-[8.5px] uppercase tracking-widest text-[#00e1ff] font-bold block mb-2">
            CONSOLIDATED GEOPOLITICAL HISTORICAL CHRONICLE:
          </span>
          <p className="text-[11.5px] text-slate-300 font-sans leading-relaxed text-justify antialiased pr-2 pb-1 bg-[#050912]/50 p-4 border border-slate-900 rounded-[1px] border-l-2 border-cyan-500/40 select-text">
            {legacyNarrative}
          </p>
        </div>

        {/* Vintage Seal Stamp representation overlay inside card */}
        <div className="absolute right-6 bottom-16 w-14 h-14 rounded-full border border-double border-cyan-500/15 flex items-center justify-center font-mono opacity-25 select-none pointer-events-none transform rotate-12">
          <div className="text-[5.5px] font-black text-cyan-400 text-center leading-tight uppercase font-mono tracking-tighter">
            <span>SOVEREIGN<br/>INTEL<br/>VERIFIED</span>
          </div>
        </div>

        {/* Signature stamp rows block for auth verification */}
        <div className="mt-6 pt-4.5 border-t border-slate-900 flex items-center justify-between font-mono text-[8px] text-[#475569]">
          <div className="flex flex-col leading-tight">
            <span>CENTRAL CLASSIFICATION OFFICE</span>
            <span className="text-slate-500 font-bold mt-0.5">VERIFIED SIMULATION RECORD FILE: DEC-4.4</span>
          </div>
          <div className="text-right leading-tight">
            <span>OFFICIAL TRANS-ENDORSEMENT AUTHENTICATION</span>
            <span className="block text-[7.5px] mt-0.5 font-bold tracking-wider uppercase text-[#00ffd5]">COMMAND BUFFER SECURED</span>
          </div>
        </div>
      </div>

      {/* 2. PREMIUM CONTROL SUB-TRIGGER (HIDES ON SCREENSHOT) */}
      <button
        id="debrief-share-export-btn"
        disabled={isExporting}
        onClick={handleExportPng}
        className={`mt-6 w-full flex items-center justify-center gap-2.5 px-6 py-3 border font-bold text-xs tracking-widest uppercase cursor-pointer select-none transition-all font-mono rounded-[2px] ${
          exportSuccess
            ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400 hover:text-emerald-300'
            : 'border-cyan-500/60 hover:border-cyan-400 bg-cyan-950/10 text-cyan-400 hover:text-cyan-300'
        } disabled:opacity-40 disabled:cursor-wait`}
      >
        {exportSuccess ? (
          <>
            <Check className="w-4 h-4 animate-ping text-emerald-400" />
            <span>DOSSIER SUCCESSFULLY DOWNLOADED</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 animate-bounce" />
            <span>{isExporting ? 'COMPRESSING DISPATCH ARTIFACTS...' : 'Export Post-War Dossier (PNG)'}</span>
          </>
        )}
      </button>

    </div>
  );
};
