import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CinematicScene } from '../../../store/cinematicsStore';
import { audio } from '../../../utils/audio';
import { useWorldStore } from '../../../store/worldStore';
import { usePlayerStore } from '../../../store/playerStore';
import { deriveDebriefAnalysis } from '../../../utils/debriefDataDeriver';
import { generateLegacyNarrative } from '../../../utils/legacyGenerator';
import { getRegion } from '../../../utils/canonicalGenerator';

const TypewriterText: React.FC<{ text: string; speed?: number; onComplete?: () => void; className?: string; delay?: number }> = ({ text, speed = 20, onComplete, className, delay = 0 }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let charTimer: NodeJS.Timeout;
    timer = setTimeout(() => {
      let i = 0;
      charTimer = setInterval(() => {
        setDisplayed(text.substring(0, i));
        i++;
        if (i > text.length) {
          clearInterval(charTimer);
          onComplete?.();
        }
      }, speed);
    }, delay);
    return () => { clearTimeout(timer); clearInterval(charTimer); };
  }, [text, speed, delay]);
  return <span className={className}>{displayed}</span>;
};

const generateCitizen = (regionHint: string, idx: number) => {
  const regions: Record<string, any> = {
    'NA': { first: ['James', 'Emma', 'David'], last: ['Smith', 'Johnson', 'Brown'], occ: ['Teacher', 'Engineer'] },
    'EU': { first: ['Muller', 'Sophie', 'Lukas'], last: ['Weber', 'Martin', 'Dubois'], occ: ['Analyst', 'Nurse'] },
    'AS': { first: ['Wei', 'Jin', 'Satoshi'], last: ['Chen', 'Wang', 'Sato'], occ: ['Logistics', 'Manager'] }
  };
  const pool = regions[regionHint] || regions['NA'];
  const seed = (regionHint.charCodeAt(0) + idx) * 17;
  return {
    name: `${pool.first[seed % pool.first.length]} ${pool.last[(seed * 3) % pool.last.length]}`,
    age: 22 + (seed % 40),
    occupation: pool.occ[(seed * 5) % pool.occ.length],
  };
};

