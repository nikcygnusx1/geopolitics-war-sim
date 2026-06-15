import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, 
  Flame, 
  Skull, 
  TrendingDown, 
  RotateCcw, 
  History, 
  Map, 
  ShieldAlert, 
  Binary, 
  FileCheck,
  Award,
  Globe,
  Coins,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Heart,
  Search,
  BookOpen,
  Terminal,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Cpu
} from 'lucide-react';
import { WorldState, PlayerState } from '../../types';
import { StatBlock } from './StatBlock';
import { ShareCard } from './ShareCard';
import { TacticalRadarMap } from './TacticalRadarMap';
import { ClassifiedEvidenceDesk } from './ClassifiedEvidenceDesk';
import { generateLegacyNarrative } from '../../utils/legacyGenerator';
import { deriveDebriefAnalysis, TurningPoint } from '../../utils/debriefDataDeriver';
import { audio } from '../../utils/audio';

interface PostGameDebriefProps {
  id: string;
  worldState: WorldState;
  playerState: PlayerState & {
    rollbackToCheckpoint: () => void;
  };
  onSpectate: () => void;
  onRestart: () => void;
}

// Interactive RedactedText component to add tactile espionage feel
const RedactedText: React.FC<{ text: string }> = ({ text }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  return (
    <span
      onClick={() => setIsRevealed(!isRevealed)}
      className={`inline-block cursor-pointer px-1.5 py-0.5 rounded-[1px] font-mono text-[11px] transition-all duration-300 font-bold select-none ${
        isRevealed
          ? 'bg-rose-950/30 text-rose-400 border border-rose-500/30'
          : 'bg-slate-900 hover:bg-slate-800 text-transparent border border-slate-950 shadow-inner'
      }`}
      title={isRevealed ? 'Intel declassified. Click to redact.' : 'CLASSIFIED INTEL - Click to decrypt'}
    >
      {isRevealed ? text : '░░ RECON ░░'}
    </span>
  );
};

// Vintage ink stamp styling
const GeopoliticalStamp: React.FC<{ label: string; subLabel?: string; color: string }> = ({ label, subLabel, color }) => (
  <motion.div
    initial={{ scale: 1.8, opacity: 0, rotate: 18 }}
    animate={{ scale: 1, opacity: 0.75, rotate: -12 }}
    transition={{ type: 'spring', damping: 12, delay: 0.6 }}
    className="absolute right-6 top-6 xl:right-12 xl:top-10 flex flex-col items-center justify-center border-4 border-double px-4 py-1.5 rounded uppercase font-mono font-black select-none pointer-events-none tracking-widest z-20"
    style={{ borderColor: color, color: color, textShadow: `0 0 4px ${color}33` }}
  >
    <span className="text-sm md:text-base leading-none tracking-widest">{label}</span>
    {subLabel && <span className="text-[8px] tracking-wide mt-0.5">{subLabel}</span>}
  </motion.div>
);

