import React, { useMemo } from 'react';
import { motion } from 'motion/react';
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
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { WorldState, PlayerState } from '../../types';
import { StatBlock } from './StatBlock';
import { EventTimeline } from './EventTimeline';
import { AIReveal } from './AIReveal';
import { ShareCard } from './ShareCard';
import { generateLegacyNarrative } from '../../utils/legacyGenerator';

interface PostGameDebriefProps {
  id: string;
  worldState: WorldState;
  playerState: PlayerState & {
    rollbackToCheckpoint: () => void;
  };
  onSpectate: () => void;
  onRestart: () => void;
}

export const PostGameDebrief: React.FC<PostGameDebriefProps> = ({
  id,
  worldState,
  playerState,
  onSpectate,
  onRestart,
}) => {
  const playerCountry = worldState.countries[playerState.countryId];
  const playerCountryName = playerCountry?.name || 'Sovereign Command';
  const flagEmoji = playerCountry?.flagEmoji || '🌐';

  // 1. Calculate and memoize aggregated metrics safely
  const stats = useMemo(() => {
    // Generate unique dyads of countries currently at war
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

    // Filter strikes that actually hit (IMPACT status)
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

  // 2. Generate custom legacy narrative based on real parameters
  const legacyNarrative = useMemo(() => {
    return generateLegacyNarrative(worldState, playerState);
  }, [worldState, playerState]);

  const outcomeType = playerState.aftermathType || 'NONE';
  const isVictory = outcomeType === 'VICTORY';
  const outcomeReason = isVictory 
    ? (playerState.victoryReason || playerState.aftermathReason || 'Sovereign command decisions achieved victory')
    : (playerState.gameOverReason || playerState.aftermathReason || 'Sovereign command has collapsed');

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md overflow-y-auto px-4 py-8 select-none"
    >
      {/* High-tech workspace outer grid padding wrapper */}
      <div className="w-full max-w-7xl mx-auto flex flex-col min-h-[90vh]">
        
        {/* TOP COMMAND PANEL HEADER */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-cyan-900/30 pb-5 mb-7">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-cyan-500 uppercase">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Sovereign Strategic Report • Clearance Alpha-1</span>
            </div>
            <h1 className="text-2xl font-bold font-mono tracking-tight text-white mt-1 uppercase">
              Classified Immersive Intelligence Archive
            </h1>
          </div>

          <div className="flex gap-3.5 mt-4 md:mt-0 font-mono text-[10px]">
            {playerState.checkpointState && (
              <button
                id="debrief-action-rollback"
                onClick={() => {
                  playerState.rollbackToCheckpoint();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-amber-500/40 bg-amber-950/10 hover:bg-amber-950/20 text-amber-400 hover:text-amber-300 transition-all rounded-[1px] cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Rollback to Checkpoint</span>
              </button>
            )}
            
            <button
              id="debrief-action-spectate"
              onClick={onSpectate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-700 bg-slate-900/10 hover:bg-slate-900/30 text-slate-400 hover:text-slate-300 transition-all rounded-[1px] cursor-pointer"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Spectate Aftermath</span>
            </button>

            <button
              id="debrief-action-restart"
              onClick={onRestart}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-cyan-500/40 bg-cyan-950/10 hover:bg-cyan-950/20 text-cyan-400 hover:text-cyan-300 transition-all rounded-[1px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Matrix</span>
            </button>
          </div>
        </header>

        {/* DOUBLE COLUMN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
          
          {/* LEFT PANEL COLUMN (Metrics + Narrative Summary + AI Operations) */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Primary outcome statement */}
            <div 
              className="p-5 border rounded-[2px]"
              style={{
                borderColor: isVictory ? '#064e3b' : '#991b1b',
                background: isVictory ? 'rgba(4, 120, 87, 0.03)' : 'rgba(153, 27, 27, 0.03)'
              }}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-4 h-4 ${isVictory ? 'text-emerald-400' : 'text-rose-500'}`} />
                <span className="font-mono text-[9px] tracking-widest uppercase font-bold text-slate-400">
                  Campaign Verification Status
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-2.5 antialiased">
                <strong>{playerCountryName} {flagEmoji} Authority:</strong> {outcomeReason}
              </p>
            </div>

            {/* Robust 2x2 statistics segment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatBlock
                id="debrief-stat-wars"
                label="Active Theater Escalations"
                value={stats.totalWars}
                icon={<Swords className="w-4.5 h-4.5" />}
              />
              <StatBlock
                id="debrief-stat-gdp"
                label="Derived Infrastructure GDP Loss"
                value={stats.totalGdpDestroyed}
                format="currency"
                icon={<TrendingDown className="w-4.5 h-4.5" />}
              />
              <StatBlock
                id="debrief-stat-casualties"
                label="Estimated Global Casualties"
                value={stats.totalCasualties}
                icon={<Skull className="w-4.5 h-4.5" />}
              />
              <StatBlock
                id="debrief-stat-nukes"
                label="Ballistic Nuclear Detonations"
                value={stats.nukesDetonated}
                icon={<Flame className="w-4.5 h-4.5" />}
              />
            </div>

            {/* AI Adversary actions reveal */}
            <div className="p-4 border border-slate-900 bg-slate-950/40 rounded-[2px]">
              <AIReveal 
                id="debrief-ai-reveal"
                operations={worldState.aiOperationsLog || []} 
              />
            </div>

          </section>

          {/* RIGHT PANEL COLUMN (Curation Timeline + Download Card) */}
          <section className="lg:col-span-5 flex flex-col gap-6 lg:border-l lg:border-slate-900 lg:pl-8">
            
            {/* Curated chronicle chronicle events block */}
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-semibold">
                TACTICAL CHRONOLOGY OUTLINE
              </span>
              <div className="max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                <EventTimeline 
                  id="debrief-curated-timeline"
                  events={worldState.globalEventLog} 
                />
              </div>
            </div>

            {/* Downloadable Snapshot card container wrapper */}
            <div className="border border-slate-900 p-4 bg-slate-950/30 rounded-[2px]">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-semibold block mb-3.5 text-center">
                ARCHIVE BRANDED TRANSMISSION EMBARGO (SCREENSHOT)
              </span>
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

          </section>

        </div>

        {/* BOTTOM COMMAND FOOTER */}
        <footer className="mt-8 pt-4 border-t border-cyan-900/10 flex items-center justify-between text-[8px] font-mono text-slate-600 tracking-wider">
          <span>CLASSIFIED DOSSIER S-4.4 // GEOPOLITICAL LOGISTICS SECURE</span>
          <span>APPROVED: GENERATING REPORT STACK... READY</span>
        </footer>

      </div>
    </motion.div>
  );
};
