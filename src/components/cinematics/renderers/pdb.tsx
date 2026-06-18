import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CinematicScene } from '../../../store/cinematicsStore';
import { useWorldStore } from '../../../store/worldStore';
import { useDefconStore } from '../../../store/defconStore';
import { usePlayerStore } from '../../../store/playerStore';
import { audio } from '../../../utils/audio';

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

// Simulated canonical text generator since one might not explicitly exist for PDBs
const generateIntelAssessment = (event: any) => {
  const text = event.text.toLowerCase();
  if (text.includes('nuclear') || text.includes('strike')) {
    return `Our assessment indicates a strategic posture shift regarding nuclear escalation. Source reliability: HIGH. Corroborating MASINT suggests launch vehicle movement.`;
  }
  if (text.includes('cyber')) {
    return `Signals intelligence confirms state-sponsored intrusion. Collection confidence: MODERATE. Target disruption is ongoing with persistent access.`;
  }
  if (text.includes('economy') || text.includes('market')) {
    return `Financial intelligence indicates sovereign capital flight. Our assessment points to systemic vulnerability in target sector. Source reliability: MODERATE.`;
  }
  if (text.includes('military')) {
    return `IMINT confirms massing of conventional forces. We assess an operational readiness increase. Corroborating HUMINT indicates pre-deployment staging.`;
  }
  return `Strategic monitoring indicates anomalous activity. Collection confidence: HIGH. We assess long-term geopolitical realignment if unchecked.`;
};

