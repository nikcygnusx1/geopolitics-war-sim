import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, FileText, ZoomIn, ZoomOut, Maximize2, X, Fingerprint, Lock, ShieldAlert, Cpu } from 'lucide-react';
import { WorldState } from '../../types';
import { audio } from '../../utils/audio';

interface ClassifiedEvidenceDeskProps {
  worldState: WorldState;
  stats: {
    totalWars: number;
    totalCasualties: number;
    totalGdpDestroyed: number;
    nukesDetonated: number;
  };
  playerCountryName: string;
  isVictory: boolean;
}

interface EvidenceCardData {
  id: string;
  category: 'SATELLITE' | 'SIGINT' | 'FIELD RECON' | 'CYBER CORPS';
  refCode: string;
  title: string;
  date: string;
  coordinates: string;
  brief: string;
  prose: string;
}

export const ClassifiedEvidenceDesk: React.FC<ClassifiedEvidenceDeskProps> = ({
  worldState,
  stats,
  playerCountryName,
  isVictory
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mouse coordinate tracker for spotlight radial gradients hover
  const [[hoverX, hoverY], setHoverPos] = useState<[number, number]>([0, 0]);
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoverPos([x, y]);
    setActiveHoverId(id);
  };

  const handleCardClick = (id: string) => {
    audio.resume();
    audio.playIntelPing('cyber'); // tactile decryption beep click
    setSelectedCardId(id);
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  const handleCloseLightbox = () => {
    audio.resume();
    audio.sfxKeyClick();
    setSelectedCardId(null);
  };

  // Derive genuine contextual evidence cards from simulation state
  const evidenceCards = useMemo(() => {
    const cards: EvidenceCardData[] = [];

    // Card 1: Decrypted Signals Wire Intercept (Always present)
    cards.push({
      id: 'cyber-penetration',
      category: 'CYBER CORPS',
      refCode: 'SIGINT-CABLE-DECRYPTED',
      title: 'COVERT GRID MILITARY INTEXP',
      date: 'Sim-Tick ACTIVE',
      coordinates: '34.93°N, 61.22°E',
      brief: 'Decrypted communications cables indicate widespread grid network interference and coordinated psychological cyber proxy operations.',
      prose: `Surveillance operatives intercepted encrypted secure frequency loops emitting continuous subversion signals. Telemetry traces suggest covert campaigns targeted local sovereign infrastructure directly—culminating in structural public unrest and severe defensive grid compromises. Geopolitical algorithms estimated the subversion network retained an active penetration gravity of 78% of metropolitan networks, compounding defensive delays in launching ABM countermeasures.`
    });

    // Card 2: Thermonuclear burst telemetry (Only if nukesDetonated)
    if (stats.nukesDetonated > 0) {
      cards.push({
        id: 'nuke-strike',
        category: 'SATELLITE',
        refCode: 'RECON-SAT-ALPHA09',
        title: 'THERMONUCLEAR BURST SIGMA',
        date: `TICK-X IMPACT_STRIKES`,
        coordinates: '42.12°N, 110.45°E',
        brief: 'High-altitude strategic recon satellites captured violent superheat flash signatures, validating multiple nuclear payloads breaching metropolitan air defense lines.',
        prose: `Thermal sensors on satellite recon asset LEO-9 logged a transient luminance spike exceeding 15 million lumens—confirming high-yield ground level blast sequences. Radiations fallout modeling suggests metropolitan sectors experienced catastrophic atomic disruption, fracturing grid integrity factors and yielding immediate casualties. Bypassed ABM shield segments collapsed down to 12% operational status immediately following impact.`
      });
    }

    // Card 3: Kinetic bombardment (If lives lost or wars)
    if (stats.totalCasualties > 0 || stats.totalWars > 0) {
      cards.push({
        id: 'kinetic-strikes',
        category: 'FIELD RECON',
        refCode: 'SITREP-TACTICAL-210',
        title: 'TACTICAL BOMBARDMENT SIGMA',
        date: `TICK-LOG CHRONO`,
        coordinates: '51.48°N, 0.05°W',
        brief: 'Combat photography logs confirm high-velocity cruise missile impacts and saturated artillery bombardments breaking sovereign security sectors.',
        prose: `Ground surveillance reports and field photos indicate saturation of defense grids by hypersonic and tactical missile units. Damage reports outline substantial structural crumbling across heavy manufacturing docks and military airbases. Emergency civilian response units registered overwhelming demographical casualties with over 45% critical infrastructure sectors completely severed or localized during climax escalation ticks.`
      });
    }

    // Card 4: Economic supply blockade (Always as financial report)
    cards.push({
      id: 'economic-blockade',
      category: 'SIGINT',
      refCode: 'TREASURY-INTERDICT-X8',
      title: 'FINANCIAL BLOCKADE SIGMA',
      date: 'WEEKLY FISCAL CLAMP',
      coordinates: '40.71°N, 74.00°W',
      brief: 'Intelligence analysis reports widespread treasury assets isolation and multilateral trade embargoes blocking sovereign bond trading pathways.',
      prose: `Multilateral financial interdicts severed traditional capital streams, generating severe currency depreciation rating. Economic intelligence profiles report substantial asset seizures, cutting sovereign trade pipelines by approximately 65%. Central reserves registered major debt stress indices, forcing printing press operations into hyper-inflationary cycles to offset defense sector budget deficits.`
    });

    return cards;
  }, [stats, isVictory]);

  const activeLightboxCard = evidenceCards.find((c) => c.id === selectedCardId);

  // Drag to pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMoveDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      
      {/* Title */}
      <span className="font-mono text-[9px] uppercase tracking-widest text-[#64748b] font-black block">
        CLASSIFIED INTEL MEDIA & VISUAL EVIDENCE DOSSIERS
      </span>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidenceCards.map((card) => {
          const isCurrentlyHovered = activeHoverId === card.id;
          
          return (
            <div
              key={card.id}
              id={`evidence-card-${card.id}`}
              onMouseMove={(e) => handleMouseMove(e, card.id)}
              onMouseLeave={() => setActiveHoverId(null)}
              onClick={() => handleCardClick(card.id)}
              className="border border-slate-900 bg-slate-950/80 p-4.5 rounded-[2px] transition-all hover:border-cyan-500/35 shadow-md flex flex-col justify-between h-[180px] relative cursor-pointer overflow-hidden group select-none"
              style={{
                // Spotlight lighting projection using mouse coords
                background: isCurrentlyHovered
                  ? `radial-gradient(circle 120px at ${hoverX}px ${hoverY}px, rgba(0, 225, 255, 0.08) 0%, #020617 100%)`
                  : '#020617'
              }}
            >
              <div className="absolute right-3.5 bottom-3.5 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <Camera className="w-14 h-14 text-white" />
              </div>

              {/* Card Meta Header */}
              <div>
                <div className="flex justify-between items-center font-mono text-[8px] text-[#475569]">
                  <span className="font-black text-slate-500 uppercase flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    {card.category} // {card.refCode}
                  </span>
                  <span>TICKS REGISTERED</span>
                </div>

                <h3 className="font-mono font-bold text-xs uppercase text-white mt-2 group-hover:text-cyan-400 transition-colors">
                  {card.title}
                </h3>
                
                <p className="font-sans text-[11px] text-slate-400 leading-relaxed mt-2.5 line-clamp-3 italic">
                  "{card.brief}"
                </p>
              </div>

              {/* Card Meta footer */}
              <div className="border-t border-slate-900/60 pt-2 flex justify-between items-center font-mono text-[8.5px] text-[#525252] leading-none">
                <span>GPS REF: {card.coordinates}</span>
                <span className="text-[#00ffd5] opacity-60 font-black group-hover:opacity-100 transition-opacity">
                  [ VIEW DECLASSIFICATION ]
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN SYSTEM MONITOR DECLASSIFIED LIGHTBOX OVERLAY */}
      <AnimatePresence>
        {activeLightboxCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/98 backdrop-blur-md z-[110] flex items-center justify-center p-4 md:p-8 select-none"
          >
            {/* CRT monitor scan grid line effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[size:100%_4px] opacity-35 pointer-events-none" />
            <div className="absolute inset-x-0 h-[2px] bg-cyan-500/10 top-0 pointer-events-none animate-scanline" />

            <div className="w-full max-w-6xl bg-slate-950 border border-slate-900 rounded-[2px] shadow-2xl flex flex-col h-[90vh] md:h-[80vh] relative overflow-hidden">
              
              {/* Lightbox Header bar */}
              <div className="border-b border-slate-900 p-4 shrink-0 flex justify-between items-center bg-slate-900/10 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5 text-rose-500 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-white font-black tracking-widest uppercase">
                      RESTRICTED PHYSICAL RECON MONITOR (ZOM-99)
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase leading-none">
                      CLEARANCE ALPHA-1 DEEP ENCRYPT // CASE REF: {activeLightboxCard.refCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                    COM-INT DECLASSIFIED
                  </span>
                  <button
                    onClick={handleCloseLightbox}
                    className="p-1 px-2 border border-slate-800 bg-slate-900/35 text-slate-400 hover:text-white hover:border-slate-500 rounded cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-[10px] font-bold">CLOSE</span>
                  </button>
                </div>
              </div>

              {/* Main Content Pane Split (Map vs details) */}
              <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-0">
                
                {/* 1. Interactive Zoom Vectors Schematic Frame (Col Span 7) */}
                <div 
                  className="md:col-span-7 bg-slate-950 border-r border-slate-900 flex flex-col justify-between relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] select-none"
                >
                  {/* Scope markings overlay */}
                  <div className="absolute top-4 left-4 font-mono text-[8px] text-[#475569] uppercase space-y-1">
                    <div>GPS_COORD: {activeLightboxCard.coordinates}</div>
                    <div>MATRIX_FOCUS: RECON_LEVEL_5</div>
                    <div>REF_SCALE: AUTOCALIBRATE</div>
                  </div>

                  <div className="absolute top-4 right-4 flex items-center gap-1.5 font-mono text-[9px] text-[#475569]">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                    <span>SECURE SENSOR PLOT</span>
                  </div>

                  {/* Dynamic interactive schematic viewport container */}
                  <div 
                    id="evidence-pan-viewport"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMoveDrag}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className={`flex-1 flex items-center justify-center overflow-hidden relative cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
                  >
                    <div
                      style={{
                        transform: `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`,
                        transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                      }}
                      className="w-full h-full max-h-[300px] md:max-h-[420px] flex items-center justify-center select-none"
                    >
                      {/* Custom themed vector projection based on classification */}
                      {activeLightboxCard.id === 'cyber-penetration' && (
                        <svg className="w-[85%] h-[85%] text-emerald-400" viewBox="0 0 400 240">
                          <rect x="10" y="10" width="380" height="220" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                          <path d="M 30 120 Q 100 30 200 120 T 370 120" fill="none" stroke="#10b981" strokeWidth="1" className="animate-pulse" />
                          <path d="M 30 120 Q 100 180 200 120 T 370 120" fill="none" stroke="#00e1ff" strokeWidth="0.75" strokeOpacity="0.5" />
                          
                          {/* Pulsing firewall nodes */}
                          <circle cx="200" cy="120" r="16" fill="none" stroke="#ef4444" strokeWidth="1" />
                          <circle cx="200" cy="120" r="8" fill="#ef4444" fillOpacity="0.1" />
                          <line x1="200" y1="50" x2="200" y2="190" stroke="#334155" strokeWidth="0.5" />
                          
                          {/* Scrolling horizontal decryption data block representation */}
                          {Array.from({ length: 12 }).map((_, rIdx) => (
                            <text
                              key={rIdx}
                              x={30 + (rIdx * 28)}
                              y="190"
                              fill="#10b981"
                              fontSize="6"
                              fontFamily="monospace"
                              opacity={0.35 + (rIdx % 4) * 0.15}
                            >
                              010101
                            </text>
                          ))}
                          
                          <text x="200" y="115" fill="#ef4444" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MATRIX BLOCKADE</text>
                        </svg>
                      )}

                      {activeLightboxCard.id === 'nuke-strike' && (
                        <svg className="w-[85%] h-[85%]" viewBox="0 0 400 240">
                          <rect x="10" y="10" width="380" height="220" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                          {/* Target intersection coordinates lines */}
                          <line x1="200" y1="20" x2="200" y2="220" stroke="#475569" strokeWidth="0.5" />
                          <line x1="20" y1="120" x2="380" y2="120" stroke="#475569" strokeWidth="0.5" />
                          
                          {/* Concentric high-yield blast wave expanding rings */}
                          <circle cx="200" cy="120" r="65" fill="none" stroke="#ef4444" strokeWidth="0.75" strokeOpacity="0.2" className="animate-ping" style={{ animationDuration: '4s' }} />
                          <circle cx="200" cy="120" r="45" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" />
                          <circle cx="200" cy="120" r="25" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                          <circle cx="200" cy="120" r="4" fill="#ef4444" />
                          
                          <path d="M 70 70 L 200 120" stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="2 3" />
                          <text x="75" y="62" fill="#f59e0b" fontSize="6" fontFamily="monospace">TRAJECTORY_Breach</text>
                          
                          <text x="200" y="145" fill="#ef4444" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">EPICENTER AP-9 TARGET NULL</text>
                        </svg>
                      )}

                      {activeLightboxCard.id === 'kinetic-strikes' && (
                        <svg className="w-[85%] h-[85%]" viewBox="0 0 400 240">
                          <rect x="10" y="10" width="380" height="220" fill="none" stroke="#334155" strokeWidth="0.5" />
                          {/* City metropolitan square block layout blueprints */}
                          {Array.from({ length: 4 }).map((_, r) => (
                            Array.from({ length: 6 }).map((_, c) => (
                              <rect
                                key={`${r}-${c}`}
                                x={40 + c * 55}
                                y={30 + r * 45}
                                width="45"
                                height="35"
                                fill="none"
                                stroke="#1e293b"
                                strokeWidth="0.5"
                              />
                            ))
                          ))}
                          
                          {/* Kinetic impacts coordinates pointers */}
                          <circle cx="150" cy="80" r="14" fill="none" stroke="#ef4444" strokeWidth="1" />
                          <line x1="140" y1="80" x2="160" y2="80" stroke="#ef4444" strokeWidth="0.75" />
                          <line x1="150" y1="70" x2="150" y2="90" stroke="#ef4444" strokeWidth="0.75" />
                          <text x="150" y="102" fill="#ef4444" fontSize="5.5" fontFamily="monospace" textAnchor="middle">IMPACT SEC-11</text>

                          <circle cx="260" cy="170" r="14" fill="none" stroke="#ef4444" strokeWidth="1" />
                          <line x1="250" y1="170" x2="270" y2="170" stroke="#ef4444" strokeWidth="0.75" />
                          <line x1="260" y1="160" x2="260" y2="180" stroke="#ef4444" strokeWidth="0.75" />
                          <text x="260" y="192" fill="#ef4444" fontSize="5.5" fontFamily="monospace" textAnchor="middle">IMPACT SEC-19</text>
                        </svg>
                      )}

                      {activeLightboxCard.id === 'economic-blockade' && (
                        <svg className="w-[85%] h-[85%]" viewBox="0 0 400 240">
                          <rect x="10" y="10" width="380" height="220" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                          {/* Flow nodes representing transactional trading lines */}
                          <circle cx="100" cy="120" r="22" fill="none" stroke="#00e1ff" strokeWidth="0.75" />
                          <text x="100" y="123" fill="#00e1ff" fontSize="5.5" fontFamily="monospace" textAnchor="middle">EXPORT NET</text>

                          <circle cx="300" cy="120" r="22" fill="none" stroke="#00e1ff" strokeWidth="0.75" />
                          <text x="300" y="123" fill="#00e1ff" fontSize="5.5" fontFamily="monospace" textAnchor="middle">Sovereign Reserves</text>

                          {/* Severed flow vectors representations */}
                          <g>
                            <line x1="125" y1="120" x2="275" y2="120" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" />
                            <circle cx="200" cy="120" r="10" fill="#ef4444" />
                            <text x="200" y="123" fill="#fff" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="black">X</text>
                          </g>

                          <text x="200" y="145" fill="#ef4444" fontSize="6" fontFamily="monospace" textAnchor="middle" uppercase>TRADE ROUTE COLLAPSE (EMBARGO BLOCK)</text>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Active Zoom controls strip at map footer */}
                  <div className="border-t border-slate-900 px-4 py-2.5 bg-slate-950 flex justify-between items-center shrink-0">
                    <span className="font-mono text-[8px] text-[#475569] uppercase font-bold">
                      CLICK & DRAG PAN CONTROL ACTIVE // SCALE OPTION IN RANGE 1X-3X
                    </span>

                    <div className="flex items-center gap-1.5 font-mono text-[9px]">
                      <button
                        onClick={() => { audio.sfxKeyClick(); setZoomLevel((z) => Math.max(1, z - 0.4)); }}
                        className="p-1 px-2 border border-slate-800 hover:border-slate-500 bg-slate-900/30 text-white rounded cursor-pointer transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[#00e1ff] px-2.5 font-black">{Math.round(zoomLevel * 100)}%</span>
                      <button
                        onClick={() => { audio.sfxKeyClick(); setZoomLevel((z) => Math.min(3, z + 0.4)); }}
                        className="p-1 px-2 border border-slate-800 hover:border-slate-500 bg-slate-900/30 text-white rounded cursor-pointer transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { audio.sfxKeyClick(); setZoomLevel(1); setPanX(0); setPanY(0); }}
                        className="p-1 px-2.5 border border-slate-800 hover:border-slate-500 bg-slate-900/30 text-slate-350 hover:text-white rounded cursor-pointer transition-colors text-[7.5px] uppercase font-bold"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                </div>

                {/* 2. Structured Intel Analysis Prose Deck (Col Span 5) */}
                <div className="md:col-span-5 bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto font-mono text-[10px] space-y-5 border-l border-slate-900 select-text">
                  
                  {/* Detailed declassified prose writeup */}
                  <div className="space-y-4">
                    <div className="border-b border-dashed border-slate-900 pb-3">
                      <span className="text-[#a1a1aa] text-[9px] uppercase tracking-widest block font-bold">Surveillance Site Report Dossier:</span>
                      <h2 className="text-white text-sm font-black mt-2 uppercase tracking-wide">
                        {activeLightboxCard.title}
                      </h2>
                    </div>

                    <div className="space-y-3 font-sans text-slate-300 text-[11.5px] leading-relaxed select-text text-justify antialiased">
                      <p className="font-mono text-[#00ffd5] text-[10px] font-bold block mb-1">DATA ANALYSIS PACKET:</p>
                      <p>
                        {activeLightboxCard.prose}
                      </p>
                      <p className="italic border-l-2 border-[#10b981] pl-3.5 text-slate-400 mt-4 text-[10.5px]">
                        "Geopolitical simulation algorithms confirm this sequence of damage indicators acted as a primary chronological tipping weight, causing cascade defaults across metropolitan cabinets."
                      </p>
                    </div>
                  </div>

                  {/* Alphanumeric diagnostic tags strip */}
                  <div className="border-t border-slate-900 pt-4.5 space-y-2.5 font-mono text-[8.5px] text-[#4b5563]">
                    <div className="flex justify-between">
                      <span>CODENAME CLASSIFY DETECTED:</span>
                      <strong className="text-slate-300 font-extrabold uppercase">OPR-RECON-X</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>REF CODE INTEGRITY INDEX:</span>
                      <strong className="text-[#00e1ff] font-extrabold">{activeLightboxCard.refCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>SATELLITE POSITION PLOT:</span>
                      <strong className="text-orange-400 font-bold">{activeLightboxCard.coordinates}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>HISTORICAL COMM BUFFER RECON:</span>
                      <strong className="text-[#10b981] font-bold">VERIFIED EX POST</strong>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