export const GameOverSceneRenderer: React.FC<{ scene: CinematicScene; onComplete: () => void; isVictory: boolean }> = ({ scene, onComplete, isVictory }) => {
  const [phase, setPhase] = useState(0);
  
  const worldState = useWorldStore.getState();
  const playerState = usePlayerStore.getState();
  
  const leaderName = "COMMANDER";
  
  const { turningPoints, analytics, playerAssessment } = deriveDebriefAnalysis(worldState, playerState);
  const narrative = generateLegacyNarrative(worldState, playerState);
  
  const startYear = 2026;
  const endYear = startYear + Math.floor(worldState.currentTick / 52); // Approx 1 week per tick
  const totalTicks = worldState.currentTick;
  
  const totalCivCasualties = analytics.casualtyByNation.reduce((acc, curr) => acc + curr.count, 0) || 12450000;
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    switch(phase) {
      case 0:
        if (isVictory) audio.sfxPeaceResolution();
        else { audio.sfxCoupStaticBurst(); audio.sfxWarKlaxon(); }
        timer = setTimeout(() => setPhase(1), 1500);
        break;
      case 1:
        audio.sfxKeyClick();
        timer = setTimeout(() => setPhase(2), 4000);
        break;
      case 2:
        audio.setTensionState('RESOLUTION', 4000);
        timer = setTimeout(() => setPhase(3), 10000);
        break;
      case 3:
        timer = setTimeout(() => setPhase(4), 6000);
        break;
      case 4:
        if (isVictory) audio.sfxSuccessConfirmation();
        else audio.sfxCrisisWarning();
        timer = setTimeout(() => setPhase(5), 6000);
        break;
      case 5:
        if (isVictory) audio.playPhaseReveal();
        else { audio.sfxNuclearAlarm(); }
        break;
    }
    return () => clearTimeout(timer);
  }, [phase, isVictory]);

  // key skip logic
  useEffect(() => {
    const handleKey = () => {
      if (phase >= 2 && phase < 5) setPhase(5);
      else if (phase === 5) {
        audio.setTensionState('PEACETIME_MONITORING', 1000); // clear music completely or reset
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#020202] text-zinc-300 font-mono flex flex-col items-center justify-center p-8 select-none">
      <AnimatePresence mode="wait">
        
        {/* PHASE 0: TRANSMISSION INTERRUPT */}
        {phase === 0 && (
          <motion.div 
            key="p0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-50 ${isVictory ? 'bg-white' : 'bg-transparent'}`}
          >
            {!isVictory && (
              <div className="w-full h-full repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)" 
                   style={{ background: 'repeating-linear-gradient(transparent, transparent 1px, #111 2px, #333 3px)'}}>
                <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay animate-pulse"></div>
              </div>
            )}
          </motion.div>
        )}

        {/* PHASE 1: TEMPORAL ASSESSMENT */}
        {phase === 1 && (
          <motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl border border-zinc-800 p-12 bg-[#0c0c0c] shadow-2xl relative">
            <div className="text-zinc-500 font-bold border-b border-zinc-800 pb-2 mb-8">OFFICE OF THE HISTORIAN — CLASSIFIED ARCHIVES</div>
            <div className="text-red-800 font-black tracking-[0.2em] mb-12">CLASSIFIED HISTORICAL RECORD — EYES ONLY</div>
            
            <div className="flex flex-col gap-4 text-lg">
              <div><TypewriterText text={`SIMULATION PERIOD: 2026 — ${endYear}`} delay={0} onComplete={() => audio.sfxKeyClick()}/></div>
              <div><TypewriterText text={`TOTAL TICKS ELAPSED: ${totalTicks}`} delay={400} onComplete={() => audio.sfxKeyClick()}/></div>
              <div><TypewriterText text={`SCENARIO: ${playerState.activeScenario}`} delay={800} onComplete={() => audio.sfxKeyClick()}/></div>
              <div><TypewriterText text={`COMMANDER: ${leaderName} (${playerState.countryId})`} delay={1200} onComplete={() => audio.sfxKeyClick()}/></div>
              <div><TypewriterText text={`FINAL STATUS: ${isVictory ? 'DETERRENCE MAINTAINED / SOVEREIGNTY SECURED' : 'SYSTEMIC COLLAPSE / DETERRENCE FAILED'}`} delay={1600} onComplete={() => audio.sfxKeyClick()}/></div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="mt-12 flex flex-col gap-2">
              <div className="text-zinc-400">COMPILING HISTORICAL RECORD...</div>
              <div className="w-full h-8 bg-black border border-zinc-700 relative flex items-center justify-center font-black tracking-widest text-[#0c0c0c]">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'linear' }}
                  className="absolute left-0 top-0 bottom-0 bg-zinc-300 -z-10 mix-blend-screen"
                />
                100% — RECORD COMPILED
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* PHASE 2: TURNING POINTS */}
        {phase === 2 && (
          <motion.div key="p2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl max-h-[800px] overflow-hidden flex flex-col pt-8">
            <div className="text-2xl font-black mb-8 border-b border-zinc-700 pb-4 text-zinc-100">DEFINING MOMENTS OF THE MILITARY/DIPLOMATIC CRISIS</div>
            <div className="flex flex-col gap-6 overflow-y-auto pr-4 scrollbar-thin">
              {turningPoints.slice(0, 10).map((tp, idx) => (
                <motion.div 
                   key={idx}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 1.0 }}
                   onAnimationStart={() => audio.sfxIntelChime()}
                   className="border-l-2 border-zinc-600 pl-6 pb-2"
                >
                  <div className={`text-xs tracking-widest font-bold mb-1 ${tp.type === 'NUCLEAR' || tp.type === 'WAR' ? 'text-red-500' : tp.type === 'ALLIANCE' ? 'text-green-600' : 'text-zinc-400'}`}>
                    [TICK {tp.tick.toString().padStart(3, '0')}] — {tp.title.toUpperCase()}
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed mb-2">{tp.description}</div>
                  <div className="text-xs text-zinc-500 italic border-l border-zinc-700 pl-2">HISTORICAL JUDGMENT: {tp.whyItMatters}</div>
                </motion.div>
              ))}
              {turningPoints.length === 0 && (
                <div className="text-zinc-500 italic">No major turning points recorded in this simulation segment.</div>
              )}
            </div>
          </motion.div>
        )}

        {/* PHASE 3: CASUALTIES */}
        {phase === 3 && (
          <motion.div key="p3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-5xl h-full border border-zinc-800 bg-[#0A0A0A] p-16 relative">
            <div className="text-center font-black tracking-[0.4em] text-3xl mb-2 text-zinc-100">HUMAN COST — FINAL ASSESSMENT</div>
            <div className="text-center text-red-900 border-b border-zinc-800 pb-12 mb-12 font-bold tracking-widest">CLASSIFICATION: SECRET</div>
            
            <div className="flex gap-16 h-full">
              {/* LEFT */}
              <div className="w-1/2 flex flex-col gap-8">
                <div className="text-zinc-500 tracking-widest border-b border-zinc-800 pb-2">VERIFIED EST. CASUALTIES</div>
                <div className="flex justify-between items-end text-xl">
                  <span>COMBATANTS:</span>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-red-500 font-bold">{Math.floor(totalCivCasualties * 0.12).toLocaleString()}</motion.span>
                </div>
                <div className="flex justify-between items-end text-xl">
                  <span>CIVILIANS:</span>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-white font-bold">{Math.floor(totalCivCasualties * 0.88).toLocaleString()}</motion.span>
                </div>
                <div className="flex justify-between items-end text-xl">
                  <span>DISPLACED:</span>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-amber-500 font-bold">{Math.floor(totalCivCasualties * 3.4).toLocaleString()}</motion.span>
                </div>
              </div>

              {/* RIGHT */}
              <div className="w-1/2 flex flex-col gap-6 pt-10 border-l border-zinc-900 pl-16">
                {['NA', 'EU', 'AS', 'ME'].map((reg, idx) => {
                  const citizen = generateCitizen(reg, idx);
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 + (idx * 0.5) }}
                      className="text-xs text-zinc-400 tracking-widest"
                    >
                      <div className="text-zinc-200 font-bold mb-1">{citizen.name}, {citizen.age}</div>
                      <div className="text-zinc-600 mb-1">{citizen.occupation}</div>
                      <div className="text-zinc-500">{isVictory ? 'FATE: SURVIVED. REBUILDING.' : 'FATE: UNOCCUPANT. STATUS UNKNOWN/DECEASED.'}</div>
                    </motion.div>
                  )
                })}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.5 }} className="mt-8 text-[10px] text-zinc-700 italic max-w-sm">
                  ...and {(totalCivCasualties - 4).toLocaleString()} others whose names are not recorded in this document.
                </motion.div>
              </div>
            </div>

            {/* Audio cue sine wave happens at 3s via phase effect, handled by useEffect */}
          </motion.div>
        )}

        {/* PHASE 4: STRATEGIC LEGACY */}
        {phase === 4 && (
          <motion.div key="p4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl bg-[#0c0c0c] border border-zinc-800 p-12">
            <div className="text-xl font-bold tracking-widest border-b border-zinc-700 pb-4 mb-8">
              STRATEGIC LEGACY — {playerState.countryId} UNDER {leaderName}
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-8 text-sm leading-relaxed text-zinc-300">
              <div>
                <span className="text-zinc-500 block mb-1">GEOPOLITICAL OUTCOME:</span>
                <TypewriterText speed={5} text={isVictory ? 'Hegemonic preservation achieved. Sovereign alignment stabilized in favor of state priorities.' : 'Total systemic failure. State apparatus collapsed under hostile doctrine override.'} />
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">DETERRENCE RECORD:</span>
                <TypewriterText speed={5} delay={400} text={isVictory && !worldState.nuclearExchangeOccurred ? 'Nuclear taboo preserved. Strategic weapons unused.' : 'Deterrence failed. Nuclear exchange triggered across multiple theaters.'} />
              </div>
              <div className="col-span-2 mt-4 text-base italic border-t border-zinc-800 pt-6 text-zinc-400">
                <TypewriterText speed={20} delay={1000} text={narrative} />
              </div>
            </div>
          </motion.div>
        )}

        {/* PHASE 5: FINAL VERDICT */}
        {phase === 5 && (
          <motion.div key="p5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-12 bg-black text-center">
            
            {isVictory ? (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} className="text-7xl md:text-9xl font-black text-white tracking-widest">
                  DETERRENCE MAINTAINED
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="text-3xl font-bold text-green-500 mt-8 tracking-[0.2em]">
                  {worldState.countries[playerState.countryId]?.name || playerState.countryId} prevailed.
                </motion.div>
              </>
            ) : (
              <>
                <motion.div initial={{ color: '#ef4444' }} animate={{ color: '#ffffff' }} transition={{ duration: 3 }} className="text-7xl md:text-9xl font-black tracking-widest">
                  DETERRENCE FAILED
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold text-amber-500 mt-8 tracking-[0.2em] animate-pulse">
                  {scene.payload?.reason || 'Critical system failure resulting in strategic collapse.'}
                </motion.div>
              </>
            )}

            <div className="mt-16 max-w-2xl text-zinc-500 text-sm italic">
              <TypewriterText text={narrative.split('.')[0] + '.'} delay={2000} />
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }} className="absolute bottom-12 text-[10px] text-zinc-800 tracking-widest">
              {isVictory ? `This record will be archived under classification: TOP SECRET // VANGUARD-${playerState.countryId} // EYES ONLY` : `Errors of this nature are not repeated. They are only studied.`}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 }} className="absolute bottom-4 right-4 text-xs text-zinc-600 animate-pulse">
              PRESS ANY KEY TO CONTINUE
            </motion.div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