export const PDBSciRenderer: React.FC<{ scene: CinematicScene; onComplete: () => void }> = ({ scene, onComplete }) => {
  const [phase, setPhase] = useState(0);
  const defcon = useDefconStore(s => s.currentDefconLevel);
  const events = useWorldStore(s => s.globalEventLog);
  const worldState = useWorldStore.getState();
  const playerState = usePlayerStore.getState();
  const leaderName = "COMMANDER";
  
  // derived tension approximation
  const tension = defcon === 1 ? 1.0 : defcon === 2 ? 0.8 : defcon === 3 ? 0.6 : 0.4;
  
  const tick = useWorldStore(s => s.currentTick);

  // Top 3 events from last 10 ticks
  const recentEvents = events.filter(e => e.tick >= tick - 10).slice(0, 3);
  
  // Dummy threat data (normally from intel store)
  const threats = [
    { country: 'Federation', threat: 'HIGH' },
    { country: 'Alliance', threat: 'ELEVATED' }
  ];

  const pdbItems = [...recentEvents.map(e => ({
    category: e.severity || 'INFO',
    event: e
  })), ...threats.map(t => ({
    category: 'THREAT ASSESSMENT',
    event: { text: `Target nation ${t.country} showing ${t.threat} hostility profile.` }
  }))].slice(0, 5);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    switch (phase) {
      case 0:
        audio.startIntroDrone();
        timer = setTimeout(() => setPhase(1), 2500);
        break;
      case 1:
        // Wait 8s, skippable sooner
        timer = setTimeout(() => setPhase(2), 8000);
        break;
      case 2:
        audio.playPhaseReveal();
        timer = setTimeout(() => setPhase(3), 5000);
        break;
      case 3:
        audio.sfxSuccessConfirmation();
        setTimeout(() => audio.setTensionState(audio.getTensionState(), 2000), 500);
        timer = setTimeout(() => onComplete(), 2000);
        break;
    }
    return () => clearTimeout(timer);
  }, [phase]);

  // Phase skip logic
  useEffect(() => {
    const handleKey = () => {
      if (phase >= 1 && phase < 3) setPhase(phase + 1);
      else if (phase >= 3) onComplete();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#050505] text-zinc-300 font-mono flex items-center justify-center p-8 select-none">
      
      {/* SCANLINE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }}></div>

      <AnimatePresence mode="wait">
        {(phase === 0 || phase === 1 || phase === 2) && (
          <motion.div 
            key="document"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-4xl h-full max-h-[800px] border-2 border-zinc-800 bg-[#0c0c0c] flex flex-col p-8 relative overflow-hidden shadow-2xl"
          >
            {/* Phase 0 Header building */}
            <div className="border-b-2 border-zinc-700 pb-6 mb-6 flex flex-col gap-2 relative">
              <div className="bg-amber-700 text-amber-100 text-center font-black tracking-[0.3em] py-1 absolute -top-8 -left-8 -right-8">
                TOP SECRET // SCI // NOFORN
              </div>
              <div className="mt-8 text-2xl font-black tracking-widest text-white">PRESIDENT'S DAILY BRIEF</div>
              <TypewriterText text="Prepared by: Office of the Director of National Intelligence" delay={200} onComplete={() => audio.sfxKeyClick()} />
              <TypewriterText text={`For: ${leaderName}`} delay={400} onComplete={() => audio.sfxKeyClick()} />
              <TypewriterText text={`Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`} delay={600} onComplete={() => audio.sfxKeyClick()} />
              <TypewriterText text={`PDB Serial: PDB-${tick.toString().padStart(4, '0')}-POTUS`} delay={800} onComplete={() => audio.sfxKeyClick()} />
              <TypewriterText text="Classification Authority: DNI-2027-0044-A" delay={1000} onComplete={() => audio.sfxKeyClick()} />
            </div>

            {/* Phase 1 Intelligence Overview */}
            {phase >= 1 && phase < 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col gap-4 overflow-y-auto pr-4 scrollbar-thin">
                {pdbItems.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.6 }}
                    onAnimationStart={() => {
                        if (item.category === 'NUCLEAR' || item.category === 'THREAT ASSESSMENT') audio.sfxCrisisWarning();
                        else audio.sfxIntelChime();
                    }}
                    className="border border-zinc-800 bg-[#111] p-4 relative overflow-hidden"
                  >
                    <motion.div 
                      className="absolute inset-x-0 top-0 h-0.5 bg-amber-500/50"
                      initial={{ scaleX: 0, originX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: idx * 0.6, duration: 0.5 }}
                    />
                    <div className="text-amber-500 font-bold tracking-widest text-xs mb-1">ITEM {idx + 1} OF {pdbItems.length} — {item.category.toUpperCase()}</div>
                    <div className="text-[10px] text-zinc-500 mb-3">[Classification: SECRET//NOFORN]</div>
                    <div className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
                      {item.event.text}
                      <br/><br/>
                      {generateIntelAssessment(item.event)}
                    </div>
                    <div className="mt-4 text-[10px] text-amber-700 italic border-t border-zinc-800 pt-2">
                       ANALYST COMMENT: Situation remains fluid. Close monitoring advised.
                    </div>
                  </motion.div>
                ))}
                <div className="text-center text-[10px] text-zinc-600 mt-4 animate-pulse">SCROLL TO READ FULL ASSESSMENT</div>
              </motion.div>
            )}

            {/* Phase 2 Priority Actions */}
            {phase === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                <div className="text-red-500 text-lg font-bold tracking-widest border-b border-red-900/30 pb-2 mb-6">
                  PRIORITY ACTION ITEMS — COMMANDER'S ATTENTION REQUIRED
                </div>
                
                <div className="flex flex-col gap-4">
                  {(defcon <= 3 || tension > 0.6) ? (
                     <div className="text-zinc-200">
                       1. [ACTION REQUIRED] — Elevate strategic posture. Defcon currently at {defcon}. — <span className="text-red-500 font-bold">[PRIORITY: CRITICAL]</span>
                     </div>
                  ) : (
                     <div className="text-zinc-500">
                       <TypewriterText text="NO PRIORITY ACTION ITEMS AT THIS TIME." />
                       <br/><br/>
                       WORLDWIDE SITUATION: <TypewriterText text="STABLE" delay={1500} speed={150} className="text-green-500" />
                     </div>
                  )}
                </div>

                <div className="mt-auto border-t border-zinc-800 pt-4 flex flex-col gap-1 text-[9px] text-zinc-600 tracking-widest uppercase">
                  <div>This brief has been prepared using ALL-SOURCE intelligence including SIGINT, HUMINT, IMINT, and MASINT collection assets.</div>
                  <div className="text-amber-700">DISTRIBUTION: EYES ONLY — COMMANDER LEVEL AND ABOVE</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Phase 3 Close */}
        {phase === 3 && (
          <motion.div 
            key="close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center text-zinc-500 text-sm font-mono tracking-widest"
          >
            PDB-{tick.toString().padStart(4, '0')}-POTUS — READ AND ACKNOWLEDGED — {new Date().toISOString()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