export const PostGameDebrief: React.FC<PostGameDebriefProps> = ({
  id,
  worldState,
  playerState,
  onSpectate,
  onRestart,
}) => {
  const [activeTab, setActiveTab] = useState<'verdict' | 'reconstruction' | 'drilldown' | 'legacy'>('verdict');
  const [splashActive, setSplashActive] = useState(true);
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [decryptionLog, setDecryptionLog] = useState<string[]>([]);
  const [expandedTurningPoint, setExpandedTurningPoint] = useState<number | null>(null);

  const playerCountry = worldState.countries[playerState.countryId];
  const playerCountryName = playerCountry?.name || 'Sovereign Command';
  const flagEmoji = playerCountry?.flagEmoji || '🌐';

  // Calculate stats directly for consistency
  const stats = useMemo(() => {
    const warDyads = new Set<string>();
    Object.entries(worldState.countries).forEach(([cId, countryItem]) => {
      const c = countryItem as any;
      if (c && c.atWarWith) {
        (c.atWarWith as string[]).forEach((oppId) => {
          const key = cId < oppId ? `${cId}-${oppId}` : `${oppId}-${cId}`;
          warDyads.add(key);
        });
      }
    });

    const totalWars = warDyads.size;
    const impactedStrikes = worldState.activeStrikes.filter((s) => s.status === 'IMPACT');

    const totalCasualties = impactedStrikes.reduce(
      (sum, s) => sum + (s.damageDealt?.casualtiesEstimate || 0),
      0
    );

    const totalGdpDestroyed = impactedStrikes.reduce(
      (sum, s) => sum + (s.damageDealt?.gdpLoss || 0),
      0
    );

    const nukesDetonated = impactedStrikes.filter(
      (s) =>
        s.weaponType === 'ICBM' ||
        s.weaponType === 'SLBM' ||
        (s.warheadYieldMT !== undefined && s.warheadYieldMT > 0)
    ).length;

    return {
      totalWars,
      totalCasualties,
      totalGdpDestroyed,
      nukesDetonated,
    };
  }, [worldState.countries, worldState.activeStrikes]);

  // Perform deep analytical derivations
  const analysis = useMemo(() => {
    return deriveDebriefAnalysis(worldState, playerState);
  }, [worldState, playerState]);

  // Generate the declassification legacy report
  const legacyNarrative = useMemo(() => {
    return generateLegacyNarrative(worldState, playerState);
  }, [worldState, playerState]);

  const outcomeType = playerState.aftermathType || 'NONE';
  const isVictory = outcomeType === 'VICTORY';
  const outcomeReason = isVictory 
    ? (playerState.victoryReason || playerState.aftermathReason || 'Sovereign command decisions achieved victory')
    : (playerState.gameOverReason || playerState.aftermathReason || 'Sovereign command has collapsed');

  // Encryption Loading Sequence
  useEffect(() => {
    if (!splashActive) return;

    const logStatements = [
      '⚡ CONNECTING SECURITY SOCKET TO SOVEREIGN NETWORDS...',
      '🛰️ RETRIEVING MILITARY TELEMETRY SATELLITE FEED...',
      '🔍 ANALYZING SENSITIVE HISTORICAL COMBAT DYADS...',
      '📋 DECIPHERING CLASSIFIED ADVERSARY OPERATION STRATEGIES...',
      '🗄️ PARSING EXECUTIVE LEADERSHIP DOCTRINE ARTIFACTS...',
      '🛡️ ESTABLISHING VERDICT INTEGRITY DECRYPTION... KEY ACCEPTED.'
    ];

    let currentProgress = 0;
    let logIndex = 0;

    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 4;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressInterval);
        setTimeout(() => {
          setSplashActive(false);
          audio.resume();
          audio.playIntelPing('generic');
        }, 400);
      }
      setDecryptionProgress(currentProgress);

      // Trigger log lines progressively
      const targetLogIndex = Math.floor((currentProgress / 100) * logStatements.length);
      if (targetLogIndex > logIndex && logIndex < logStatements.length) {
        setDecryptionLog(prev => [...prev, logStatements[logIndex]]);
        logIndex++;
      }
    }, 80);

    return () => {
      clearInterval(progressInterval);
    };
  }, [splashActive]);

  const toggleSkipSplash = () => {
    setSplashActive(false);
  };

  return (
    <div id={id}>
      <AnimatePresence mode="wait">
        
        {/* 1. CINEMATIC CRYPTOGRAPHIC DECRYPTION OVERLAY */}
        {splashActive ? (
          <motion.div
            key="debrief-splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 100%)' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[210] flex flex-col items-center justify-center bg-slate-950 text-emerald-400 p-6 overflow-hidden select-none"
          >
            {/* Ambient radar sweep background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.05] pointer-events-none" />
            <div className="absolute inset-x-0 h-[1.5px] bg-emerald-500/10 top-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse" />
            
            {/* Glitch lines / CRT tube effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px] opacity-40 pointer-events-none" />

            <div className="w-full max-w-xl flex flex-col space-y-6 bg-slate-950/85 p-8 border border-emerald-500/20 rounded-[2px] shadow-2xl relative z-10 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-emerald-500/25 pb-4 font-mono">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-xs uppercase tracking-widest font-black">HIGHLY SECURE EMBARGO DISPATCH</span>
                </div>
                <span className="text-[10px] text-slate-500">LEVEL-5 CLASSIFIED</span>
              </div>

              {/* Cryptographic spinning decryption visual */}
              <div className="flex items-center gap-5 my-2">
                <div className="relative flex items-center justify-center w-14 h-14 shrink-0 border border-emerald-500/30 rounded-full">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                    className="absolute inset-[3px] border-t-2 border-emerald-500 rounded-full"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                    className="absolute inset-[8px] border-b-2 border-cyan-400 rounded-full opacity-60"
                  />
                  <Lock className="w-5.5 h-5.5 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] text-slate-500 tracking-wider">DOCTRINE ARCHIVE DECIPHER ENGINE</span>
                  <span className="text-xl font-bold font-mono text-white tracking-widest uppercase">
                    Unlocking Dossier {decryptionProgress}%
                  </span>
                </div>
              </div>

              {/* Real-time flickering decryption logs */}
              <div className="h-32 bg-slate-950/90 border border-slate-900 rounded p-3 font-mono text-[9.5px] text-emerald-500/80 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-emerald-950">
                <div className="text-cyan-400 font-bold">&#62; INITIALIZING DECRYPT BUFFER SECURELY...</div>
                {decryptionLog.map((log, lIdx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={lIdx}
                    className="flex items-center gap-1.5"
                  >
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{log}</span>
                  </motion.div>
                ))}
              </div>

              {/* Encryption Progress bar */}
              <div className="w-full bg-slate-900 border border-slate-800 h-2.5 rounded-[1px] overflow-hidden">
                <motion.div
                  className="bg-emerald-500 h-full shadow-[0_0_8px_rgb(16,185,129)]"
                  style={{ width: `${decryptionProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between font-mono text-[9px] text-slate-500">
                <span>SYSTEM DISPATCH CODE: SOV-99.2A</span>
                <button
                  onClick={toggleSkipSplash}
                  className="text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2 transition-colors uppercase font-bold cursor-pointer"
                >
                  [ Bypass Security Buffer ]
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          
          /* 2. CHOREOGRAPHED CLASSIFIED POST-GAME DOSSIER SHELL */
          <motion.div
            key="debrief-dossier"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/98 backdrop-blur-md overflow-y-auto px-4 py-6 select-none"
          >
            {/* Scanner line scanning visual accent */}
            <div className="absolute inset-[15%] w-[70%] h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent top-12 pointer-events-none select-none translate-y-[-100px] animate-[bounce_12s_infinite_ease-in-out]" />

            <div className="w-full max-w-7xl mx-auto flex flex-col min-h-[90vh] bg-slate-950/90 p-4 md:p-8 border border-slate-900 rounded-[3px] shadow-2xl relative overflow-hidden">
              
              {/* Dossier absolute visual watermark background decoration */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

              {/* OUTCOME DRY INK STAMP ACCENT */}
              {isVictory ? (
                <GeopoliticalStamp label="APPROVED ALPHA-1" subLabel="Sovereign Integrity Safeguarded" color="#10b981" />
              ) : (
                <GeopoliticalStamp label="RESCINDED DIRECTIVE" subLabel="Central Matrix Collapse" color="#ef4444" />
              )}

              {/* FLOATING DECORATIVE CLASSIFICATION LABELS (MARGINALIA) */}
              <div className="absolute left-3 top-1/3 -rotate-90 origin-left hidden xl:flex items-center gap-2 font-mono text-[7px] text-slate-700 uppercase tracking-[0.25em] pointer-events-none select-none">
                <span>SECURITY CLEARANCE: LEVEL-5 ALPHA</span>
                <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                <span>INDEX CARD: DEC-4.4</span>
              </div>

              <div className="absolute right-3 bottom-1/4 rotate-90 origin-right hidden xl:flex items-center gap-2 font-mono text-[7px] text-slate-700 uppercase tracking-[0.25em] pointer-events-none select-none">
                <span>SYSTEM ENCRYPTION CODE: SOV-RECON-77</span>
                <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                <span>PRINT RECON RECEPTACLE</span>
              </div>

              {/* TOP COMMAND PANEL HEADER */}
              <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-900 pb-5 mb-6 shrink-0 relative z-10 gap-4">
                <div className="flex flex-col">
                  {/* Metadata strip */}
                  <div className="flex flex-wrap items-center gap-3 text-[9px] font-mono tracking-widest text-[#00ff44] uppercase">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#00ff44] rounded-full animate-ping" />
                      SECURE FEED LIVE
                    </span>
                    <span className="text-slate-700">|</span>
                    <span className="text-slate-400">SESSION ID: <strong className="text-white">{playerState.countryId}-DEBRIEF-V4.4</strong></span>
                    <span className="text-slate-700">|</span>
                    <span className="text-slate-400">SYSTEM: DECLASSIFIED INTEL</span>
                  </div>
                  
                  <h1 className="text-xl md:text-3xl font-black font-mono tracking-tight text-white mt-2 uppercase flex items-center gap-3">
                    <Terminal className="w-6 h-6 text-cyan-400" />
                    <span>Post-War Strategic Chronicle</span>
                  </h1>
                </div>

                {/* Administrative Controls */}
                <div className="flex flex-wrap gap-2.5 font-mono text-[10px] uppercase tracking-wider relative z-20">
                  {playerState.checkpointState && (
                    <button
                      id="debrief-action-rollback"
                      onClick={playerState.rollbackToCheckpoint}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 border border-amber-500/40 bg-amber-950/15 hover:bg-amber-950/45 text-amber-400 hover:text-amber-200 transition-all rounded-[1.5px] cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rollback checkpoint</span>
                    </button>
                  )}
                  
                  <button
                    id="debrief-action-spectate"
                    onClick={onSpectate}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-800 bg-slate-900/20 hover:bg-slate-900/60 text-slate-400 hover:text-slate-100 transition-all rounded-[1.5px] cursor-pointer"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Spectate aftermath</span>
                  </button>

                  <button
                    id="debrief-action-restart"
                    onClick={onRestart}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 border border-cyan-500/40 bg-cyan-950/10 hover:bg-cyan-950/35 text-cyan-400 hover:text-cyan-100 transition-all rounded-[1.5px] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Restart Active Matrix</span>
                  </button>
                </div>
              </header>

              {/* NARRATIVE ARC TABS NAVIGATION */}
              <nav className="flex border-b border-slate-900/80 mb-6 shrink-0 relative z-10 overflow-x-auto scrollbar-none font-mono text-[10px] tracking-widest gap-2">
                {[
                  { key: 'verdict', icon: <Award className="w-3.5 h-3.5" />, label: 'I. THE VERDICT' },
                  { key: 'reconstruction', icon: <History className="w-3.5 h-3.5" />, label: 'II. THE RECONSTRUCTION' },
                  { key: 'drilldown', icon: <Binary className="w-3.5 h-3.5" />, label: 'III. THE DRILLDOWN' },
                  { key: 'legacy', icon: <FileCheck className="w-3.5 h-3.5" />, label: 'IV. THE LEGACY' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      audio.resume();
                      audio.sfxKeyClick();
                      setActiveTab(tab.key as any);
                    }}
                    className={`px-4 py-3 uppercase font-bold border-t-2 border-b-2 transition-all flex items-center gap-2 pr-6 cursor-pointer ${
                      activeTab === tab.key
                        ? 'border-t-cyan-500 border-b-transparent bg-slate-900/30 text-cyan-400 font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-350 hover:bg-slate-900/10'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* TABS VIEWPORT SUB-DYNAMIC SEGMENT */}
              <div className="flex-1 min-h-[460px] relative z-10 overflow-y-auto pr-1">
                <AnimatePresence mode="wait">
                  
                   {/* TAB I: THE VERDICT (EXECUTIVE SUMMARY & IMPRESSIVE GEOPOLITICAL WORKSTATION DESK) */}
                   {activeTab === 'verdict' && (
                     <motion.div
                       key="verdict"
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 10 }}
                       transition={{ duration: 0.35, ease: 'easeInOut' }}
                       className="space-y-8"
                     >
                       {/* Row 1: Workspace Grid Desk */}
                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                         
                         {/* Left Column (Span 6): Executive Reports */}
                         <div className="lg:col-span-6 space-y-5">
                           
                           {/* Primary Outcome Block with threat color banners */}
                           <div 
                             className="p-5 border-l-4 rounded-[1.5px] relative overflow-hidden shadow-lg backdrop-blur-sm"
                             style={{
                               borderLeftColor: isVictory ? '#10b981' : '#f43f5e',
                               borderColor: '#1e293b',
                               borderWidth: '1px',
                               borderLeftWidth: '4px',
                               background: isVictory ? 'rgba(16, 185, 129, 0.015)' : 'rgba(244, 63, 94, 0.015)'
                             }}
                           >
                             <div className="absolute right-3 top-3 flex items-center gap-1 opacity-[0.12] pointer-events-none font-mono text-[45px] font-black">
                               {isVictory ? 'WIN' : 'FAIL'}
                             </div>

                             <div className="flex items-center gap-2">
                               <ShieldAlert className={`w-5 h-5 ${isVictory ? 'text-[#10b981]' : 'text-[#f43f5e]'}`} />
                               <span className="font-mono text-[9px] tracking-widest font-black uppercase text-slate-400">
                                 Operational Campaign Resolution Statement
                               </span>
                             </div>
                             <p className="text-sm text-slate-100 font-mono mt-3 font-semibold leading-relaxed tracking-tight">
                               GLOBAL GEOPOLITICAL STANDING: {isVictory ? 'PRODUCES STABLE HEGEMONY' : 'SUSTAINED SYSTEM FAILURE'}
                             </p>
                             <p className="text-xs text-slate-350 font-sans mt-2 leading-relaxed antialiased pl-4 border-l border-slate-850">
                               <strong>Command Verdict:</strong> {outcomeReason}
                             </p>
                             
                             <div className="mt-4 flex flex-wrap items-center gap-2">
                               <span className="text-[9px] font-mono uppercase bg-slate-900 border border-slate-850 text-slate-450 px-2 py-0.5 rounded leading-none font-bold">
                                 Clearance Alpha-1
                               </span>
                               <span className="text-slate-700 font-mono text-[11px]">•</span>
                               <span className="text-[10px] font-mono text-[#64748b] italic">
                                 Interlocutors resolved to security sector {playerState.countryId}
                               </span>
                             </div>
                           </div>

                           {/* Interactive Deciphered Diagnosis Box */}
                           <div className="p-5 bg-slate-950 border border-slate-900 rounded-[2px] shadow-md relative">
                             <div className="flex items-center justify-between mb-3.5">
                               <div className="flex items-center gap-2">
                                 <Search className="w-4 h-4 text-cyan-400" />
                                 <span className="font-mono text-[9px] uppercase tracking-widest text-[#00e1ff] font-bold">Session Diagnosis • Core Catalyst</span>
                               </div>
                               <span className="font-mono text-[8.5px] bg-[#00e1ff]/10 text-[#00e1ff] border border-[#00e1ff]/20 px-2 py-0.5 rounded-[1px] font-black leading-none uppercase">
                                 SECURE INTELLIGENCE
                               </span>
                             </div>
                             
                             <p className="font-sans text-[12.5px] text-slate-300 leading-relaxed text-justify antialiased">
                               Our diplomatic cables indicate that <RedactedText text="nuclear deterrent indexes" /> were compromised during key timeline transitions. {analysis.sessionDiagnosis} Geopolitical simulations have categorized this outcome as a unique consequence of sovereign choices made by <strong className="text-yellow-400 font-medium">{playerCountryName}</strong>.
                             </p>

                             <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[8px] text-[#475569] border-t border-slate-900/60 pt-3.5 uppercase">
                               <span>Sovereign ID: <span className="text-slate-400 font-extrabold">{playerState.countryId}</span></span>
                               <span>•</span>
                               <span>Nominal Cabinet: <span className="text-slate-200 font-extrabold">{playerCountryName} {flagEmoji}</span></span>
                               <span>•</span>
                               <span>Decision Duration: <span className="text-slate-200 font-extrabold">{worldState.currentTick} Ticks</span></span>
                             </div>
                           </div>

                           {/* Brief Cabinets Specifications layout */}
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                             {[
                               { label: 'Popular Approval Rating', value: playerCountry?.political?.leaderApprovalRating ? `${Math.round(playerCountry.political.leaderApprovalRating)}%` : '50%', color: 'text-slate-300' },
                               { label: 'Sovereign Treasury Cash', value: playerCountry?.economic?.treasuryCashB ? `$${Math.round(playerCountry.economic.treasuryCashB)}B` : '$950B', color: 'text-slate-300' },
                               { label: 'Unrest Index Rating', value: playerCountry?.political?.popularUnrest ? `${Math.round(playerCountry.political.popularUnrest)}%` : '15%', color: 'text-slate-300' },
                               { label: 'Coup Risk Factor', value: playerCountry?.political?.popularUnrest && playerCountry.political.popularUnrest > 70 ? 'CRITICAL' : 'STABLE', color: playerCountry?.political?.popularUnrest && playerCountry.political.popularUnrest > 70 ? 'text-rose-400 font-black' : 'text-emerald-400 font-bold' }
                             ].map((stat, sIdx) => (
                               <div key={sIdx} className="p-3.5 bg-slate-950 border border-slate-900 rounded-[1.5px] font-mono text-center shadow-inner hover:border-slate-800 transition-colors">
                                 <span className="text-[8px] text-slate-500 block uppercase leading-tight font-black tracking-wider">{stat.label}</span>
                                 <span className={`text-sm font-black block mt-2 ${stat.color}`}>
                                   {stat.value}
                                 </span>
                               </div>
                             ))}
                           </div>
                         </div>

                         {/* Right Column (Span 6): Active Radar & Audited Metrics */}
                         <div className="lg:col-span-6 space-y-5">
                           
                           {/* LIVE TACTICAL TARGET RADAR */}
                           <TacticalRadarMap 
                             worldState={worldState} 
                             playerCountryId={playerState.countryId} 
                           />

                           {/* Compact Grid of stats */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
                             <StatBlock
                               id="debrief-stat-wars"
                               label="Active Geopolitical Theaters"
                               value={stats.totalWars}
                               icon={<Swords className="w-4 h-4" />}
                             />
                             <StatBlock
                               id="debrief-stat-gdp"
                               label="Estimated Aggregate Economic Loss"
                               value={stats.totalGdpDestroyed}
                               format="currency"
                               icon={<TrendingDown className="w-4 h-4" />}
                             />
                             <StatBlock
                               id="debrief-stat-casualties"
                               label="Documented Human Casualties"
                               value={stats.totalCasualties}
                               icon={<Skull className="w-4.5 h-4.5" />}
                             />
                             <StatBlock
                               id="debrief-stat-nukes"
                               label="Thermonuclear Missile Detonations"
                               value={stats.nukesDetonated}
                               icon={<Flame className="w-4 h-4" />}
                             />
                           </div>

                         </div>
                       </div>

                       {/* Row 2: Classified Photographic & Satellite Recon Logs */}
                       <ClassifiedEvidenceDesk
                         worldState={worldState}
                         stats={stats}
                         playerCountryName={playerCountryName}
                         isVictory={isVictory}
                       />

                     </motion.div>
                   )}

                  {/* TAB II: THE RECONSTRUCTION (PHASES FEED & THE HIGH-IMPACT TIMELINE) */}
                  {activeTab === 'reconstruction' && (
                    <motion.div
                      key="reconstruction"
                      initial={{ opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.99 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                    >
                      {/* Left Side: Custom Segmented Phases of Play */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center gap-1.5 mb-1 bg-slate-950 p-2.5 border border-slate-900 rounded">
                          <BookOpen className="w-4 h-4 text-cyan-400" />
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[#00ffd5] font-black">
                            Segmented Intelligence Chronologies
                          </span>
                        </div>

                        <div className="space-y-3.5">
                          {[
                            { key: 'opening', data: analysis.phases.opening, index: 1, duration: 'Weeks 1–3' },
                            { key: 'escalation', data: analysis.phases.escalation, index: 2, duration: 'Weeks 4–7' },
                            { key: 'climax', data: analysis.phases.climax, index: 3, duration: 'Weeks 8–11' },
                            { key: 'resolution', data: analysis.phases.resolution, index: 4, duration: 'Weeks 12+' }
                          ].map(({ key, data, index, duration }) => (
                            <div 
                              key={key}
                              id={`phase-segment-card-${index}`}
                              className="p-4 bg-slate-950 border border-slate-900 rounded-[2px] relative overflow-hidden group hover:border-[#00e1ff]/30 hover:bg-[#070b13]/60 transition-all duration-300 shadow"
                            >
                              <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-slate-900 group-hover:bg-[#00ffd5]/60 transition-colors" />
                              <div className="flex items-center justify-between font-mono text-[10px]">
                                <span className="text-white font-extrabold tracking-tight">ACT {index}: {data.name}</span>
                                <span className="text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded text-[8.5px]">
                                  {duration}
                                </span>
                              </div>
                              <p className="font-sans text-[11px] text-slate-400 mt-2.5 leading-relaxed italic pr-2">
                                "{data.description}"
                              </p>
                              <div className="mt-3 flex items-center justify-between border-t border-slate-900/60 pt-2 font-mono text-[8px] text-slate-500">
                                <span>STATUS CODE: DECLASSIFIED CLASSIFCATION</span>
                                <span className="font-bold text-slate-400">{data.count} CHRONICLE RECORDS REPORTED</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Side: Deep-Dive Critical Turning Points Timeline */}
                      <div className="lg:col-span-7 space-y-4 bg-slate-950/40 p-1 rounded">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-black block mb-1 px-2.5">
                          Deciphered Historical Turning Points
                        </span>

                        {analysis.turningPoints.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 bg-slate-950/45 border border-dashed border-slate-900 p-6 rounded text-slate-500">
                            <AlertTriangle className="w-8 h-8 opacity-30 mb-2.5 text-yellow-500" />
                            <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-slate-500">No Key Signals Intercepted</span>
                            <p className="text-[11px] font-sans mt-2 text-slate-650 text-center">Geopolitical milestones didn't trigger severe escalatory warnings in this campaign run.</p>
                          </div>
                        ) : (
                          <div className="relative pl-5 border-l border-slate-900 space-y-5">
                            {/* Dynamic timeline connector vector glow */}
                            <div className="absolute top-2 bottom-2 left-0 -ml-[0.5px] w-[1px] bg-gradient-to-b from-cyan-500/20 via-slate-800/10 to-transparent pointer-events-none" />

                            {analysis.turningPoints.map((tp, idx) => {
                              let badgeColor = 'text-[#38bdf8] border-[#38bdf8]/35 bg-[#38bdf8]/5';
                              let accentColor = '#38bdf8';
                              if (tp.type === 'NUCLEAR') {
                                badgeColor = 'text-[#ef4444] border-[#ef4444]/35 bg-[#ef4444]/5';
                                accentColor = '#ef4444';
                              } else if (tp.type === 'WAR') {
                                badgeColor = 'text-[#f43f5e] border-[#f43f5e]/35 bg-[#f43f5e]/5';
                                accentColor = '#f43f5e';
                              } else if (tp.type === 'DOMESTIC_CRISIS') {
                                badgeColor = 'text-[#f59e0b] border-[#f59e0b]/35 bg-[#f59e0b]/5';
                                accentColor = '#f59e0b';
                              } else if (tp.type === 'ALLIANCE') {
                                badgeColor = 'text-[#10b981] border-[#10b981]/35 bg-[#10b981]/5';
                                accentColor = '#10b981';
                              }

                              const isExpanded = expandedTurningPoint === idx;

                              return (
                                <motion.div 
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                                  key={idx}
                                  id={`turning-point-milestone-${idx}`}
                                  className="relative group transition-all duration-300 bg-slate-950 border border-slate-900 p-4 rounded-[1.5px] hover:border-slate-800 shadow cursor-pointer"
                                  onClick={() => setExpandedTurningPoint(isExpanded ? null : idx)}
                                >
                                  {/* Custom physical target center indicator */}
                                  <div className="absolute -left-[26.5px] top-4.5 flex items-center justify-center w-[13px] h-[13px] rounded-full bg-slate-950 border border-slate-800 z-10">
                                    <div className="w-[5px] h-[5px] rounded-full group-hover:scale-150 transition-transform" style={{ backgroundColor: accentColor }} />
                                  </div>

                                  <div className="flex items-center justify-between font-mono text-[9px] uppercase">
                                    <div className="flex items-center gap-2 font-black">
                                      <span className="text-cyan-400">TICK {tp.tick}</span>
                                      <span className="text-slate-700">•</span>
                                      <span className={`px-2 py-0.5 text-[8px] tracking-widest rounded-[1.5px] border ${badgeColor}`}>
                                        {tp.type}
                                      </span>
                                    </div>
                                    <span className="text-slate-500 font-extrabold">IMPACT THRESHOLD: {tp.importance}/10</span>
                                  </div>

                                  <h3 className="font-sans font-bold text-xs text-white mt-2 flex items-center justify-between">
                                    <span>{tp.title}</span>
                                    <span className="text-[9px] font-mono text-slate-500 hover:text-slate-350">
                                      {isExpanded ? '[ COLLAPSE ]' : '[ DECLASSIFY ANALYST NOTE ]'}
                                    </span>
                                  </h3>
                                  
                                  <p className="font-sans text-[11px] text-slate-400 mt-1.5 pl-2.5 border-l border-slate-800 leading-relaxed text-justify antialiased">
                                    "{tp.description}"
                                  </p>

                                  {/* Interactive Custom Threat status bar */}
                                  <div className="mt-3.5 flex items-center gap-1.5">
                                    <span className="font-mono text-[7px] text-slate-600 uppercase">TIPPING THREAT INDEX:</span>
                                    <div className="flex-1 bg-slate-950 outline outline-[1px] outline-slate-900 h-1 rounded-[1px] overflow-hidden flex">
                                      {Array.from({ length: 10 }).map((_, stepIdx) => (
                                        <div 
                                          key={stepIdx} 
                                          className="flex-1 h-full border-r border-slate-950" 
                                          style={{ 
                                            backgroundColor: stepIdx < tp.importance ? accentColor : '#0f172a',
                                            opacity: stepIdx < tp.importance ? 0.8 : 0.2
                                          }} 
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  {/* EXPANDABLE NARRATIVE ACCENT DETAILS */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-3.5 pt-3.5 border-t border-slate-900/60 font-sans text-[11px] text-slate-200 leading-relaxed bg-[#050912]/80 px-3.5 py-3 rounded-[2px] border-l border-cyan-500/50"
                                      >
                                        <div className="font-mono text-[8.5px] uppercase tracking-wide text-cyan-400 mb-1 font-black flex items-center justify-between">
                                          <span>CONFIDENTIAL INTELLIGENCE ADVISORY INSIGHT:</span>
                                          <span className="text-[7.5px] text-emerald-500 bg-emerald-950/30 border border-emerald-500/20 px-1 py-0.5 rounded">DECLASSIFIED RECON</span>
                                        </div>
                                        <p className="italic">
                                          "{tp.whyItMatters} Systems simulated indicate regional alliances shifted by approximately <span className="text-yellow-400">45% friction gravity coef</span> following this chronological threshold."
                                        </p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB III: THE DRILLDOWN (HOSTILE AI REVEAL & SYSTEMIC THEATRE ANALYTICS) */}
                  {activeTab === 'drilldown' && (
                    <motion.div
                      key="drilldown"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25 }}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                    >
                      {/* Left Side: Custom Declassified Confidential Adversary intelligence briefs */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center gap-1.5 mb-1 bg-slate-950 p-2.5 border border-slate-900 rounded-[2px]">
                          <Binary className="w-4 h-4 text-rose-500/90" />
                          <span className="font-mono text-[9px] uppercase tracking-widest text-rose-400 font-extrabold">
                            Declassified AI Covert Operatives dossiers
                          </span>
                        </div>

                        {analysis.aiCampaigns.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 bg-slate-950/45 border border-dashed border-slate-900 p-6 rounded text-slate-500">
                            <Binary className="w-8 h-8 opacity-25 mb-2 animate-bounce" />
                            <span className="font-mono text-[9.5px] uppercase tracking-wider font-extrabold text-slate-500">Signals Encrypted Securely</span>
                            <p className="text-[11px] font-sans mt-2 text-slate-650 text-center">No deep cyber subversions or sovereign communications intercepts recovered.</p>
                          </div>
                        ) : (
                          <div className="space-y-4 relative">
                            {analysis.aiCampaigns.map((camp, idx) => (
                              <div 
                                key={idx}
                                id={`ai-campaign-dossier-${idx}`}
                                className="bg-slate-950 border border-slate-900 rounded-[2px] p-4 transition-all hover:bg-[#070b13]/85 hover:border-slate-800 shadow relative"
                              >
                                <div className="absolute right-4 bottom-4 pointer-events-none opacity-[0.03]">
                                  <Fingerprint className="w-16 h-16 text-cyan-400 animate-pulse" />
                                </div>

                                <div className="flex items-start justify-between">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2 font-mono text-[9.5px] tracking-wide">
                                      <span className="text-rose-500 font-extrabold uppercase">
                                        [ DOSSIER REF: S-{1020 + idx} ]
                                      </span>
                                      <span className="text-slate-700">•</span>
                                      <span className="text-white font-extrabold uppercase">{camp.operatorName} {camp.flag}</span>
                                      <span className="text-slate-700">→</span>
                                      <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 py-0.5 rounded font-black shrink-0">
                                        {camp.focusType}
                                      </span>
                                    </div>
                                    <h4 className="font-mono font-black tracking-widest text-[#00e1ff] text-[13px] uppercase mt-2 select-text">
                                      {camp.codename}
                                    </h4>
                                  </div>

                                  <div className="font-mono text-[8px] text-right uppercase text-slate-500">
                                    <span>LAUNCH PERIOD: WEEK {camp.tickFirstActive}</span>
                                    <span className="block mt-1 text-[#00ff44] font-bold">[ DECLASSIFIED ]</span>
                                  </div>
                                </div>

                                {/* Tactical cable detail box */}
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-900/60 font-sans text-[11px] leading-relaxed">
                                  <div>
                                    <strong className="font-mono text-[8px] uppercase text-slate-500 block mb-1">Estimated Cabal Intent:</strong>
                                    <span className="text-slate-350 italic">"{camp.intent}"</span>
                                  </div>
                                  <div>
                                    <strong className="font-mono text-[8px] uppercase text-slate-500 block mb-1">Global System Impact:</strong>
                                    <span className="text-slate-350 italic">"{camp.consequence}"</span>
                                  </div>
                                </div>

                                {/* Confidence of telemetry meters */}
                                <div className="mt-4 grid grid-cols-2 gap-5 font-mono text-[8.5px] text-slate-500">
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span>CYBER-INT RECON LEVEL:</span>
                                      <span className="text-rose-400 font-extrabold">{camp.secrecyScore}% Security</span>
                                    </div>
                                    <div className="w-full bg-slate-900 h-1 shadow-inner rounded-[1px] overflow-hidden">
                                      <div className="bg-rose-500 h-full" style={{ width: `${camp.secrecyScore}%` }} />
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span>OPERATIONAL DESTRUCTION RATE:</span>
                                      <span className="text-yellow-400 font-extrabold">{camp.impactScore}% Severity</span>
                                    </div>
                                    <div className="w-full bg-slate-900 h-1 shadow-inner rounded-[1px] overflow-hidden">
                                      <div className="bg-yellow-400 h-full" style={{ width: `${camp.impactScore}%` }} />
                                    </div>
                                  </div>
                                </div>

                                {/* Deep-log intercept wire report */}
                                <div className="mt-4 pt-3 border-t border-slate-950 text-[10.5px] text-slate-400 font-sans italic border-l-2 border-cyan-500/40 pl-3.5 bg-slate-950/40 p-2.5 rounded-[1px]">
                                  <strong className="font-mono text-[8px] uppercase text-cyan-400 block mb-0.5 tracking-tight">COM-INT intercepted cable payload:</strong>
                                  "{camp.logs[0]?.description || 'Covert interception logged by supreme cyber matrix.'}"
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right Side: Derived Systemic Theatre Analytics */}
                      <div className="lg:col-span-5 space-y-4">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-black block mb-1">
                          Calculated Systemic Breakdowns
                        </span>

                        <div className="p-4 bg-slate-950 border border-slate-900 rounded-[2px] shadow-sm space-y-4">
                          <span className="font-mono text-[8.5px] uppercase text-slate-400 font-bold tracking-wider block border-b border-slate-900 pb-2">
                            Casualty Concentration By Sovereign Region
                          </span>
                          {analysis.analytics.casualtyByNation.length === 0 ? (
                            <p className="font-mono text-[9px] text-slate-650 uppercase text-center py-4">No kinetic casualties logs registered in this matrix.</p>
                          ) : (
                            <div className="space-y-3.5">
                              {analysis.analytics.casualtyByNation.slice(0, 4).map((item, idx) => (
                                <div key={idx} className="font-mono text-[9.5px]">
                                  <div className="flex justify-between text-slate-400 mb-1">
                                    <span className="font-bold text-slate-200 uppercase">{item.flag} {item.name}:</span>
                                    <span className="text-slate-300 font-bold">{item.count.toLocaleString()} lives ({item.percentage}%)</span>
                                  </div>
                                  <div className="w-full bg-slate-900 h-1.5 shadow-inner rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${item.percentage}%` }}
                                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                                      className="bg-rose-500 h-full rounded-full" 
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-slate-950 border border-slate-900 rounded-[2px] shadow-sm space-y-4">
                          <span className="font-mono text-[8.5px] uppercase text-slate-400 font-bold tracking-wider block border-b border-slate-900 pb-2">
                            Economic Infrastructure Destruction (GDP Lost)
                          </span>
                          {analysis.analytics.gdpLossByNation.length === 0 ? (
                            <p className="font-mono text-[9px] text-slate-650 uppercase text-center py-4">No GDP destruction vectors recorded in this campaign.</p>
                          ) : (
                            <div className="space-y-3.5">
                              {analysis.analytics.gdpLossByNation.slice(0, 4).map((item, idx) => (
                                <div key={idx} className="font-mono text-[9.5px]">
                                  <div className="flex justify-between text-slate-400 mb-1">
                                    <span className="font-bold text-slate-200 uppercase">{item.flag} {item.name}:</span>
                                    <span className="text-slate-300 font-bold">${item.loss.toLocaleString()}B lost ({item.percentage}%)</span>
                                  </div>
                                  <div className="w-full bg-slate-900 h-1.5 shadow-inner rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${item.percentage}%` }}
                                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                                      className="bg-amber-500 h-full rounded-full" 
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Alliance & Bloc status layout */}
                        <div className="p-4 bg-slate-950 border border-slate-900 rounded-[2px] grid grid-cols-2 gap-3.5 font-mono text-[9.5px] shadow-sm">
                          <div className="p-3 bg-slate-900/40 rounded border border-slate-900 flex flex-col justify-between">
                            <span className="text-slate-500 uppercase block text-[8px] font-black">Allies (Opinion &#62; 40):</span>
                            <strong className="text-emerald-400 text-base block mt-2">{analysis.analytics.diplomaticBalance.allies} countries</strong>
                          </div>
                          <div className="p-3 bg-slate-900/40 rounded border border-slate-900 flex flex-col justify-between">
                            <span className="text-slate-500 uppercase block text-[8px] font-black">Hostile States (Opinion &#60; -40):</span>
                            <strong className="text-rose-500 text-base block mt-2">{analysis.analytics.diplomaticBalance.hostile} countries</strong>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB IV: THE LEGACY (STRATEGIC DOCTRINE ANALYSIS, LEGACY ESSAY, TRANS-EXPORT DOSSIER) */}
                  {activeTab === 'legacy' && (
                    <motion.div
                      key="legacy"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in"
                    >
                      {/* Left Side: Strategic Doctrine Matrix Board & custom scrollable essays */}
                      <div className="lg:col-span-6 space-y-6">
                        <div className="p-6 bg-slate-950 border border-slate-900 rounded-[2.5px] space-y-4 shadow-xl">
                          <div className="flex items-center gap-1.5 border-b border-slate-900 pb-3">
                            <Award className="w-4.5 h-4.5 text-yellow-500" />
                            <span className="font-mono text-[9.5px] tracking-widest uppercase text-slate-450 font-black">
                              Administrative Leadership Doctrine Verdict
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="font-mono text-[13px] text-white font-extrabold uppercase">
                              CLASSIFIED ARCHETYPE: <span className="text-[#00ffd5] tracking-wide">{analysis.playerAssessment.title}</span>
                            </div>
                            <p className="font-sans text-[12px] text-slate-350 leading-relaxed text-justify antialiased pr-2">
                              {analysis.playerAssessment.summary}
                            </p>
                          </div>

                          {/* Double-Sided Slide Metrics Matrix */}
                          <div className="space-y-4 border-t border-slate-900/70 pt-4">
                            {analysis.playerAssessment.axes.map((axis, idx) => (
                              <div key={idx} className="font-mono text-[9px] text-slate-500">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-slate-400 font-bold uppercase">{axis.label}</span>
                                  <span className="text-cyan-400 font-black">{axis.score}%</span>
                                </div>

                                {/* Slider Track with real calibrated notch */}
                                <div className="relative w-full bg-slate-900 select-none h-2.5 rounded-[1.5px] shadow-inner">
                                  {/* Inner ratio represent */}
                                  <div 
                                    className="absolute top-0 bottom-0 left-0 bg-slate-850 rounded-l-[1.5px]"
                                    style={{ width: `${axis.score}%` }}
                                  />
                                  {/* Central focus Notch indicator */}
                                  <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-4 bg-cyan-400 border border-slate-950 rounded-[1.5px] shadow-[0_0_8px_#00e5ff]"
                                    style={{ left: `calc(${axis.score}% - 5px)` }}
                                  />
                                </div>

                                <div className="flex justify-between items-center font-mono text-[7.5px] text-slate-650 mt-1 uppercase">
                                  <span>{axis.leftLabel}</span>
                                  <span>{axis.rightLabel}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Detailed detected registry traits bullet slots */}
                          <div className="border-t border-slate-900 pt-4">
                            <span className="font-mono text-[8px] uppercase text-slate-500 font-black tracking-wider block mb-2">
                              INTELLIGENCE REGISTRY DETECTED DOCTRINAL TRAITS:
                            </span>
                            <ul className="list-none space-y-1.5 text-sans text-[11px] text-slate-300">
                              {analysis.playerAssessment.traits.map((trait, tIdx) => (
                                <li key={tIdx} className="flex items-start gap-2 italic">
                                  <span className="text-cyan-500 font-mono text-[9px] shrink-0 mt-0.5">•</span>
                                  <span>{trait}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Large Editorial Vintage Typewriter Legacy Journal Column */}
                        <div className="p-5 bg-slate-950 border border-slate-900 rounded-[1px] space-y-3 relative overflow-hidden shadow-inner">
                          {/* Insignia background watermark stamp */}
                          <div className="absolute right-3 bottom-3 opacity-[0.03] text-white font-mono pointer-events-none text-9xl">
                            {flagEmoji}
                          </div>
                          
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[#00ff44] font-black block">
                            Historical Obituary & Geopolitical Verdict
                          </span>
                          
                          <p className="font-sans text-[12px] text-slate-300 leading-relaxed text-justify antialiased pr-2 pb-1 p-4 bg-[#050912]/50 border border-slate-900 rounded-[1px] font-medium border-l-2 border-emerald-500/50">
                            {legacyNarrative}
                          </p>

                          {/* Signature board for official administrative clearance verification */}
                          <div className="mt-5 pt-4 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4 font-mono text-[8.5px] text-slate-500">
                            <div>
                              <span>RECONSTRUCTED BY:</span>
                              <div className="text-slate-300 font-bold uppercase mt-1">ALLIED INTEL BOARD</div>
                            </div>
                            <div className="text-right">
                              <span>VERIFICATION SEAL:</span>
                              <div className="text-emerald-500 font-bold mt-1 tracking-widest">ACCEPTED SYSTEM CLEAR</div>
                            </div>
                            <div>
                              <span>SIGNATURE SLOT:</span>
                              <div className="italic text-slate-400 font-serif text-xs border-b border-slate-800 pb-1 mt-0.5">
                                High Commander Gen. {playerState.countryId}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Branded Export PNG Card */}
                      <div className="lg:col-span-6 border-l border-slate-900 lg:pl-6 space-y-3">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-black block text-center">
                          Official Transmission Embargo Output (Screenshot preview)
                        </span>
                        
                        <div className="flex justify-center">
                          <ShareCard
                            id="debrief-share-card-container"
                            playerCountryId={playerState.countryId}
                            playerCountryName={playerCountryName}
                            flagEmoji={flagEmoji}
                            tick={worldState.currentTick}
                            outcomeType={outcomeType}
                            outcomeReason={outcomeReason}
                            legacyNarrative={legacyNarrative}
                            stats={stats}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* BOTTOM COMMAND FOOTER */}
              <footer className="mt-6 pt-4 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between text-[8.5px] font-mono text-slate-600 tracking-wider gap-2 shrink-0 select-none">
                <span className="uppercase font-semibold">CLASSIFIED RECORD FILE S-4.4 // DO NOT TRANSLATE OUTSIDE SECURE SYSTEMS</span>
                <span className="flex items-center gap-1.5 uppercase font-bold text-[#00ff44]/80">
                  <span className="w-1.5 h-1.5 bg-[#00ff44] rounded-full animate-pulse" />
                  <span>SYSTEM FEED TRANSMISSION COMPLETELY SEALED & DECLASSIFIED</span>
                </span>
              </footer>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
