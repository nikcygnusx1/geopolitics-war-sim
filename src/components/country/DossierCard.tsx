import React, { useState, useEffect, useRef } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useFogOfWarStore } from '../../store/fogOfWarStore';
import { useClockStore } from '../../store/clockStore';
import { useUIStore } from '../../store/uiStore';
import { getLeaderProfile } from '../../data/leaders';
import { useLeaderStore } from '../../store/leaderStore';
import { LeaderPortrait } from './LeaderPortrait';
import { fmtB, fmtDate, fmtPop } from '../../utils/format';
import { audio } from '../../utils/audio';
import { LeaderPersonality, MajorActionType, HotspotType } from '../../types';
import { generateLeaderPortrait } from '../../utils/portraitGenerator';
import { SEEDED_HOTSPOTS } from '../../data/hotspots';
import { useSovereignStore } from '../../store/sovereignStore';

interface DossierCardProps {
  countryId: string;
  onClose: () => void;
}

export const DossierCard: React.FC<DossierCardProps> = ({ countryId, onClose }) => {
  const [flipped, setFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'MILITARY' | 'COVERT' | 'INTEL' | 'SYSTEMS'>('GENERAL');
  const [systemsSubTab, setSystemsSubTab] = useState<'CANONICAL' | 'SOVEREIGN'>('SOVEREIGN');
  
  const [activeHeroImageIdx, setActiveHeroImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Tactical image viewing lens filter mode: OPTICAL (Satellite Raw), THERMAL (FLIR IR), EDGE (GEOINT Scanning)
  const [imageFilterMode, setImageFilterMode] = useState<'OPTICAL' | 'THERMAL' | 'EDGE'>('OPTICAL');
  
  // Advanced hot spot faceted state filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<HotspotType | 'ALL'>('ALL');
  const [threatFilter, setThreatFilter] = useState<string | 'ALL'>('ALL');
  const [classFilter, setClassFilter] = useState<string | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'VALUE' | 'CONFIDENCE' | 'THREAT' | 'IMPORTANCE' | 'COORDS'>('VALUE');
  
  // Session queue for quick-tabbing between inspect nodes inside the same file
  const [recentlyInspectedIds, setRecentlyInspectedIds] = useState<string[]>([]);
  const [coordinatesCopied, setCoordinatesCopied] = useState(false);

  const country = useWorldStore((state) => state.countries[countryId]);
  const sovereignAgent = useSovereignStore((state) => state.sovereignStates[countryId]);
  const world = useWorldStore((state) => state.world);
  const playerCountryId = usePlayerStore((state) => state.countryId);
  const hudMode = usePlayerStore((state) => state.hudMode);
  
  // Fog of war + active trace metrics
  const fogEntry = useFogOfWarStore((state) => state.fog[countryId]);
  const currentTick = useWorldStore((state) => state.currentTick);
  const calendarDate = useClockStore((state) => state.currentCalendarDate);
  const globalEvents = useWorldStore((state) => state.globalEventLog) || [];

  const selectedHotspotId = useUIStore((s) => s.selectedHotspotId);
  const setSelectedHotspot = useUIStore((s) => s.setSelectedHotspot);
  const getHotspotsForCountry = useUIStore((s) => s.getHotspotsForCountry);

  // Track coordinates copy timeout
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset active media photo and preset filter settings when routing to a new target
  useEffect(() => {
    setActiveHeroImageIdx(0);
    setImageLoading(false);
    setCoordinatesCopied(false);
    if (selectedHotspotId) {
      setRecentlyInspectedIds((prev) => {
        const filtered = prev.filter((id) => id !== selectedHotspotId);
        return [selectedHotspotId, ...filtered].slice(0, 4);
      });
    }
  }, [selectedHotspotId]);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Escape key and arrow keys lightbox control stream listeners
  useEffect(() => {
    if (!lightboxOpen) return;
    const activeHotspot = getHotspotsForCountry(countryId).find(h => h.id === selectedHotspotId);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
        audio.sfxKeyClick();
      } else if (e.key === 'ArrowRight' && activeHotspot?.imageAssets && activeHotspot.imageAssets.length > 0) {
        setActiveHeroImageIdx((prev) => (prev + 1) % activeHotspot.imageAssets!.length);
        audio.sfxKeyClick();
      } else if (e.key === 'ArrowLeft' && activeHotspot?.imageAssets && activeHotspot.imageAssets.length > 0) {
        setActiveHeroImageIdx((prev) => (prev - 1 + activeHotspot.imageAssets!.length) % activeHotspot.imageAssets!.length);
        audio.sfxKeyClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxOpen, selectedHotspotId, countryId, getHotspotsForCountry]);

  useEffect(() => {
    // Reset structural folder tilt on re-selecting country
    setFlipped(false);

    // Auto routing: if target hotspot is focused on this country, open the INTEL analyst terminal directly
    if (selectedHotspotId) {
      const countryHotspots = getHotspotsForCountry(countryId);
      if (countryHotspots.some(h => h.id === selectedHotspotId)) {
        setActiveTab('INTEL');
        setFlipped(true); // Flip files open automatically for focused hotspots!
        return;
      }
    }
    setActiveTab('GENERAL');
  }, [countryId, selectedHotspotId, getHotspotsForCountry]);

  if (!country) return null;

  const intelLevel = fogEntry ? fogEntry.intelLevel : 0;
  const staticLeader = getLeaderProfile(countryId);
  const activeLeader = useLeaderStore((state) => state.leadersByCountryId[countryId]);

  const isRedacted = (requiredLevel: number) => {
    if (countryId === playerCountryId) return false;
    return intelLevel < requiredLevel;
  };

  const renderValueOrRedacted = (requiredLevel: number, displayValue: string | React.ReactNode) => {
    if (isRedacted(requiredLevel)) {
      return (
        <span 
          style={{ fontFamily: '"JetBrains Mono", monospace' }} 
          className="bg-red-950/40 text-red-500 border border-red-900/60 px-1.5 py-0.5 rounded text-[8px] tracking-widest font-extrabold uppercase animate-pulse select-none select-all"
          title="TACTICAL DATA LOCKED // DECRYPT CAPABILITIES BELOW REQUIRED INTELLIGENCE"
        >
          [CLASSIFIED_REDACTED]
        </span>
      );
    }
    return displayValue;
  };

  // --- INTERACTION TACTICAL ACTION HANDLERS ---

  const handleDeclareWar = () => {
    audio.sfxKlaxon();
    
    useWorldStore.getState().updateCountry(countryId, (draft) => {
      if (!draft.atWarWith.includes(playerCountryId)) {
        draft.atWarWith.push(playerCountryId);
      }
      draft.opinions[playerCountryId] = -100;
    });
    useWorldStore.getState().updateCountry(playerCountryId, (draft) => {
      if (!draft.atWarWith.includes(countryId)) {
        draft.atWarWith.push(countryId);
      }
    });

    useWorldStore.getState().addGlobalEvent(
      `WAR BREAKOUT: ${playerCountryId} has issued a formal DECLARATION OF WAR on ${country.name.toUpperCase()}! Frontline forces mobilized.`,
      'CRITICAL'
    );
    
    useWorldStore.getState().registerConsequenceChain('DECLARE_WAR', { 
      sourceCountryId: playerCountryId, 
      targetCountryId: countryId 
    });

    useUIStore.getState().pushAlert({
      title: "TACTICAL WAR DECLARATION",
      message: `Direct kinetic state engaged. Joint chiefs have initiated tactical engagement orders against ${country.name}.`,
      type: "DANGER"
    });
  };

  const handleImposeSanctions = () => {
    audio.sfxKlaxon();
    
    useWorldStore.getState().updateCountry(countryId, (draft) => {
      if (!draft.economic.sanctionedBy.includes(playerCountryId)) {
        draft.economic.sanctionedBy.push(playerCountryId);
      }
      draft.opinions[playerCountryId] = Math.max(-100, (draft.opinions[playerCountryId] || 0) - 25);
    });

    useWorldStore.getState().addGlobalEvent(
      `TRADE EMBARGO: ${playerCountryId} imposed severe unilateral trade sanctions and asset freezes on ${country.name}.`,
      'WARNING'
    );

    useWorldStore.getState().registerConsequenceChain('IMPOSE_SANCTIONS', { 
      sourceCountryId: playerCountryId, 
      targetCountryId: countryId 
    });

    useUIStore.getState().pushAlert({
      title: "ECONOMIC EMBARGO ACTIVE",
      message: `Unilateral trade embargo imposed on ${country.name}. Transaction gates locked.`,
      type: "WARNING"
    });
  };

  const handleCovertOp = () => {
    audio.sfxFactionAlert();
    
    useFogOfWarStore.getState().setIntelLevel(countryId, Math.min(3, intelLevel + 1) as any, currentTick);
    
    useWorldStore.getState().addGlobalEvent(
      `INTELLIGENCE EXPANSION: ${playerCountryId} clandestine network expanded inside ${country.name} (INTEL LEVEL ${Math.min(3, intelLevel + 1)}/3).`,
      'INFO'
    );

    useWorldStore.getState().registerConsequenceChain('STAGE_COUP', { 
      sourceCountryId: playerCountryId, 
      targetCountryId: countryId 
    });

    useUIStore.getState().pushAlert({
      title: "COVERT OP ENGAGED",
      message: `Espionage cells deployed. Signal scanning and defensive surveillance capabilities heightened (+1 intelligence).`,
      type: "INFO"
    });
  };

  const handleBribe = () => {
    const parentCountry = useWorldStore.getState().countries[playerCountryId];
    if (!parentCountry) return;
    
    const bribePrice = 2.0;
    
    if (parentCountry.economic.treasuryCashB < bribePrice) {
      audio.sfxMarketCrash();
      useUIStore.getState().pushAlert({
        title: "OPERATION ABORTED",
        message: `Bribing local commanders requires $${bribePrice.toFixed(1)}B in liquid reserves. Current treasury: $${parentCountry.economic.treasuryCashB.toFixed(1)}B.`,
        type: "WARNING"
      });
      return;
    }

    audio.sfxUNVote();
    
    useWorldStore.getState().updateCountry(playerCountryId, (draft) => {
      draft.economic.treasuryCashB = Math.max(0, draft.economic.treasuryCashB - bribePrice);
    });

    useWorldStore.getState().updateCountry(countryId, (draft) => {
      draft.political.stabilityIndex = Math.min(100, draft.political.stabilityIndex + 12);
      draft.opinions[playerCountryId] = Math.min(100, (draft.opinions[playerCountryId] || 0) + 15);
    });

    usePlayerStore.getState().syncCashFromCountry();
    
    useWorldStore.getState().addGlobalEvent(
      `BLACK TRANSFERS: Secret payment of $${bribePrice.toFixed(1)}B deposited to cabinet elements within ${country.name} to shift policy. Subject stability stabilized.`,
      'INFO'
    );

    useWorldStore.getState().registerConsequenceChain('REGIME_CHANGE', { 
      sourceCountryId: playerCountryId, 
      targetCountryId: countryId 
    });

    useUIStore.getState().pushAlert({
      title: "CLANDESTINE PAYOFF SUCCESSFUL",
      message: `Cabinet officials bribed. Bilateral diplomatic opinion warmed by +15% and local stability increased (+12%).`,
      type: "INFO"
    });
  };

  const handleDiplomacy = () => {
    audio.sfxUNVote();
    
    useWorldStore.getState().updateCountry(countryId, (draft) => {
      draft.opinions[playerCountryId] = Math.min(100, (draft.opinions[playerCountryId] || 0) + 18);
    });

    useWorldStore.getState().addGlobalEvent(
      `DIPLOMATIC INITIATIVE: Sovereign delegation of ${playerCountryId} arrived in ${country.name} to seal trade pathways.`,
      'INFO'
    );

    useWorldStore.getState().registerConsequenceChain('SIGN_ALLIANCE', { 
      sourceCountryId: playerCountryId, 
      targetCountryId: countryId 
    });

    useUIStore.getState().pushAlert({
      title: "DIPLOMATIC RECEPTION",
      message: `Foreign ministers dispatched. Joint treaty dialogues initiated. Sovereign opinions shifted (+18%).`,
      type: "INFO"
    });
  };

  const getDossierTelemetryLogs = () => {
    const localLogs = country.lastEventLog || [];
    const relevantGlobalLogs = globalEvents
      .filter(evt => evt.text.toUpperCase().includes(country.name.toUpperCase()) || evt.text.toUpperCase().includes(countryId.toUpperCase()))
      .slice(0, 5)
      .map(evt => evt.text);
    
    const combined = Array.from(new Set([...localLogs, ...relevantGlobalLogs]));
    return combined.slice(0, 5);
  };

  const getIntelAssessmentText = () => {
    const isDomestic = countryId === playerCountryId;
    if (isDomestic) {
      return "Sovereign defensive capital node and internal logistics command center. All systems nominal. Defensive missile vaults and intelligence scanning operations in full-readiness state.";
    }

    const oVal = country.opinions[playerCountryId] ?? 50;
    const isHostile = oVal < 35;
    const isAllied = oVal > 70;
    const isHawkish = activeLeader && activeLeader.hawkDoveScore > 65;
    const block = country.allianceBlock.replace('_', ' ');

    let txt = `Subject is aligned with the ${block} coalition, running a ${isHawkish ? 'severe and highly aggressive' : 'calculative and moderate'} tactical doctrine. `;
    if (isHostile) {
      txt += "Bilateral tensions are critically high. Hostile rhetoric and defensive posturing indicate extreme risks of tactical preemptive launch maneuvers. Watch silos tightly.";
    } else if (isAllied) {
      txt += "Mutual strategic relationship remains strong. Defense links are fully synchronized for joint containment of external theater conflicts.";
    } else {
      txt += "Relations are balanced but fragile. Targeted economic incentives or diplomatic initiatives remain effective avenues for alignment development.";
    }
    return renderValueOrRedacted(1, txt);
  };

  // Run analytical hotspot filtration and query compiling
  const countryHotspots = getHotspotsForCountry(countryId);
  const filteredHotspots = countryHotspots.filter((h) => {
    const textMatch = searchQuery === '' ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const typeMatch = typeFilter === 'ALL' || h.type === typeFilter;
    const threatMatch = threatFilter === 'ALL' || h.threatLevel === threatFilter;
    const classMatch = classFilter === 'ALL' || h.classification.includes(classFilter);
    
    return textMatch && typeMatch && threatMatch && classMatch;
  });

  const sortedHotspots = [...filteredHotspots].sort((a, b) => {
    switch (sortBy) {
      case 'VALUE':
        return (b.strategicValue || 0) - (a.strategicValue || 0);
      case 'CONFIDENCE':
        return (b.confidenceScore || 0) - (a.confidenceScore || 0);
      case 'IMPORTANCE':
        return (b.importance || 0) - (a.importance || 0);
      case 'THREAT': {
        const priority: Record<string, number> = { 'NOMINAL': 1, 'STABLE': 2, 'MONITORING': 3, 'ELEVATED': 4, 'SEVERE': 5, 'HIGH ALERT': 6 };
        return (priority[b.threatLevel] || 0) - (priority[a.threatLevel] || 0);
      }
      case 'COORDS':
        return b.lat - a.lat;
      default:
        return 0;
    }
  });

  const finalTelemetryLogs = getDossierTelemetryLogs();
  const activeHotspot = sortedHotspots.find((h) => h.id === selectedHotspotId) || sortedHotspots[0] || null;

  // Global relational connectivity - other countries with same asset class to close exploration loops
  const strategicClassLinks = activeHotspot
    ? SEEDED_HOTSPOTS.filter((h) => h.type === activeHotspot.type && h.id !== activeHotspot.id)
    : [];

  const handleCopyCoords = (coordsText: string) => {
    navigator.clipboard.writeText(coordsText);
    audio.sfxKeyClick();
    setCoordinatesCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCoordinatesCopied(false), 2800);
  };

  return (
    <div id="classified-dossier-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-mono transition-all duration-300">
      
      {/* Morphing dimensions based on flipped state: cover folder is small; operational dashboard is large and cinematic */}
      <div className={`card-perspective transition-all duration-500 ease-in-out ${flipped ? 'w-[1140px] h-[720px]' : 'w-[520px] h-[600px]'}`}>
        <div className={`card w-full h-full relative ${flipped ? 'flipped' : ''} shadow-[0_0_50px_rgba(0,0,0,0.95)]`}>
          
          {/* ========================================================
              DOSSIER COVER SHEET — FRONT SIDE (RESTRICTED PHYSICAL FILE)
             ======================================================== */}
          <div className="card-front w-full h-full bg-[#1b150c] border-2 border-[#b08544] rounded-lg p-7 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] text-[#dfbe91] flex flex-col justify-between overflow-hidden">
            {/* Folder tab design accent */}
            <div className="absolute top-0 right-10 bg-[#b08544] text-[#1b150c] font-black text-[8px] tracking-[0.2em] px-5 py-1 uppercase rounded-b-md shadow-md">
              DIA // DISPATCH_R9
            </div>

            <div>
              {/* Classification Headers */}
              <div className="border-b border-[#b08544]/35 pb-3 flex justify-between items-center text-[9px] tracking-widest font-black text-[#b08544]">
                <span>🚨 INTERNAL EYES ONLY // COMMAND LEVEL DISPATCH // COGNITIVE ASSET</span>
                <span>DIA REF: G-SEC-4</span>
              </div>

              {/* Cover Title Box */}
              <div className="bg-[#100b05] border border-[#b08544]/25 p-5 rounded-md text-center my-6 relative overflow-hidden">
                {/* Horizontal scanner light overlay */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-[#b08544]/20 animate-[pulse_2s_infinite]" />
                <h1 className="text-2xl font-black tracking-[0.25em] text-[#ffa631] uppercase">
                  CLASSIFIED INTEL ARCHIVE
                </h1>
                <p className="text-[9px] text-[#b08544]/75 tracking-[0.2em] mt-1.5 uppercase font-bold">
                  Sovereign Tactical Registry // Defense Threat Assessment
                </p>
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(176,133,68,0.015)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px]" />
              </div>

              {/* Tactile Rubber Authority Stamp */}
              <div 
                className="absolute top-[37%] right-[12%] border-4 border-red-700/80 text-red-500 font-black px-4 py-1.5 text-center font-mono opacity-80 select-none pointer-events-none text-[10.5px]"
                style={{
                  transform: 'rotate(-8deg)',
                  borderStyle: 'double',
                  borderWidth: '5px',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  letterSpacing: '0.15em',
                  boxShadow: '0 0 1px rgba(239, 68, 68, 0.2)'
                }}
              >
                ★ CLASSIFIED ★<br/>RESTRICTED DISPATCH
              </div>

              {/* Basic State Info Header Row */}
              <div className="flex items-center gap-4 border border-[#b08544]/25 bg-[#120e09] p-4 rounded-md my-5">
                <span className="text-5xl bg-black/45 border border-[#b08544]/20 p-2 rounded-md leading-none shrink-0" role="img" aria-label="Country Flag">
                  {country.flagEmoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black tracking-wider text-white uppercase truncate">{country.name}</h2>
                  </div>
                  <p className="text-[9.5px] text-[#b08544]/80 font-bold tracking-widest mt-1 uppercase">ISO REGIONAL LOCATOR SYMBOL: {countryId}</p>
                </div>
              </div>

              {/* 4-Stat Core Grid */}
              <div className="grid grid-cols-2 gap-3.5 my-6">
                <div className="bg-[#120e09] border border-[#b08544]/20 p-3 rounded flex flex-col justify-between h-[68px] shadow-inner relative">
                  <span className="text-[8.5px] text-[#b08544]/65 tracking-widest font-black uppercase">STABILITY ESTIMATOR</span>
                  <span className="text-lg font-black text-white tracking-widest font-mono">
                    {renderValueOrRedacted(2, `${country.political.stabilityIndex.toFixed(0)}%`)}
                  </span>
                  <div className="absolute right-3 bottom-3 w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                </div>
                <div className="bg-[#120e09] border border-[#b08544]/20 p-3 rounded flex flex-col justify-between h-[68px] shadow-inner relative">
                  <span className="text-[8.5px] text-[#b08544]/65 tracking-widest font-black uppercase">SOVEREIGN GDP</span>
                  <span className="text-lg font-black text-[#eacf9c] tracking-widest font-mono">
                    {renderValueOrRedacted(2, `$${country.economic.gdpB.toFixed(1)}B`)}
                  </span>
                </div>
                <div className="bg-[#120e09] border border-[#b08544]/20 p-3 rounded flex flex-col justify-between h-[68px] shadow-inner">
                  <span className="text-[8.5px] text-[#b08544]/65 tracking-widest font-black uppercase">TACTICAL CAPACITY</span>
                  <span className="text-lg font-black text-red-400 tracking-widest font-mono">
                    {renderValueOrRedacted(1, `${country.arsenal.totalPowerRating} KND`)}
                  </span>
                </div>
                <div className="bg-[#120e09] border border-[#b08544]/20 p-3 rounded flex flex-col justify-between h-[68px] shadow-inner">
                  <span className="text-[8.5px] text-[#b08544]/65 tracking-widest font-black uppercase">ALLIANCE COALITION</span>
                  <span className="text-[13.5px] font-black text-cyan-400 tracking-wide uppercase truncate font-mono">
                    {renderValueOrRedacted(1, country.allianceBlock.replace('_', ' '))}
                  </span>
                </div>
              </div>
            </div>

            {/* Folder Cover Footnote */}
            <div className="border-t border-[#b08544]/35 pt-4.5 flex justify-between items-center text-[8.5px] tracking-wider text-[#b08544]/60 font-semibold uppercase">
              <span>MANILA FILLING INDEX REF: {countryId} // DIA-T8</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  audio.sfxKeyClick();
                  setFlipped(true);
                }}
                className="text-[#ffa631] border-2 border-[#ffa631]/60 hover:bg-[#ffa631]/10 px-4 py-1.5 uppercase font-black text-[9.5px] tracking-widest rounded-sm cursor-pointer transition-all duration-200 shrink-0 hover:border-[#ffa631] shadow-[0_0_10px_rgba(255,166,49,0.15)]"
              >
                OPEN SEC-FILE &gt;&gt;
              </button>
            </div>
          </div>

          {/* ========================================================
              DOSSIER FILE INTERIOR — BACK SIDE (ANALYST COMMAND WORKSPACE)
             ======================================================== */}
          <div className="card-back w-full h-full bg-[#020503] border-2 border-[#124d12] p-5.5 rounded-lg shadow-[0_25px_50px_-12px_rgba(0,0,0,0.95)] text-green-400 flex flex-col justify-between overflow-hidden relative">
            
            {/* Tactical Grid Atmosphere Layer */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,255,100,0.02)_0%,transparent_80%)] opacity-70 z-0" />
            <div className="absolute inset-0 pointer-events-none border border-green-500/5 z-0"
                 style={{ backgroundImage: 'linear-gradient(rgba(0,255,100,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.015) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            
            <div className="flex-1 flex flex-col min-h-0 z-10">
              
              {/* Back Header with Control Hooks */}
              <div className="flex justify-between items-start border-b border-[#124d12] pb-2.5 mb-3 shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl bg-black/40 border border-[#1a5c1a]/30 p-1 rounded leading-none shrink-0">{country.flagEmoji}</span>
                    <div>
                      <h2 className="text-base font-black text-[#00ff44] tracking-wider uppercase truncate flex items-center gap-2">
                        {country.name}
                        <span className="text-[8px] bg-red-950/25 border border-red-900/60 text-red-500 px-1 rounded font-bold animate-[pulse_1.5s_infinite]">ACTIVE SECURITY TARGET LOCK</span>
                      </h2>
                      <p className="text-[8.5px] font-black text-cyan-400 tracking-widest uppercase mt-0.5 font-mono">
                        SOVEREIGN WAR ZONE SECTOR LOG: {countryId} // SECURITY CLEARANCE REQUIRED
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-center shrink-0">
                  <button
                    onClick={() => { audio.sfxKeyClick(); setFlipped(false); }}
                    className="text-gray-400 border border-gray-700/60 hover:text-[#ffb300] hover:border-[#ffb300]/80 py-1 px-3 text-[8.5px] uppercase font-black tracking-widest rounded-sm cursor-pointer transition-all duration-150"
                    title="Flip back to restricted cover folder"
                  >
                    DOSSIER COVER
                  </button>
                  <button
                    onClick={() => { audio.sfxKeyClick(); onClose(); }}
                    className="text-red-500 border border-red-800/80 hover:bg-red-950/35 py-1 px-3 text-[8.5px] uppercase font-black tracking-widest rounded-sm cursor-pointer transition-all duration-150"
                  >
                    SECURE CONSOLE [X]
                  </button>
                </div>
              </div>

              {/* Tabs Navigation Bar with sliding-like visual borders */}
              <div className="flex border-b border-[#0d2a0d]/60 pb-2 mb-3 gap-2 shrink-0 justify-start">
                {(['GENERAL', 'MILITARY', 'COVERT', 'INTEL', 'SYSTEMS'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { audio.sfxKeyClick(); setActiveTab(tab); }}
                    className={`px-4 py-1.5 text-[9px] font-black tracking-widest border transition-all duration-200 cursor-pointer rounded-sm ${
                      activeTab === tab
                        ? 'bg-[#1a4a1a]/45 text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.2)]'
                        : 'text-gray-400 border-transparent hover:text-white hover:border-gray-800/50'
                    }`}
                  >
                    {tab} MONITOR
                  </button>
                ))}
              </div>

              {/* Main Content Areas */}
              <div className="grid grid-cols-12 gap-3.5 min-h-0 flex-1 overflow-hidden relative">
                
                {/* Left Column: Portrait & Behavioral Profiler (Always visible except in deep INTEL search screen for layout balance) */}
                <div className={`col-span-3 flex flex-col items-center border-r border-[#124d12]/40 pr-3 min-h-0 overflow-y-auto custom-scrollbar ${activeTab === 'INTEL' || activeTab === 'SYSTEMS' ? 'hidden' : ''}`}>
                  <div className="relative group border border-[#1a5c1a]/55 p-1 bg-black/40 rounded-sm">
                    <LeaderPortrait countryId={countryId} size={110} />
                    <div className="absolute inset-0 pointer-events-none border-2 border-green-500/0 group-hover:border-green-500/20 transition-all duration-200" />
                  </div>

                  <div className="text-center mt-3 w-full">
                    <span className="text-[11.5px] font-black text-white block truncate leading-tight tracking-wide">
                      {renderValueOrRedacted(1, activeLeader?.name || staticLeader.name)}
                    </span>
                    <span className="text-[8.5px] text-gray-400 block tracking-wider uppercase mt-1">
                      {renderValueOrRedacted(1, `${staticLeader.title} // AGE ${activeLeader ? (staticLeader.age - 5 + Math.floor(activeLeader.hawkDoveScore % 10)) : staticLeader.age}`)}
                    </span>
                    <span className="text-[8.5px] text-[#ffb300] block tracking-widest mt-1.5 font-black uppercase font-mono">
                      {renderValueOrRedacted(1, `ADMIN TENURE: ${(activeLeader?.source === 'INITIAL' ? staticLeader.yearsInPower : 0) + Math.floor((currentTick - (activeLeader?.installedAtTick || 0)) / 10)} YRS`)}
                    </span>

                    {/* Behavioral Doctrine Evaluator Widget */}
                    {!isRedacted(1) && activeLeader && (
                      <div className="mt-4 p-2 bg-black/55 border border-[#1a5c1a]/40 rounded-sm text-left text-[8px] font-mono leading-normal space-y-2">
                        <div className="text-[7.5px] text-green-500/70 border-b border-[#0d2a0d] pb-1 tracking-wider font-extrabold uppercase uppercase">
                          BEHAVIORAL PROFILER
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 uppercase font-bold">RECON DOCTRINE:</span>
                          <select
                            value={activeLeader.type}
                            onChange={(e) => {
                              const newType = e.target.value as LeaderPersonality;
                              const currentTick = useWorldStore.getState().currentTick;
                              const currentLeader = useLeaderStore.getState().getLeader(countryId);
                              if (currentLeader) {
                                const rand = Math.random;
                                const updatedLeader = {
                                  ...currentLeader,
                                  type: newType,
                                  hawkDoveScore: Math.round(
                                    newType === LeaderPersonality.HAWK ? (80 + rand() * 20) :
                                    newType === LeaderPersonality.DOVE ? (10 + rand() * 20) :
                                    newType === LeaderPersonality.PRAGMATIST ? (40 + rand() * 25) :
                                    newType === LeaderPersonality.IDEOLOGUE ? (55 + rand() * 30) :
                                    (rand() * 100)
                                  ),
                                  riskTolerance: Math.round(
                                    newType === LeaderPersonality.HAWK ? (70 + rand() * 30) :
                                    newType === LeaderPersonality.DOVE ? (15 + rand() * 35) :
                                    newType === LeaderPersonality.PRAGMATIST ? (40 + rand() * 30) :
                                    newType === LeaderPersonality.IDEOLOGUE ? (50 + rand() * 25) :
                                    (30 + rand() * 70)
                                  ),
                                  portraitSeed: `${countryId}_re_${newType}_${currentTick}_${Date.now()}`
                                };
                                updatedLeader.portraitDataUrl = generateLeaderPortrait(newType, updatedLeader.portraitSeed);
                                useLeaderStore.getState().setLeader(countryId, updatedLeader);
                                useWorldStore.getState().addGlobalEvent(
                                  `COMM SIGNAL OUTFLOW: ${country.name} intelligence profiling re-compiled to doctrinal vector: ${newType}.`,
                                  'WARNING'
                                );
                              }
                            }}
                            className="bg-black border border-[#1a5c1a]/60 text-[8px] px-1.5 py-0.5 rounded font-mono text-[#00ff44] focus:outline-none cursor-pointer"
                          >
                            <option value="HAWK" className="text-red-500 bg-black">HAWK</option>
                            <option value="DOVE" className="text-green-400 bg-black font-semibold">DOVE</option>
                            <option value="PRAGMATIST" className="text-cyan-400 bg-black">PRAGMATIST</option>
                            <option value="IDEOLOGUE" className="text-amber-400 bg-black">IDEOLOGUE</option>
                            <option value="UNPREDICTABLE" className="text-fuchsia-400 bg-black">WILD</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 uppercase">HAWKISHNESS VECT:</span>
                            <span className="text-red-400 font-bold">{activeLeader.hawkDoveScore}%</span>
                          </div>
                          <div className="w-full h-1 bg-[#112a11] rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${activeLeader.hawkDoveScore}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 uppercase">RISK TOLERANCE:</span>
                            <span className="text-cyan-400 font-bold">{activeLeader.riskTolerance}%</span>
                          </div>
                          <div className="w-full h-1 bg-[#112a11] rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400" style={{ width: `${activeLeader.riskTolerance}%` }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Tab Content Screen */}
                <div className={`${activeTab === 'INTEL' || activeTab === 'SYSTEMS' ? 'col-span-12' : 'col-span-9'} flex flex-col justify-between min-h-0 overflow-y-auto custom-scrollbar pl-1`}>
                  
                  {/* --- GENERAL TAB MONITOR --- */}
                  {activeTab === 'GENERAL' && (
                    <div className="space-y-3 text-[10px]/relaxed">
                      <div className="grid grid-cols-2 gap-3.5 border-b border-[#0d2a0d]/55 pb-2.5">
                        <div className="bg-black/30 p-2 border border-[#1a5c1a]/20 rounded-sm">
                          <span className="text-green-600 font-bold block uppercase text-[8px] tracking-wide">SOCIO-IDEOLOGICAL ANCHOR:</span>
                          <span className="text-white font-heavy text-xs block mt-1">{renderValueOrRedacted(1, country.political.ideology)}</span>
                        </div>
                        <div className="bg-black/30 p-2 border border-[#1a5c1a]/20 rounded-sm">
                          <span className="text-green-600 font-bold block uppercase text-[8px] tracking-wide">COALITION DEFENSE BLOC:</span>
                          <span className="text-[#00ff44] font-heavy text-xs block mt-1">{renderValueOrRedacted(1, country.allianceBlock.replace('_', ' '))}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 border-b border-[#0d2a0d]/55 pb-2.5">
                        <div className="bg-black/30 p-2 border border-[#1a5c1a]/20 rounded-sm">
                          <span className="text-cyan-500 font-bold block uppercase text-[8px] tracking-wide">TREASURY RESERVES:</span>
                          <span className="text-[#00e5ff] font-heavy text-xs block mt-1">{renderValueOrRedacted(2, `$${country.economic.treasuryCashB.toFixed(1)}B CAPITAL`)}</span>
                        </div>
                        <div className="bg-black/30 p-2 border border-[#1a5c1a]/20 rounded-sm">
                          <span className="text-green-600 font-bold block uppercase text-[8px] tracking-wide">SOVEREIGN POPULATION SECTOR:</span>
                          <span className="text-white font-heavy text-xs block mt-1">{renderValueOrRedacted(1, fmtPop(country.population))}</span>
                        </div>
                      </div>

                      {/* Diagnostic gauges with dynamic glow and flashing warn states */}
                      <div className="space-y-2 pb-2.5 p-3 bg-black/55 border border-[#124d12]/50 rounded-sm">
                        <div className="flex justify-between items-center text-[8.5px]">
                          <span className="text-gray-300 font-black tracking-wider uppercase">CABINET SYSTEM STABILITY:</span>
                          <span className="text-green-400 font-black font-mono">{renderValueOrRedacted(2, `${country.political.stabilityIndex.toFixed(1)}% INDEX`)}</span>
                        </div>
                        {!isRedacted(2) && (
                          <div className="w-full h-1.5 bg-[#0d2a0d] rounded-full overflow-hidden relative shadow-inner">
                            <div className="h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]" style={{ width: `${country.political.stabilityIndex}%` }} />
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[8.5px] mt-2">
                          <span className="text-gray-300 font-black tracking-wider uppercase">POPULAR RESTLESSNESS INDEX:</span>
                          <span className="text-red-400 font-black font-mono">{renderValueOrRedacted(2, `${country.political.popularUnrest.toFixed(1)}% LEVEL`)}</span>
                        </div>
                        {!isRedacted(2) && (
                          <div className="w-full h-1.5 bg-[#0d2a0d] rounded-full overflow-hidden relative shadow-inner">
                            <div className="h-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]" style={{ width: `${country.political.popularUnrest}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* --- MILITARY TAB MONITOR --- */}
                  {activeTab === 'MILITARY' && (
                    <div className="space-y-3 text-[10px]/relaxed">
                      <div className="bg-[#020502] p-3 border border-[#1a5c1a]/50 rounded-sm space-y-2">
                        <span className="text-[#00ff44] font-black block border-b border-[#113a11] pb-1.5 text-[8.5px] tracking-wider uppercase">
                          TACTICAL ARSENAL & STRATEGIC UNIT STOCKPILE
                        </span>
                        {isRedacted(2) ? (
                          <div className="py-3 text-center">{renderValueOrRedacted(2, null)}</div>
                        ) : (
                          <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                            {country.arsenal.units && country.arsenal.units.length > 0 ? (
                              country.arsenal.units.filter(u => u.count > 0).map((unit, uIdx) => (
                                <div key={uIdx} className="flex justify-between items-center border-b border-[#0d2a0d]/55 py-1 text-[9px] font-mono hover:bg-green-950/10">
                                  <span className="text-gray-400 font-black tracking-wide uppercase">{unit.type.replace('_', ' ')}</span>
                                  <span className="text-white font-black">
                                    <span className="text-green-400">{unit.operational}</span>
                                    <span className="text-gray-500 mx-1">/</span>
                                    <span>{unit.count}</span>
                                    <span className="text-slate-500 text-[7px] ml-1.5 uppercase font-medium">OP LOAD</span>
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 italic text-center py-2.5">No strategic weaponry structures detected in monitored database.</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pb-1 border-t border-[#124d12]/30 pt-2 text-[8.5px] font-mono uppercase bg-black/25 p-2 rounded">
                        <div>
                          <span className="text-gray-400 font-black">TROOP FORCE READINESS:</span>
                          <span className="text-[#ffb300] font-black block text-[12px] tracking-wider mt-1">{renderValueOrRedacted(2, `${(country.arsenal.readinessLevel || 75).toFixed(1)}% READINESS`)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-black">ACTIVE SHIELD MATRIX:</span>
                          <span className="text-[#00e5ff] font-black block text-[12px] tracking-wider mt-1">{renderValueOrRedacted(2, `${(country.arsenal.abmShieldStrength || 0).toFixed(1)}% ABM SHIELD`)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- COVERT TAB MONITOR --- */}
                  {activeTab === 'COVERT' && (
                    <div className="space-y-3 text-[10px]/relaxed">
                      <div className="grid grid-cols-1 gap-2 border-b border-[#0d2a0d]/60 pb-2 bg-[#020502] p-2.5 rounded border border-[#1a5c1a]/30">
                        <span className="text-cyan-400 font-black block text-[8px] tracking-wider uppercase">SUB-SURFACE SYSTEM PROFILE:</span>
                        <span className="text-white block font-black text-[9.5px] font-mono">{renderValueOrRedacted(3, `SECURE FIREWALL LAYER LEVEL: [0${country.intelligence.cyberFirewallLevel || 1}_UPSTREAM_INTEGRITY]`)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-b border-[#0d2a0d]/60 pb-2">
                        <div className="bg-black/30 p-2 rounded">
                          <span className="text-gray-400 font-black block text-[8px] tracking-wide uppercase">NUCLEAR ARMED:</span>
                          <span className="text-[#ff2244] font-black block text-[10px] tracking-wider mt-1.5">{renderValueOrRedacted(3, country.arsenal.nuclearCapable ? '☢ DETECTED CAPABLE' : 'NULL / NON-CAPABLE')}</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <span className="text-gray-400 font-black block text-[8px] tracking-wide uppercase">DATACLOCK SCAN CONFIDENCE:</span>
                          <span className="text-[#ffb300] font-black block text-[10px] mt-1.5">{renderValueOrRedacted(2, `${(country.intelligence.intelReportConfidence || 65).toFixed(1)}% CERTAINTY`)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-cyan-400 font-black block text-[8.5px] tracking-wider uppercase">MONITORED REGIONAL ESPIONAGE DISPATCH</span>
                        {isRedacted(3) ? (
                          <div className="py-2.5">{renderValueOrRedacted(3, null)}</div>
                        ) : (
                          <div className="bg-black/55 p-2 border border-[#1a5c1a]/40 rounded-sm max-h-[80px] overflow-y-auto custom-scrollbar">
                            {country.intelligence.activeCovertOps && country.intelligence.activeCovertOps.length > 0 ? (
                              country.intelligence.activeCovertOps.map((op, opI) => (
                                <div key={opI} className="text-[#00ff44] flex justify-between border-b border-[#0d2a0d] pb-1 mb-1 text-[8.5px]">
                                  <span className="text-white font-heavy uppercase">{op.type.replace('_', ' ')} OPERATION</span>
                                  <span className="text-gray-400 font-bold font-mono">REMAINING_CYCLE: {op.remainingTicks}t</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 italic text-center py-2 text-[8px]">No clandestine operatives actively routed inside coordination limits.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                   {/* --- SYSTEMS TAB MONITOR --- */}
                  {activeTab === 'SYSTEMS' && (
                    <div className="space-y-3 text-[9px]/relaxed h-[360px] overflow-y-auto custom-scrollbar pr-1 flex-1">
                      {/* Sub-tab selector for Canonical vs Sovereign Core */}
                      <div className="flex border-b border-[#124d12]/30 pb-1.5 mb-2 gap-2">
                        <button
                          onClick={() => { setSystemsSubTab('SOVEREIGN'); audio.sfxKeyClick(); }}
                          className={`px-3 py-0.5 font-bold uppercase transition-all duration-150 text-[8.5px] rounded-sm border ${
                            systemsSubTab === 'SOVEREIGN'
                              ? 'bg-amber-950/40 text-amber-400 border-amber-600/70 shadow-[0_0_8px_rgba(217,119,6,0.15)] font-mono'
                              : 'bg-black/30 text-gray-500 border-transparent hover:text-gray-300 font-sans'
                          }`}
                        >
                          🛡️ SOVEREIGN DECISION CORE (M4.1)
                        </button>
                        <button
                          onClick={() => { setSystemsSubTab('CANONICAL'); audio.sfxKeyClick(); }}
                          className={`px-3 py-0.5 font-bold uppercase transition-all duration-150 text-[8.5px] rounded-sm border ${
                            systemsSubTab === 'CANONICAL'
                              ? 'bg-[#124d12]/30 text-[#00ff44] border-[#00ff44]/50 font-mono'
                              : 'bg-black/30 text-gray-500 border-transparent hover:text-gray-300 font-sans'
                          }`}
                        >
                          ⚙️ CANONICAL CORES SNAPSHOT
                        </button>
                      </div>

                      {systemsSubTab === 'SOVEREIGN' && (
                        <div className="space-y-3">
                          {!sovereignAgent ? (
                            <div className="text-amber-500 font-bold border border-amber-950/40 p-3 text-center bg-amber-950/10 rounded font-mono">
                              INITIALIZING AUTONOMOUS INTEL FOR STATE ID "{countryId}"... [COMPILATION STABLE]
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Header Overview */}
                              <div className="bg-[#0b0c0a]/90 p-2 border border-amber-700/30 rounded-sm flex justify-between items-center bg-gradient-to-r from-amber-950/10 to-black/50">
                                <div>
                                  <span className="text-amber-400 font-mono font-bold uppercase tracking-wider text-[8px] block">
                                    SOVEREIGN STRATEGIC AGENT STATUS REPORT
                                  </span>
                                  <p className="text-zinc-400 text-[8px] mt-0.5">
                                    Autonomous 5-Vector Planner active under ID: <span className="text-white font-bold">{countryId}</span> • Cooldown remaining: <span className="text-amber-500 font-bold">{sovereignAgent.planExecution?.remainingTicks || 0} ticks</span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  {sovereignAgent.activePlan ? (
                                    <span className="bg-amber-950/40 text-amber-400 px-1.5 py-0.5 border border-amber-700/55 rounded-sm font-mono text-[7.5px] font-bold animate-pulse">
                                      PLANNING: ACTIVE
                                    </span>
                                  ) : (
                                    <span className="bg-zinc-900 text-zinc-500 px-1.5 py-0.5 border border-zinc-800 rounded-sm font-mono text-[7.5px] font-bold">
                                      WAITING FOR GOAL SHIFT
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-12 gap-3.5">
                                {/* Left Side: 5-Vector Strategic Identity Profile (7 Columns) */}
                                <div className="col-span-7 bg-black/45 border border-[#1a5c1a]/20 p-2.5 rounded-sm space-y-2">
                                  <span className="text-[#00ff44] font-black uppercase text-[7.5px] tracking-widest block border-b border-[#124d12]/30 pb-1">
                                    🧬 FIVE-VECTOR NATIONAL IDENTITY PROFILE
                                  </span>
                                  <div className="space-y-2 text-[8px]">
                                    {/* Vector 1 */}
                                    <div className="p-1 px-1.5 bg-zinc-900/30 border border-zinc-800/40 rounded-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 font-bold">1. IDEOLOGY VECTOR:</span>
                                        <span className="text-amber-400 font-mono font-bold tracking-wider">{sovereignAgent.identity.ideology.primaryTendency}</span>
                                      </div>
                                      <div className="text-[7.5px] text-zinc-500 truncate mt-0.5 font-mono">
                                        VALUES: {sovereignAgent.identity.ideology.coreValues.join(' • ')}
                                      </div>
                                    </div>

                                    {/* Vector 2 */}
                                    <div className="p-1 px-1.5 bg-zinc-900/30 border border-zinc-800/40 rounded-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 font-bold">2. DEVELOPMENT MODEL:</span>
                                        <span className="text-amber-400 font-mono font-bold tracking-wider">{sovereignAgent.identity.economicDevelopmentModel.primaryTendency}</span>
                                      </div>
                                      <div className="text-[7.5px] text-zinc-500 truncate mt-0.5 font-mono">
                                        VALUES: {sovereignAgent.identity.economicDevelopmentModel.coreValues.join(' • ')}
                                      </div>
                                    </div>

                                    {/* Vector 3 */}
                                    <div className="p-1 px-1.5 bg-zinc-900/30 border border-zinc-800/40 rounded-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 font-bold">3. SECURITY DOCTRINE:</span>
                                        <span className="text-amber-400 font-mono font-bold tracking-wider">{sovereignAgent.identity.securityDoctrine.primaryTendency}</span>
                                      </div>
                                      <div className="text-[7.5px] text-zinc-500 truncate mt-0.5 font-mono">
                                        VALUES: {sovereignAgent.identity.securityDoctrine.coreValues.join(' • ')}
                                      </div>
                                    </div>

                                    {/* Vector 4 */}
                                    <div className="p-1 px-1.5 bg-zinc-900/30 border border-zinc-800/40 rounded-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 font-bold">4. REGIONAL AMBITION:</span>
                                        <span className="text-amber-400 font-mono font-bold tracking-wider">{sovereignAgent.identity.regionalAmbition.primaryTendency}</span>
                                      </div>
                                      <div className="text-[7.5px] text-zinc-500 truncate mt-0.5 font-mono">
                                        VALUES: {sovereignAgent.identity.regionalAmbition.coreValues.join(' • ')}
                                      </div>
                                    </div>

                                    {/* Vector 5 */}
                                    <div className="p-1 px-1.5 bg-zinc-900/30 border border-zinc-800/40 rounded-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 font-bold">5. LEADERSHIP VOLATILITY:</span>
                                        <span className="text-amber-400 font-mono font-bold tracking-wider">{sovereignAgent.identity.leadershipVolatility.primaryTendency}</span>
                                      </div>
                                      <div className="text-[7.5px] text-zinc-500 truncate mt-0.5 font-mono">
                                        VALUES: {sovereignAgent.identity.leadershipVolatility.coreValues.join(' • ')}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Side: Goal Priority Stack (5 Columns) */}
                                <div className="col-span-5 bg-black/45 border border-[#1a5c1a]/25 p-2.5 rounded-sm flex flex-col justify-between">
                                  <div className="space-y-1.5">
                                    <span className="text-[#00ff44] font-black uppercase text-[7.5px] tracking-widest block border-b border-[#124d12]/30 pb-1">
                                      🎯 GOALSTACK PRIORITIES
                                    </span>
                                    <div className="space-y-1.5 pr-0.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                                      {[...(sovereignAgent.goalStack || [])]
                                        .sort((a, b) => b.finalPriorityScore - a.finalPriorityScore)
                                        .map((gl, i) => {
                                          const scorePercent = Math.min(100, Math.ceil(gl.finalPriorityScore));
                                          return (
                                            <div key={gl.id} className="p-1 bg-[#121612]/30 border border-[#1a5c1a]/20 rounded-[2px] space-y-0.5">
                                              <div className="flex justify-between font-bold text-[7.5px]">
                                                <span className={`${i === 0 ? 'text-amber-400' : 'text-zinc-300'}`}>
                                                  {i === 0 ? '★ ' : ''}{gl.type.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-zinc-400 font-mono">{scorePercent}</span>
                                              </div>
                                              <div className="w-full bg-black/50 h-1.5 rounded-sm overflow-hidden border border-[#124d12]/10">
                                                <div
                                                  className={`h-full rounded-sm ${i === 0 ? 'bg-amber-500' : 'bg-green-600'}`}
                                                  style={{ width: `${scorePercent}%` }}
                                                />
                                              </div>
                                              <div className="text-[6.5px] text-zinc-400 truncate leading-none">
                                                Cond: {gl.successCriteria} • {gl.activeTicks}t active
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-[#124d12]/20 mt-1">
                                    <span className="text-zinc-500 font-bold block text-[7px] uppercase">DECISION CONTRAINTS</span>
                                    <div className="grid grid-cols-2 gap-1.5 mt-0.5 font-mono text-[7px]">
                                      <div className="flex gap-1 items-center">
                                        <span className={`w-1.5 h-1.5 rounded-full ${sovereignAgent.constraintsState.isEconomicStarved ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}`} />
                                        ECON STARVED
                                      </div>
                                      <div className="flex gap-1 items-center">
                                        <span className={`w-1.5 h-1.5 rounded-full ${sovereignAgent.constraintsState.isDiplomaticallyIsolated ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}`} />
                                        DIPLOMATIC ISOLATION
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Active Step Plan Execution Visual Timeline */}
                              {sovereignAgent.activePlan ? (
                                <div className="bg-[#121612]/30 border border-amber-600/30 p-2.5 rounded-sm space-y-2">
                                  <div className="flex justify-between items-center border-b border-[#124d12]/20 pb-1.5">
                                    <span className="text-amber-400 font-mono font-bold block uppercase text-[8px] tracking-wide">
                                      ⚔️ ACTIVE STRATEGIC PLAN: "{sovereignAgent.activePlan.title}"
                                    </span>
                                    <span className="font-mono text-zinc-500 text-[7px] uppercase">
                                      Secrecy: <span className="text-white font-bold">{sovereignAgent.activePlan.secrecyScore}%</span>
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2.5">
                                    {sovereignAgent.activePlan.steps.map((st, idx) => {
                                      const isCurrent = idx === sovereignAgent.activePlan!.currentStepIndex;
                                      const isPassed = idx < sovereignAgent.activePlan!.currentStepIndex;
                                      return (
                                        <div
                                          key={st.id}
                                          className={`p-1.5 rounded-sm border ${
                                            isCurrent
                                              ? 'bg-amber-950/20 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                                              : isPassed
                                              ? 'bg-black/30 border-green-950/40 text-zinc-500'
                                              : 'bg-black/25 border-zinc-800 text-zinc-500'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5 font-mono text-[7px] font-bold">
                                            {isPassed ? (
                                              <span className="text-green-500">[✓] DONE</span>
                                            ) : isCurrent ? (
                                              <span className="text-amber-400 animate-pulse">[👉 EXECUTING]</span>
                                            ) : (
                                              <span className="text-zinc-600">[ ] QUEUED</span>
                                            )}
                                            <span className="text-zinc-400">STEP {idx + 1}</span>
                                          </div>
                                          <div className={`font-bold mt-1 text-[8px] truncate ${isCurrent ? 'text-amber-200 font-mono block' : ''}`}>
                                            {st.actionName.replace(/_/g, ' ')}
                                          </div>
                                          <div className="text-[7px] text-zinc-400 mt-1 font-mono">
                                            {st.targetCountryId ? `Target: ${st.targetCountryId}` : 'National/Domestic'} • remain: {st.ticksRemaining}t
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="text-[7px] text-zinc-500 flex justify-between font-mono pt-1">
                                    <span>ABORT PROTOCOL: {sovereignAgent.activePlan.failureAbortCriteria.join(', ') || 'No fallback required'}</span>
                                    {sovereignAgent.activePlan.isInterrupted && (
                                      <span className="text-red-400 font-bold animate-pulse">PLAN INTERRUPT DETECTED: AUTO RE-ROUTING STABILIZATION...</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-[#121612]/15 border border-[#1a5c1a]/15 p-3 rounded text-center text-zinc-500 font-mono text-[8px] italic">
                                  No dynamic multi-step plan is currently active. The state is consolidating resources to assess tactical vulnerabilities.
                                </div>
                              )}

                              {/* Memory Registers: Threat and Trust recollection arrays */}
                              <div className="grid grid-cols-2 gap-3.5">
                                {/* Persistent Threat Memory */}
                                <div className="bg-black/30 border border-[#124d12]/30 p-2 rounded-sm space-y-1.5">
                                  <span className="text-red-400 font-bold tracking-wider block uppercase text-[7.5px] border-b border-[#124d12]/20 pb-1">
                                    ⚠️ DECAYING THREAT MEMORY REGISTERS ({Object.keys(sovereignAgent.threatMemory || {}).length})
                                  </span>
                                  <div className="space-y-1 max-h-[88px] overflow-y-auto custom-scrollbar pr-0.5">
                                    {Object.keys(sovereignAgent.threatMemory || {}).length > 0 ? (
                                      (Object.entries(sovereignAgent.threatMemory) as [string, any][]).map(([cid, tm]) => (
                                        <div key={cid} className="flex justify-between items-center p-1 bg-red-950/5 border border-red-900/10 rounded-[2px] font-mono text-[7px]" id={`threat-memory-item-${cid}`}>
                                          <div className="flex flex-col">
                                            <span className="text-red-200 font-bold">{cid} [{tm.perceivedCategory}]</span>
                                            <span className="text-[6.5px] text-zinc-400">Launch Tick: {tm.launchTick}</span>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-red-400 font-bold block">{tm.severityLevel} SEV</span>
                                            <span className="text-[6.5px] text-zinc-500 block">Decay: {tm.decayIndex.toFixed(0)}%</span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-zinc-600 italic text-center py-1 text-[7px]">No threat history logged.</p>
                                    )}
                                  </div>
                                </div>
 
                                {/* Persistent Trust Memory */}
                                <div className="bg-black/30 border border-[#124d12]/30 p-2 rounded-sm space-y-1.5">
                                  <span className="text-cyan-400 font-bold tracking-wider block uppercase text-[7.5px] border-b border-[#124d12]/20 pb-1">
                                    👥 PERSISTENT TRUST REGISTERS ({Object.keys(sovereignAgent.trustMemory || {}).length})
                                  </span>
                                  <div className="space-y-1 max-h-[88px] overflow-y-auto custom-scrollbar pr-0.5">
                                    {Object.keys(sovereignAgent.trustMemory || {}).length > 0 ? (
                                      (Object.entries(sovereignAgent.trustMemory) as [string, any][]).map(([cid, tM]) => (
                                        <div key={cid} className="flex justify-between items-center p-1 bg-cyan-950/5 border border-cyan-900/15 rounded-[2px] font-mono text-[7px]" id={`trust-memory-item-${cid}`}>
                                          <div className="flex flex-col">
                                            <span className="text-cyan-200 font-bold">{cid} (RELIABILITY: {tM.cooperativenessRating}%)</span>
                                            <span className="text-[6.5px] text-zinc-400">Since Tick: {tM.establishedTick}</span>
                                          </div>
                                          <div className="text-right flex flex-col items-end">
                                            <span className="text-emerald-400 font-bold">{tM.promiseKeptCount} KEPT</span>
                                            <span className="text-rose-400 font-bold text-[6px]">{tM.promiseBrokenCount} BROKEN</span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-zinc-600 italic text-center py-1 text-[7px]">No trust bonds compiled.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {systemsSubTab === 'CANONICAL' && (
                        <div className="space-y-3">
                          {(() => {
                            const countryState = world?.countriesById[countryId];
                            const leaderState = countryState?.leaderId ? world?.leadersById[countryState.leaderId] : null;
                            if (!countryState) {
                              return <div className="text-red-500 font-bold border border-red-950 p-2 text-center bg-red-950/20">CANONICAL SYSTEMS SYNCHRONIZATION LOCKED</div>;
                            }
                            
                            const events = world?.eventsById ? Object.values(world.eventsById).filter(e => e.involvedCountryIds.includes(countryId)) : [];
                            const ops = world?.operationsById ? Object.values(world.operationsById).filter(op => op.sponsorCountryId === countryId || op.targetCountryIds.includes(countryId)) : [];
                            const intel = world?.intelFactsById ? Object.values(world.intelFactsById).filter(fact => fact.relatedCountryIds.includes(countryId)) : [];
                            const treaties = world?.treatiesById ? Object.values(world.treatiesById).filter(t => t.signatoryCountryIds.includes(countryId)) : [];

                            return (
                              <div className="space-y-3">
                                <div className="bg-[#020502]/80 p-2.5 border border-[#1a5c1a]/40 rounded-sm">
                                  <span className="text-[#00ff44] font-black text-[8px] tracking-widest block border-b border-[#124d12] pb-1 uppercase mb-2">
                                    ⚙ CANONICAL WORLD STATE ACTIVE ENGINE (TICK: {world?.tick || currentTick})
                                  </span>
                                  <div className="grid grid-cols-3 gap-2.5 text-[8.5px]">
                                    <div><span className="text-gray-500 uppercase font-black block text-[7px]">SYSTEM ISO CODE</span> <span className="text-white font-bold font-mono">{countryState.isoCode}</span></div>
                                    <div><span className="text-gray-500 uppercase font-black block text-[7px]">CAPITAL COMMAND</span> <span className="text-[#00ff44]">{countryState.capital}</span></div>
                                    <div><span className="text-gray-500 uppercase font-black block text-[7px]">REGISTRY REGION</span> <span className="text-white font-bold">{countryState.region} ({countryState.subregion})</span></div>
                                    <div><span className="text-gray-500 uppercase font-black block text-[7px]">GOV STATUS</span> <span className="text-[#ffb300] font-bold">{countryState.governmentType}</span></div>
                                    <div><span className="text-gray-500 uppercase font-black block text-[7px]">REGIME INDEX</span> <span className="text-white">{countryState.regimeStability}% STABILITY</span></div>
                                    <div><span className="text-gray-500 uppercase font-black block text-[7px]">PUBLIC SENTIMENT</span> <span className="text-cyan-400 font-bold">{countryState.publicSentiment}% APPROVAL</span></div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  {/* Leader details */}
                                  <div className="bg-[#121612]/35 border border-[#1a5c1a]/35 p-3 rounded-sm">
                                    <span className="text-pink-400 font-black block border-b border-[#1a5c1a]/20 pb-1 mb-1.5 uppercase tracking-wide text-[7.5px]">
                                      ★ CANONICAL PROFILED LEADER STATE:
                                    </span>
                                    {leaderState ? (
                                      <div className="space-y-1.5 text-[8.5px]">
                                        <div><span className="text-gray-400">FULL NAME:</span> <span className="text-white font-extrabold">{leaderState.fullName}</span></div>
                                        <div><span className="text-gray-400">EXECUTIVE TITLE:</span> <span className="text-[#00ff44]">{leaderState.title}</span></div>
                                        <div className="flex gap-1.5 flex-wrap items-center mt-1"><span className="text-gray-400">TRAITS:</span> {leaderState.traits.map((t, idx) => <span key={idx} className="bg-green-950/40 text-green-400 px-1 border border-green-900 rounded-[2px] text-[7.5px]">{t}</span>)}</div>
                                        <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-[#092009] mt-1.5">
                                          <div><span className="text-gray-500 text-[6.5px] block font-bold uppercase">AGGRESSION</span> <span className="text-red-400 font-bold">{leaderState.aggression}%</span></div>
                                          <div><span className="text-gray-500 text-[6.5px] block font-bold uppercase">CAUTION</span> <span className="text-blue-400 font-bold">{leaderState.caution}%</span></div>
                                          <div><span className="text-gray-500 text-[6.5px] block font-bold uppercase">PARANOIA</span> <span className="text-yellow-400 font-bold">{leaderState.paranoia}%</span></div>
                                        </div>
                                        <div className="pt-1.5"><span className="text-gray-500 text-[7px]">HIDDEN RED-LINES:</span> <span className="text-red-400 font-bold italic block mt-0.5 border border-red-950/40 p-1.5 rounded bg-black/40 text-[7.5px]">"{leaderState.hiddenRedLines[0] || 'Sovereign boundaries violated'}"</span></div>
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 italic">No leader mapped to this system identifier.</p>
                                    )}
                                  </div>

                                  {/* Strategic goals */}
                                  <div className="bg-[#121612]/35 border border-[#1a5c1a]/35 p-3 rounded-sm space-y-2">
                                    <span className="text-amber-400 font-black block border-b border-[#1a5c1a]/20 pb-1 mb-1.5 uppercase tracking-wide text-[7.5px]">
                                      STRATEGIC GOALS & THREAT PERCEPTIONS
                                    </span>
                                    <div>
                                      <span className="text-gray-400 block font-bold mb-1 uppercase text-[7px]">ACTIVE AI STRATEGY GOALS:</span>
                                      <ul className="list-disc list-inside space-y-0.5 text-zinc-300 text-[8px]">
                                        {(countryState.ai.strategicGoals || []).slice(0, 3).map((g, idx) => (
                                          <li key={idx} className="truncate">{g}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="border-t border-[#0d2a0d] pt-1.5 mt-1.5 text-[8px] space-y-1">
                                      <span className="text-orange-400 font-bold text-[7.5px]">MONITORED THREAT PERCEPTIONS:</span>
                                      <div className="grid grid-cols-2 gap-1.5 max-h-[50px] overflow-y-auto custom-scrollbar pr-0.5">
                                        {Object.keys(countryState.ai.threatPerceptions || {}).slice(0, 4).map((cid) => (
                                          <div key={cid} className="flex justify-between border-b border-[#124d12]/10 py-0.5 font-mono">
                                            <span className="text-gray-500 font-bold">{cid}:</span>
                                            <span className="text-red-400 font-bold">{countryState.ai.threatPerceptions[cid]}% WRN</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Economy, military, and cyber snapshots */}
                                <div className="grid grid-cols-3 gap-2.5">
                                  <div className="bg-[#020502]/60 p-2 border border-[#1a5c1a]/30 rounded-sm space-y-1.5">
                                    <span className="text-[#00ff44] font-black block border-b border-[#0d2a0d] pb-0.5 text-[7px] uppercase tracking-wider">
                                      ECONOMY SNAPSHOT
                                    </span>
                                    <div className="space-y-1 text-[7.5px] text-zinc-300">
                                      <div className="flex justify-between"><span>GDP growth:</span> <span className="text-[#00ff44] font-bold">{countryState.economy.growthRate.toFixed(1)}%</span></div>
                                      <div className="flex justify-between"><span>Debt ratio:</span> <span className="text-orange-400 font-bold">{countryState.economy.debtRatio.toFixed(1)}%</span></div>
                                      <div className="flex justify-between"><span>Trade balance:</span> <span className="text-blue-400 font-bold">${countryState.economy.tradeBalance.toFixed(1)}B</span></div>
                                      <div className="flex justify-between flex-wrap"><span>Energy style:</span> <span className="text-white block truncate">{countryState.economy.energyProfile}</span></div>
                                    </div>
                                  </div>

                                  <div className="bg-[#020502]/60 p-2 border border-[#1a5c1a]/30 rounded-sm space-y-1.5">
                                    <span className="text-red-400 font-black block border-b border-[#0d2a0d] pb-0.5 text-[7px] uppercase tracking-wider">
                                      MILITARY SNAPSHOT
                                    </span>
                                    <div className="space-y-1 text-[7.5px] text-zinc-300">
                                      <div className="flex justify-between"><span>Morale ratio:</span> <span className="text-green-400 font-bold">{countryState.military.morale}%</span></div>
                                      <div className="flex justify-between"><span>Logistics level:</span> <span className="text-cyan-400 font-bold">{countryState.military.logisticsCapacity}%</span></div>
                                      <div className="flex justify-between"><span>Mobilization:</span> <span className="text-orange-400 font-bold">{countryState.military.mobilizationLevel}%</span></div>
                                      <div className="flex justify-between"><span>Deterrence index:</span> <span className="text-white font-bold">{countryState.military.strategicDeterrence} IND</span></div>
                                    </div>
                                  </div>

                                  <div className="bg-[#020502]/60 p-2 border border-[#1a5c1a]/30 rounded-sm space-y-1.5">
                                    <span className="text-cyan-400 font-black block border-b border-[#0d2a0d] pb-0.5 text-[7px] uppercase tracking-wider">
                                      CYBER SNAPSHOT
                                    </span>
                                    <div className="space-y-1 text-[7.5px] text-zinc-300">
                                      <div className="flex justify-between"><span>Offensive:</span> <span className="text-red-400 font-bold">{countryState.cyber.offensiveCapability}%</span></div>
                                      <div className="flex justify-between"><span>Defense Level:</span> <span className="text-[#00ff44] font-bold">{countryState.cyber.defensiveCapability}%</span></div>
                                      <div className="flex justify-between"><span>Intrusion Pct:</span> <span className="text-pink-400 font-bold">{countryState.cyber.intrusionLevel}%</span></div>
                                      <div className="flex justify-between flex-wrap"><span>Apt group:</span> <span className="text-zinc-400 font-mono block">APT-{countryState.cyber.aptStrength}</span></div>
                                    </div>
                                  </div>
                                </div>

                                {/* Active simulation records */}
                                <div className="bg-[#101511]/40 p-2.5 border border-[#124d12]/45 rounded-sm space-y-2">
                                  <span className="text-cyan-400 font-black text-[7.5px] tracking-wide block border-b border-[#124d12] pb-1 uppercase">
                                    MONITORED SIMULATION RELATIONSHIPS (DATABASE ENTITY ARRAYS)
                                  </span>
                                  <div className="grid grid-cols-4 gap-2.5 text-[7.5px]">
                                    <div className="space-y-1 bg-black/40 p-1.5 border border-[#124d12]/20 rounded-sm">
                                      <span className="text-red-400 font-bold block uppercase border-b border-[#124d12]/20 pb-0.5 text-[6.5px]">ACTIVE CRISES ({events.length})</span>
                                      {events.length > 0 ? events.map((ev, i) => (
                                        <div key={i} className="py-0.5 mb-1 border-b border-[#0b250b] truncate text-zinc-300 font-medium uppercase font-mono" title={ev.description}>
                                          ⚠️ {ev.title}
                                        </div>
                                      )) : <p className="text-zinc-600 italic">No active crises.</p>}
                                    </div>

                                    <div className="space-y-1 bg-black/40 p-1.5 border border-[#124d12]/20 rounded-sm">
                                      <span className="text-[#ffb300] font-bold block uppercase border-b border-[#124d12]/20 pb-0.5 text-[6.5px]">COVERT OPERATIONS ({ops.length})</span>
                                      {ops.length > 0 ? ops.map((op, i) => (
                                        <div key={i} className="py-0.5 mb-1 border-b border-[#0b250b] truncate text-zinc-300 font-medium uppercase font-mono" title={op.expectedEffects.join(', ')}>
                                          🕵️‍♂️ {op.ownerSystem}
                                        </div>
                                      )) : <p className="text-zinc-600 italic">No hidden operations.</p>}
                                    </div>

                                    <div className="space-y-1 bg-black/40 p-1.5 border border-[#124d12]/20 rounded-sm">
                                      <span className="text-[#00ff44] font-bold block uppercase border-b border-[#124d12]/20 pb-0.5 text-[6.5px]">ACTIVE TREATIES ({treaties.length})</span>
                                      {treaties.length > 0 ? treaties.map((t, i) => (
                                        <div key={i} className="py-0.5 mb-1 border-b border-[#0b250b] truncate text-zinc-300 font-medium uppercase font-mono" title={t.obligations.join(', ')}>
                                          📜 {t.name}
                                        </div>
                                      )) : <p className="text-zinc-600 italic">No valid treaties.</p>}
                                    </div>

                                    <div className="space-y-1 bg-black/40 p-1.5 border border-[#124d12]/20 rounded-sm">
                                      <span className="text-cyan-400 font-bold block uppercase border-b border-[#124d12]/20 pb-0.5 text-[6.5px]">COMPILED INTEL ({intel.length})</span>
                                      {intel.length > 0 ? intel.map((fact, i) => (
                                        <div key={i} className="py-0.5 mb-1 border-b border-[#0b250b] truncate text-zinc-300 font-medium uppercase font-mono" title={fact.summary}>
                                          📡 {fact.title}
                                        </div>
                                      )) : <p className="text-zinc-600 italic">No discrete intel.</p>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================
                      --- INTEL TAB MONITOR (CLASSIFIED IMMERSIVE INTELLIGENCE WORKSPACE) ---
                     ======================================================== */}
                  {activeTab === 'INTEL' && (
                    <div className="space-y-3 flex flex-col min-h-0 flex-1 overflow-hidden" id="dossier-intel-hotspots-pane">
                      
                      {/* Sub tab title header */}
                      <div className="flex justify-between items-center border-b border-[#124d12]/50 pb-1.5 shrink-0">
                        <span className="text-[#00ff44] text-[10.5px] font-black uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-[#00ff44] rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,100,0.8)]" />
                          CLASSIFIED GEOGRAPHIC INTELLIGENCE REGISTRY ({countryHotspots.length} ASSETS)
                        </span>
                        <span className="text-slate-500 text-[7px] font-mono tracking-[0.3em] uppercase">
                          LEVEL 1 // SYSTEM RECON VECTOR
                        </span>
                      </div>

                      {countryHotspots.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-5 border border-dashed border-[#1a5c1a]/50 rounded-sm bg-black/45 animate-pulse">
                          <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest leading-loose">
                            [ NO SATELLITE VECTOR DETECTED ]
                          </span>
                          <span className="text-gray-600 font-sans text-[7.5px] mt-1.5 max-w-sm mx-auto leading-relaxed">
                            Deploy regional reconnaissance, electronic signal decrypters, or high-altitude drone passes to uncover active military target networks in the theater.
                          </span>
                        </div>
                      ) : (
                        
                        /* Unified 3-Zone Space-Grade layout */
                        <div className="grid grid-cols-12 gap-3 min-h-0 flex-1 overflow-hidden">
                          
                          {/* ========================================================
                              ZONE 1: EXPLORATIVE SIDEBAR FILTER & INDEX LISTING (col-span-4)
                             ======================================================== */}
                          <div className="col-span-4 border-r border-[#124d12]/40 pr-2.5 flex flex-col gap-2 min-h-0 overflow-hidden">
                            
                            {/* Faceted Filters section */}
                            <div className="space-y-1.5 bg-[#020502]/85 p-2 rounded-sm border border-[#1a5c1a]/40 shrink-0">
                              <span className="text-[6.5px] text-gray-500 font-mono tracking-widest uppercase block">Exploration Decrypt Filter</span>
                              
                              {/* Search query field */}
                              <input
                                type="text"
                                placeholder="Search keyword or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black border border-[#1a5c1a]/50 text-xs text-white px-2 py-1 rounded-sm focus:outline-none focus:border-[#00ff44] font-mono placeholder-gray-700"
                              />

                              {/* Dropdowns for threat level and custom types */}
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                <div className="space-y-0.5">
                                  <label className="text-[5.5px] text-gray-500 font-mono block">FILTER TYPE</label>
                                  <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value as any)}
                                    className="w-full bg-black border border-[#1a5c1a]/40 text-[7px] text-[#00ff44] p-1 rounded-sm cursor-pointer"
                                  >
                                    <option value="ALL">ALL TYPES</option>
                                    <option value="MISSILE_SITE">LAUNCH SILO</option>
                                    <option value="NAVAL_BASE">NAVAL BASE</option>
                                    <option value="AIR_BASE">AIR BASE</option>
                                    <option value="NUCLEAR_FACILITY">NUCLEAR FACILITY</option>
                                    <option value="CYBER_FACILITY">CYBER NODE</option>
                                    <option value="COVERT_SITE">COVERT SITE</option>
                                  </select>
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[5.5px] text-gray-500 font-mono block">THREAT LEVEL</label>
                                  <select
                                    value={threatFilter}
                                    onChange={(e) => setThreatFilter(e.target.value)}
                                    className="w-full bg-black border border-[#1a5c1a]/40 text-[7px] text-red-400 p-1 rounded-sm cursor-pointer"
                                  >
                                    <option value="ALL">ALL THREATS</option>
                                    <option value="NOMINAL">NOMINAL</option>
                                    <option value="STABLE">STABLE</option>
                                    <option value="MONITORING">MONITORING</option>
                                    <option value="ELEVATED">ELEVATED</option>
                                    <option value="SEVERE">SEVERE</option>
                                    <option value="HIGH ALERT">HIGH ALERT</option>
                                  </select>
                                </div>
                              </div>

                              {/* Sorting and alignment */}
                              <div className="pt-1 flex justify-between items-center text-[6px]">
                                <span className="text-gray-500 font-mono">SORT KEY</span>
                                <div className="flex gap-1">
                                  {(['VALUE', 'CONFIDENCE', 'THREAT', 'IMPORTANCE'] as const).map((key) => (
                                    <button
                                      key={key}
                                      onClick={() => setSortBy(key)}
                                      className={`px-1 py-0.5 border rounded-sm tracking-tight ${
                                        sortBy === key
                                          ? 'border-green-400 text-green-400 bg-green-950/20'
                                          : 'border-transparent text-gray-500 hover:text-white'
                                      }`}
                                    >
                                      {key}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Active filter chips */}
                              {(searchQuery !== '' || typeFilter !== 'ALL' || threatFilter !== 'ALL') && (
                                <div className="pt-1.5 flex justify-between items-center border-t border-[#0d2a0d]/50 mt-1">
                                  <span className="text-[5.5px] text-[#ffb355] font-bold">FILTERS ENGAGED</span>
                                  <button
                                    onClick={() => {
                                      setSearchQuery('');
                                      setTypeFilter('ALL');
                                      setThreatFilter('ALL');
                                    }}
                                    className="text-[5.5px] text-[#fb4444] font-bold bg-transparent border-none hover:underline cursor-pointer"
                                  >
                                    [ CLEAR FILTERS ]
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Session Quick Jump queue to keep the analysis loop going */}
                            {recentlyInspectedIds.length > 1 && (
                              <div className="shrink-0 bg-black/60 p-1.5 border border-[#1a5c1a]/25 rounded-sm flex flex-col gap-1">
                                <span className="text-[5.5px] text-zinc-500 font-black tracking-widest uppercase">RECENT INSPECTION QUEUE:</span>
                                <div className="flex gap-1 overflow-x-auto select-none py-0.5 max-w-full">
                                  {recentlyInspectedIds.map((id) => {
                                    const match = countryHotspots.find((h) => h.id === id);
                                    if (!match) return null;
                                    const isSelected = selectedHotspotId === id;
                                    return (
                                      <button
                                        key={id}
                                        onClick={() => {
                                          audio.sfxKeyClick();
                                          setSelectedHotspot(id, countryId);
                                        }}
                                        className={`px-1.5 py-0.5 text-[5.5px] border font-mono rounded truncate max-w-[80px] shrink-0 ${
                                          isSelected
                                            ? 'border-[#00ff44] text-white bg-green-950/30 font-black'
                                            : 'border-green-950 text-gray-500 hover:border-gray-700 hover:text-slate-300'
                                        }`}
                                      >
                                        {match.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Scrollable target buttons index */}
                            <div className="overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-0.5 flex-1 select-none">
                              {sortedHotspots.length === 0 ? (
                                <div className="text-center py-5 italic text-[7.5px] text-gray-500">No matching assets found within selected sectors.</div>
                              ) : (
                                sortedHotspots.map((hotspot) => {
                                  const isSelected = selectedHotspotId === hotspot.id;
                                  
                                  let statusClass = 'text-green-400 border-green-950 bg-green-950/20';
                                  if (hotspot.status === 'CLASSIFIED' || hotspot.status === 'SECURED') {
                                    statusClass = 'text-purple-400 border-purple-950 bg-purple-950/10';
                                  } else if (hotspot.status === 'HIGH ALERT') {
                                    statusClass = 'text-red-400 border-red-950 bg-red-950/20 animate-pulse';
                                  } else if (hotspot.status === 'ON-GUARD') {
                                    statusClass = 'text-amber-400 border-amber-950 bg-amber-950/15';
                                  }

                                  let icon = '📡';
                                  if (hotspot.type === 'NAVAL_BASE') icon = '⚓';
                                  else if (hotspot.type === 'AIR_BASE') icon = '🛫';
                                  else if (hotspot.type === 'NUCLEAR_FACILITY') icon = '☢️';
                                  else if (hotspot.type === 'MISSILE_SITE') icon = '🚀';
                                  else if (hotspot.type === 'CYBER_FACILITY') icon = '💻';
                                  else if (hotspot.type === 'COVERT_SITE') icon = '👁️';

                                  return (
                                    <button
                                      key={hotspot.id}
                                      onClick={() => {
                                        audio.sfxKeyClick();
                                        setSelectedHotspot(hotspot.id, countryId);
                                      }}
                                      className={`text-left p-2 border rounded-sm cursor-pointer transition-all duration-150 flex flex-col gap-1 w-full relative overflow-hidden group
                                        ${isSelected
                                          ? 'bg-[#1a4a1a]/30 border-[#00ff44] text-white shadow-[inset_0_0_8px_rgba(0,255,100,0.15)]'
                                          : 'bg-black/55 border-[#124d12]/45 text-gray-300 hover:border-gray-500/50 hover:bg-black/80'
                                        }
                                      `}
                                    >
                                      {/* Side active indicator line */}
                                      {isSelected && <div className="absolute left-0 inset-y-0 w-0.5 bg-[#00ff44]" />}

                                      <div className="flex justify-between items-start gap-1">
                                        <span className="font-black text-[8px] block truncate text-ellipsis max-w-[85%] uppercase tracking-wider group-hover:text-white transition-colors">
                                          {icon} {hotspot.name}
                                        </span>
                                      </div>
                                      
                                      <div className="flex justify-between items-center text-[6px] text-gray-500 font-mono tracking-wider w-full pt-0.5">
                                        <span>{hotspot.type.replace('_', ' ')}</span>
                                        <span className={`border px-1 py-[1.5px] rounded-sm uppercase tracking-widest text-[5px] leading-none ${statusClass}`}>
                                          {hotspot.status}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* ========================================================
                              ZONE 2: HIGH-RESOLUTION WIDESCREEN IMAGERY TERMINAL COVERAGE (col-span-8)
                             ======================================================== */}
                          {activeHotspot ? (
                            <div className="col-span-8 flex flex-col gap-2 min-h-0 h-full overflow-y-auto custom-scrollbar pr-0.5 justify-between">
                              {(() => {
                                const imageAssets = activeHotspot.imageAssets || [];
                                const activeImage = imageAssets[activeHeroImageIdx] || null;

                                return (
                                  <div className="space-y-2 font-sans flex flex-col h-full justify-between min-h-0">
                                    
                                    {/* Intelligence header and target lock display strip */}
                                    <div className="border border-green-900/60 bg-green-950/15 p-1 rounded-sm shrink-0 flex justify-between items-center px-2 font-mono text-[6.5px]">
                                      <span className="text-[#00ff44] tracking-widest font-black uppercase flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-[#00ff44] rounded-full animate-ping" />
                                        {activeHotspot.classification || 'TOP SECRET // SIGNAL ACCESS LOCK'}
                                      </span>
                                      <span className="text-gray-500 font-black uppercase">
                                        RECON DATASTREAM INTRUSION COMPILER
                                      </span>
                                    </div>

                                    {/* Stats analytics block */}
                                    <div className="grid grid-cols-4 gap-1.5 border-b border-[#0d5c0d]/30 pb-1.5 shrink-0 text-[6.5px] font-mono uppercase text-gray-500 leading-none">
                                      <div className="bg-black/45 p-1 rounded-sm border border-[#1a5c1a]/15">
                                        <span>CONF SCORE</span>
                                        <span className="text-white font-black block text-[8px] tracking-normal mt-1">{activeHotspot.confidenceScore || 95}% CERTAINTY</span>
                                      </div>
                                      <div className="bg-black/45 p-1 rounded-sm border border-[#1a5c1a]/15">
                                        <span>THREAT CLASS</span>
                                        <span className="text-red-400 font-black block text-[8px] tracking-normal mt-1 animate-pulse">{activeHotspot.threatLevel || 'SEVERE'}</span>
                                      </div>
                                      <div className="bg-black/45 p-1 rounded-sm border border-[#1a5c1a]/15">
                                        <span>STRATEGIC VALUE</span>
                                        <span className="text-amber-400 font-black block text-[8px] tracking-normal mt-1">{activeHotspot.strategicValue || 90}/100 POINTS</span>
                                      </div>
                                      <div className="bg-black/45 p-1 rounded-sm border border-[#1a5c1a]/15">
                                        <span>GPS LOCK-ON</span>
                                        <span className="text-cyan-400 font-black block text-[7.5px] tracking-normal mt-1">{activeHotspot.lat.toFixed(4)}N, {activeHotspot.lon.toFixed(4)}E</span>
                                      </div>
                                    </div>

                                    {/* WIDESCREEN HERO VIEWPORT CONSOLE */}
                                    <div className="relative group overflow-hidden w-full h-[180px] border-2 border-[#124d12] rounded-md shrink-0 bg-black flex items-center justify-center select-none shadow-[0_0_15px_rgba(0,0,0,0.8)]">
                                      {activeImage ? (
                                        <>
                                          {/* Scanlines and phosphor CRT dynamic filter overlays */}
                                          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%),linear-gradient(90deg,rgba(0,255,100,0.03),rgba(0,255,100,0.01),rgba(0,255,100,0.03))] bg-[length:100%_4px,4px_100%] z-10 opacity-70" />
                                          
                                          {/* Tactical telemetry HUD crosshair and corners overlays */}
                                          <div className="absolute inset-2 pointer-events-none border border-green-500/10 z-10 flex flex-col justify-between">
                                            <div className="flex justify-between p-1 text-[5px] text-[#00ff44]/40 font-mono leading-none">
                                              <span>AZIMUTH: 382.4°N</span>
                                              <span>RANGE: 3,540 KM</span>
                                            </div>
                                            <div className="flex justify-between p-1 text-[5px] text-[#00ff44]/40 font-mono leading-none">
                                              <span>BANDWIDTH: X-RAY SAT</span>
                                              <span>RESOL: 0.12M GSD</span>
                                            </div>
                                          </div>
                                          
                                          {/* SVG Target Center Reticle */}
                                          <div className="absolute pointer-events-none inset-0 flex items-center justify-center z-10 opacity-40 group-hover:scale-110 transition-transform duration-300">
                                            <div className="relative w-12 h-12 border border-dashed border-[#00ff44] rounded-full">
                                              <div className="absolute top-1/2 left-0 w-2 h-px bg-[#00ff44] -translate-y-1/2" />
                                              <div className="absolute top-1/2 right-0 w-2 h-px bg-[#00ff44] -translate-y-1/2" />
                                              <div className="absolute left-1/2 top-0 w-px h-2 bg-[#00ff44] -translate-x-1/2" />
                                              <div className="absolute left-1/2 bottom-0 w-px h-2 bg-[#00ff44] -translate-x-1/2" />
                                            </div>
                                          </div>

                                          {/* Tactical lens selector overlay badges */}
                                          <div className="absolute top-2 left-3 z-20 flex gap-1 bg-black/80 border border-[#1a5c1a]/50 p-1 rounded-sm text-[5px] font-mono tracking-widest text-slate-300">
                                            <button
                                              onClick={(e) => { e.stopPropagation(); audio.sfxKeyClick(); setImageFilterMode('OPTICAL'); }}
                                              className={`px-1 py-0.5 rounded-sm transition-colors ${imageFilterMode === 'OPTICAL' ? 'bg-[#00ff44] text-black font-black' : 'hover:bg-green-950/40 hover:text-white'}`}
                                            >
                                              [ OPTICAL ]
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); audio.sfxKeyClick(); setImageFilterMode('THERMAL'); }}
                                              className={`px-1 py-0.5 rounded-sm transition-colors ${imageFilterMode === 'THERMAL' ? 'bg-orange-500 text-black font-black' : 'hover:bg-green-950/40 hover:text-white'}`}
                                            >
                                              [ THERMAL IR ]
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); audio.sfxKeyClick(); setImageFilterMode('EDGE'); }}
                                              className={`px-1 py-0.5 rounded-sm transition-colors ${imageFilterMode === 'EDGE' ? 'bg-cyan-400 text-black font-black' : 'hover:bg-green-950/40 hover:text-white'}`}
                                            >
                                              [ GEOINT EDGE ]
                                            </button>
                                          </div>

                                          <img
                                            src={activeImage.src}
                                            alt={activeImage.alt}
                                            referrerPolicy="no-referrer"
                                            decoding="async"
                                            onLoad={() => setImageLoading(false)}
                                            onLoadStart={() => setImageLoading(true)}
                                            onClick={() => {
                                              audio.sfxKeyClick();
                                              setLightboxOpen(true);
                                            }}
                                            className={`w-full h-full object-cover cursor-zoom-in transition-all duration-300
                                              ${imageLoading ? 'opacity-20 blur-sm scale-95' : 'opacity-80 hover:opacity-100 hover:scale-[1.03]'}
                                              ${
                                                imageFilterMode === 'THERMAL'
                                                  ? 'filter sepia brightness-110 saturate-[2.5] hue-rotate-[15deg] contrast-[1.8]'
                                                  : imageFilterMode === 'EDGE'
                                                  ? 'filter invert saturate-0 contrast-[300%] brightness-[1.3] mix-blend-color-dodge text-green-400'
                                                  : 'brightness-90 contrast-[1.1]'
                                              }
                                            `}
                                            style={imageFilterMode === 'EDGE' ? { filter: 'grayscale(100%) contrast(300%) brightness(1.2)' } : undefined}
                                          />

                                          {/* Sensor Mode Status Label */}
                                          <div className="absolute right-3 top-2 z-10 bg-black/75 border border-zinc-800 px-1.5 py-0.5 text-[#00ff44] text-[5.5px] font-mono leading-none uppercase tracking-widest select-none font-bold">
                                            SCANNER MODE: {imageFilterMode}
                                          </div>

                                          {imageLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#020502]/90 border border-[#1a5c1a] rounded z-20">
                                              <span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                              <span className="font-mono text-[7px] tracking-[0.2em] text-[#00ff44] uppercase font-bold">DECRYPTING IMAGERY STREAM...</span>
                                            </div>
                                          )}
                                          
                                          {/* Caption bottom bar overlay */}
                                          <div className="absolute bottom-0 inset-x-0 bg-black/85 border-t border-green-950/40 p-1.5 text-[7px]/tight text-gray-300 truncate font-sans text-center transition-all group-hover:bg-opacity-95 z-10">
                                            {activeImage.caption || activeImage.alt}
                                          </div>
                                        </>
                                      ) : (
                                        <span className="text-gray-500 font-mono text-[8px] uppercase">Telemetry Imagery Stream Offline</span>
                                      )}
                                    </div>

                                    {/* Image Asset Thumbnail Reel */}
                                    {imageAssets.length > 1 && (
                                      <div className="flex gap-2 py-0.5 justify-center shrink-0">
                                        {imageAssets.map((asset, assetIdx) => {
                                          const isImgSelected = activeHeroImageIdx === assetIdx;
                                          return (
                                            <button
                                              key={asset.id}
                                              onClick={() => {
                                                audio.sfxKeyClick();
                                                setActiveHeroImageIdx(assetIdx);
                                              }}
                                              className={`relative w-[38px] h-[38px] rounded border overflow-hidden cursor-pointer bg-black/80 flex-shrink-0 transition-all duration-150 group
                                                ${isImgSelected
                                                  ? 'border-[#00ff44] scale-[1.08] shadow-[0_0_10px_rgba(0,255,68,0.45)]'
                                                  : 'border-[#113a11]/80 opacity-60 hover:opacity-100 hover:border-gray-500'
                                                }
                                              `}
                                            >
                                              <img
                                                src={asset.thumbSrc || asset.src}
                                                alt={asset.alt}
                                                referrerPolicy="no-referrer"
                                                decoding="async"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                              />
                                              <span className="absolute bottom-0 right-0 bg-black/85 font-mono text-[4.5px] leading-none text-[#ffb300] px-0.5 uppercase border-l border-t border-green-950">
                                                {asset.kind[0]}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Description analysis narrative */}
                                    <div className="space-y-1.5 mt-0.5 shrink-0 flex-1 flex flex-col justify-between min-h-0">
                                      <div className="max-h-[90px] overflow-y-auto custom-scrollbar bg-black/35 p-2 rounded border border-[#1a5c1a]/20">
                                        <p className="text-[#a8bdc4] font-sans text-[8px]/relaxed border-l-2 border-[#00ff44]/75 pl-2 leading-relaxed">
                                          {activeHotspot.description}
                                        </p>
                                      </div>
                                      
                                      {/* Tags list */}
                                      {activeHotspot.tags && activeHotspot.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1 shrink-0">
                                          {activeHotspot.tags.map(tag => (
                                            <span key={tag} className="text-[6px] font-mono tracking-wider bg-[#112a11]/45 text-[#00ff44] border border-[#113a11]/60 px-1.5 py-0.5 rounded-sm uppercase">
                                              #{tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Copy / Pin coordinates Action row */}
                                    <div className="flex gap-2 border-t border-[#124d12]/30 pt-1.5 shrink-0 justify-between items-center bg-[#010c03]/30 p-1.5 rounded border border-[#1a5c1a]/20">
                                      <span className="text-[7px] text-[#ffb300] font-black uppercase font-mono tracking-wider">
                                        {coordinatesCopied ? '🔴 VECTOR LOCKED IN SYSTEMS' : '📡 DIRECT COORDINATES PRESET'}
                                      </span>
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => handleCopyCoords(`${activeHotspot.lat.toFixed(6)}, ${activeHotspot.lon.toFixed(6)}`)}
                                          className={`px-3 py-1 text-[7px] font-black uppercase tracking-wider rounded border transition-all cursor-pointer ${
                                            coordinatesCopied
                                              ? 'bg-red-950/40 text-red-400 border-red-500 animate-pulse'
                                              : 'bg-green-950/30 text-green-400 border-green-800 hover:border-green-400 hover:text-white'
                                          }`}
                                        >
                                          {coordinatesCopied ? '✓ VECTOR TRANSMITTED' : '[ LOCK STRIKE COORDINATES ]'}
                                        </button>
                                      </div>
                                    </div>

                                    {/* ========================================================
                                        ZONE 3: RELATED STRATEGIC ASSETS CONNECTIVITY (Endless exploration loop!)
                                       ======================================================== */}
                                    {strategicClassLinks.length > 0 && (
                                      <div className="shrink-0 bg-black/55 p-2 rounded border border-[#1a5c1a]/30 mb-0.5">
                                        <span className="text-[6.5px] text-[#00e5ff] font-black tracking-widest uppercase block mb-1">
                                          CONNECTED STRATEGIC SATELLITE LINKS (SAME DOCTRINE)
                                        </span>
                                        <div className="grid grid-cols-2 gap-1.5">
                                          {strategicClassLinks.slice(0, 2).map((link) => {
                                            const otherCountry = useWorldStore.getState().countries[link.countryId];
                                            return (
                                              <button
                                                key={link.id}
                                                onClick={() => {
                                                  audio.sfxKeyClick();
                                                  // Rapid route swap context preserving: set hot spot of other country direct
                                                  setSelectedHotspot(link.id, link.countryId);
                                                }}
                                                className="text-left p-1 text-[6.5px] border border-cyan-950/80 bg-cyan-950/5 hover:border-cyan-400/70 hover:bg-cyan-950/20 rounded-sm text-cyan-400 font-mono flex items-center justify-between transition-all duration-150 cursor-pointer"
                                              >
                                                <span className="truncate max-w-[80%] uppercase font-bold">
                                                  🌍 FORCE_LOCK: {link.name} ({otherCountry?.name || link.countryId})
                                                </span>
                                                <span className="text-[5px] text-gray-500 font-black">OPEN LINK &gt;&gt;</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="col-span-8 flex flex-col items-center justify-center p-5 text-center border border-dashed border-[#1a5c1a]/30 my-auto">
                              <span className="text-gray-500 font-mono text-[8px] uppercase">SECURE LOCK-ON INTERCEPTED</span>
                              <span className="text-gray-600 font-sans text-[7px] mt-1">Select an active target node on the left list directory column to project dynamic satellite reconnaissance.</span>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  )}

                  {/* Operational Cognitive Bias assessment block (placed nicely at bottom of right column) */}
                  <div className="mt-2 text-left bg-black/45 p-2 rounded border border-[#124d12]/20 shrink-0">
                    <span className="text-[7.5px] text-green-500/75 font-black block uppercase border-b border-[#113a11]/40 pb-0.5 mb-1 tracking-wide">
                      CLASSIFIED COGNITIVE BIAS ASSESSMENT // PSYCH-EVAL DISPATCH
                    </span>
                    <p className="text-[8.5px]/relaxed text-[#8aa4ad] font-bold h-[35px] overflow-y-auto custom-scrollbar">
                      {getIntelAssessmentText()}
                    </p>
                  </div>

                </div>
              </div>

              {/* Bottom Real-Time Signals Telemetry Feed */}
              <div className="mt-3.5 border-t border-[#124d12]/30 pt-2 shrink-0">
                <div className="text-[#00ff44] mb-1 flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 bg-[#00ff44] rounded-full animate-ping shrink-0 shadow-[0_0_6px_rgba(0,255,100,0.8)]" />
                  <span>CRITICAL COALITION INTEL FEED & MILITARY MOVEMENTS</span>
                </div>
                <div className="space-y-1 max-h-[56px] overflow-y-auto custom-scrollbar pr-0.5">
                  {finalTelemetryLogs.length > 0 ? (
                    finalTelemetryLogs.map((log, logIdx) => (
                      <div key={logIdx} className="bg-black/55 p-1 border border-[#1a5c1a]/25 rounded-sm flex items-start gap-1.5 text-[8.5px]">
                        <span className="text-red-500 font-black tracking-widest uppercase shrink-0 bg-red-950/25 px-1 border border-red-950/50 rounded-sm text-[6.5px]">TRACE</span>
                        <span className="text-slate-300 font-bold flex-1 truncate" title={log}>{log}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic py-1.5 text-center bg-black/55 rounded border border-[#1a5c1a]/20 text-[7.5px]">No strategic signals logged within adjacent radar limits.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom 5 Symmetric Diplomatic / Strategic Actions Option bar */}
            <div className="border-t border-[#124d12] pt-3 mt-2.5 shrink-0 select-none">
              <div className="flex gap-2">
                {countryId === playerCountryId ? (
                  <div className="w-full bg-[#112a11]/45 border border-[#124d12] text-center py-2 text-[9px] font-black text-white tracking-[0.2em] uppercase rounded-sm shadow-[0_0_10px_rgba(0,255,68,0.1)] animate-pulse">
                    ★ PLAYER DEFENSE PROTOCOL INTERFACE NOMINAL — CABINET AUTHORITY INTEGRATION ABSOLUTE ★
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleDeclareWar}
                      className="flex-1 py-1.5 text-[8.5px] font-black tracking-widest border border-red-600 bg-red-950/30 text-red-400 hover:bg-red-800 hover:text-white transition-all duration-150 rounded-sm cursor-pointer uppercase font-sans"
                    >
                      DECLARE WAR
                    </button>
                    <button
                      onClick={handleImposeSanctions}
                      className="flex-1 py-1.5 text-[8.5px] font-black tracking-widest border border-orange-500 bg-orange-950/25 text-orange-400 hover:bg-orange-600 hover:text-white transition-all duration-150 rounded-sm cursor-pointer uppercase font-sans"
                    >
                      SANCTIONS
                    </button>
                    <button
                      onClick={handleCovertOp}
                      className="flex-1 py-1.5 text-[8.5px] font-black tracking-widest border border-yellow-500 bg-yellow-950/25 text-yellow-400 hover:bg-yellow-600 hover:text-white transition-all duration-150 rounded-sm cursor-pointer uppercase font-sans"
                    >
                      COVERT OP
                    </button>
                    <button
                      onClick={handleBribe}
                      className="flex-1 py-1.5 text-[8.5px] font-black tracking-widest border border-cyan-500 bg-cyan-950/25 text-cyan-400 hover:bg-cyan-600 hover:text-white transition-all duration-150 rounded-sm cursor-pointer uppercase font-sans"
                    >
                      BRIBE
                    </button>
                    <button
                      onClick={handleDiplomacy}
                      className="flex-1 py-1.5 text-[8.5px] font-black tracking-widest border border-green-500 bg-green-950/25 text-green-400 hover:bg-green-600 hover:text-white transition-all duration-150 rounded-sm cursor-pointer uppercase font-sans"
                    >
                      DIPLOMACY
                    </button>
                  </>
                )}
              </div>
              <p className="text-[7.5px] text-zinc-500/80 uppercase tracking-[0.2em] text-center mt-2.5 font-mono">
                SECURE DIAL COUPLER INT_C5 // SIGNAL TRAFFIC CAPTURED IN STATIONS.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================
          FULL-SCREEN ANALYTICAL LIGHT TABLE & RECONNAISSANCE VIEWER
         ======================================================== */}
      {lightboxOpen && (() => {
        const imageAssets = activeHotspot?.imageAssets || [];
        const activeImage = imageAssets[activeHeroImageIdx];
        if (!activeImage) return null;

        // Custom structural calculations to display on the light table
        const thermalRatingEst = Math.round(75 + (activeHotspot?.importance || 3) * 4);
        const structureDepthEst = Math.round(25 + (activeHotspot?.strategicValue || 50) * 1.5);
        const threatLevelEst = (activeHotspot?.strategicValue || 50) > 85 ? 'SEVERE HIGH RISK' : 'STABLE LOCK';

        return (
          <div 
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-lg animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Top Command Status strip */}
            <div className="absolute top-4 inset-x-6 flex justify-between items-center text-green-500 font-mono text-[9px] tracking-widest">
              <div className="flex items-center gap-2.5 bg-black/60 px-3 py-1.5 border border-[#1a5c1a]/40 rounded">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-ping shrink-0" />
                <span className="font-extrabold uppercase text-white tracking-[0.2em]">{activeHotspot?.classification || 'CLASSIFIED RECON TARGET'}</span>
              </div>
              <span className="text-zinc-500 uppercase font-bold bg-zinc-950/40 px-3 py-1 border border-zinc-900 rounded">[ KEYBOARD NAV: ARROWS TO CYCLE // ESC TO DISENGAGE ]</span>
              <button 
                onClick={() => { audio.sfxKeyClick(); setLightboxOpen(false); }}
                className="text-red-500 border border-red-800/80 hover:bg-red-950/20 py-1.5 px-4 text-[9.5px] font-black tracking-widest rounded-sm cursor-pointer hover:border-red-500"
              >
                DISENGAGE LIGHT TABLE [X]
              </button>
            </div>

            {/* Main Stage Panel */}
            <div className="relative max-w-5xl max-h-[85vh] w-full grid grid-cols-12 gap-5 items-center" onClick={(e) => e.stopPropagation()}>
              
              {/* Left sidebar: Asset details overlay (analytical print out metrics) */}
              <div className="col-span-3 bg-black/70 border border-[#1a5c1a]/50 p-4 rounded-md space-y-4 font-mono text-[9px] text-[#8aa4ad] shadow-lg">
                <div className="text-[#00ff44] text-[10px] font-bold tracking-widest border-b border-[#0d2a0d] pb-2 uppercase">
                  ✓ SENSOR LOCK REPORT
                </div>
                
                <div className="space-y-1">
                  <span className="text-[7.5px] block uppercase text-zinc-500">TARGET DESIGNATION</span>
                  <p className="text-white font-heavy text-[11px] uppercase truncate">{activeHotspot?.name}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[7.5px] block uppercase text-zinc-500">ESTIMATED THERMAL GLOW</span>
                  <p className="text-orange-400 font-black text-xs font-mono">{thermalRatingEst}°C IR SIGNATURE</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[7.5px] block uppercase text-zinc-500">ESTIMATED CAUV FOUNDATION</span>
                  <p className="text-cyan-400 font-black text-xs font-mono">-{structureDepthEst} METERS DEEP</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[7.5px] block uppercase text-zinc-500">SURVEILLANCE CONFIDENCE</span>
                  <p className="text-emerald-400 font-black text-xs font-mono">{activeHotspot?.confidenceScore || 95}% RATIO</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[7.5px] block uppercase text-zinc-500">VULNERABILITY RATIO</span>
                  <p className="text-red-400 font-black text-xs font-mono animate-pulse">{threatLevelEst}</p>
                </div>

                <div className="pt-2 border-t border-[#0d2a0d]/60">
                  <span className="text-[7.5px] text-zinc-500 block uppercase mb-1">LENS ANALYSIS FILTERS</span>
                  <div className="grid grid-cols-1 gap-1 pt-1 font-mono text-[7.5px]">
                    <button
                      onClick={() => { audio.sfxKeyClick(); setImageFilterMode('OPTICAL'); }}
                      className={`text-left px-2 py-1 border rounded-sm transition-all ${imageFilterMode === 'OPTICAL' ? 'bg-green-500 border-green-400 text-black font-black' : 'border-zinc-800 text-slate-400 hover:text-white'}`}
                    >
                      OPTICAL SPEC SATELLITE
                    </button>
                    <button
                      onClick={() => { audio.sfxKeyClick(); setImageFilterMode('THERMAL'); }}
                      className={`text-left px-2 py-1 border rounded-sm transition-all ${imageFilterMode === 'THERMAL' ? 'bg-orange-500 border-orange-400 text-black font-black' : 'border-zinc-800 text-slate-400 hover:text-white'}`}
                    >
                      THERMAL SPECTRUM SCANNER
                    </button>
                    <button
                      onClick={() => { audio.sfxKeyClick(); setImageFilterMode('EDGE'); }}
                      className={`text-left px-2 py-1 border rounded-sm transition-all ${imageFilterMode === 'EDGE' ? 'bg-cyan-400 border-cyan-300 text-black font-black' : 'border-zinc-800 text-slate-400 hover:text-white'}`}
                    >
                      GEOINT SYNTHETIC EDGE
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Image Stage (col-span-9) */}
              <div className="col-span-9 relative flex items-center justify-center">
                {/* Left navigation key */}
                {imageAssets.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.sfxKeyClick();
                      setActiveHeroImageIdx((prev) => (prev - 1 + imageAssets.length) % imageAssets.length);
                    }}
                    className="absolute left-[-20px] top-1/2 -translate-y-1/2 text-white hover:text-[#00ff44] bg-black/85 border border-zinc-800 hover:border-[#00ff44] w-12 h-12 rounded-full flex items-center justify-center text-lg font-mono transition-all duration-150 cursor-pointer z-50 shadow-md"
                  >
                    ◀
                  </button>
                )}

                {/* Imagery presentation wrapper */}
                <div className="relative border-4 border-[#124d12] rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.95)] max-w-full bg-black animate-[scaleIn_0.2s_ease-out]">
                  {/* Scope lens indicator rings overlays */}
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.45)_95%)] z-10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-[360px] h-[360px] border border-green-500/10 rounded-full z-10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-[200px] h-[200px] border border-dashed border-green-500/10 rounded-full z-10" />

                  <img
                    src={activeImage.src}
                    alt={activeImage.alt}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    className={`max-h-[75vh] object-contain max-w-full block transition-all duration-300
                      ${
                        imageFilterMode === 'THERMAL'
                          ? 'filter sepia brightness-110 saturate-[2.5] hue-rotate-[15deg] contrast-[1.8]'
                          : imageFilterMode === 'EDGE'
                          ? 'filter invert saturate-0 contrast-[300%] brightness-[1.3] mix-blend-color-dodge'
                          : 'brightness-95 contrast-[1.05]'
                      }
                    `}
                    style={imageFilterMode === 'EDGE' ? { filter: 'grayscale(100%) contrast(300%) brightness(1.2)' } : undefined}
                  />
                </div>

                {/* Right navigation key */}
                {imageAssets.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.sfxKeyClick();
                      setActiveHeroImageIdx((prev) => (prev + 1) % imageAssets.length);
                    }}
                    className="absolute right-[-20px] top-1/2 -translate-y-1/2 text-white hover:text-[#00ff44] bg-black/85 border border-zinc-800 hover:border-[#00ff44] w-12 h-12 rounded-full flex items-center justify-center text-lg font-mono transition-all duration-150 cursor-pointer z-50 shadow-md"
                  >
                    ▶
                  </button>
                )}
              </div>

            </div>

            {/* Subtitle, metadata and coordinate references */}
            <div className="mt-5 text-center max-w-2xl font-sans" onClick={(e) => e.stopPropagation()}>
              <p className="text-xl font-extrabold tracking-normal text-amber-500 leading-snug">{activeImage.alt}</p>
              <p className="text-xs text-gray-300 mt-1.5 leading-relaxed max-w-xl mx-auto">{activeImage.caption || 'Geographic recon surveillance archive asset.'}</p>
              
              <div className="mt-4 flex gap-2 justify-center select-all">
                <span className="text-[9.5px] font-mono tracking-widest text-[#00ff44] uppercase bg-black/60 py-1.5 px-4 border border-green-950 rounded-sm">
                  LAT LOCK: {activeHotspot?.lat.toFixed(6)}°N // LON LOCK: {activeHotspot?.lon.toFixed(6)}°E
                </span>
                <span className="text-[9.5px] font-mono tracking-widest text-cyan-400 uppercase bg-black/60 py-1.5 px-4 border border-cyan-950/30 rounded-sm">
                  STRUCTURE REF: {activeHotspot?.id.toUpperCase()} // SCAN MODE: {imageFilterMode}
                </span>
              </div>
            </div>

          </div>
        );
      })()}

    </div>
  );
};

export default DossierCard;
