import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CinematicScene } from '../../../store/cinematicsStore';
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

// Simplified inline generator for plausible operations
const generateOperationName = (id: string) => {
  const colors = ['RED', 'BLACK', 'COBALT', 'CRIMSON', 'ONYX', 'SCARLET'];
  const nouns = ['EAGLE', 'WINTER', 'DAWN', 'HORIZON', 'SHADOW', 'TIDE'];
  const c = colors[id.charCodeAt(0) % colors.length];
  const n = nouns[id.charCodeAt(id.length-1) % nouns.length];
  return `OPERATION ${c} ${n}`;
};

export const OperativeBurnedRenderer: React.FC<{ scene: CinematicScene }> = ({ scene }) => {
  const [phase, setPhase] = useState(0);
  const payload = scene.payload || {};
  const opId = payload.operativeId || `OP-${Math.floor(Math.random() * 8999) + 1000}`;
  const opName = payload.operativeName || "REDACTED";
  const opCover = payload.coverIdentity || 'CLASSIFIED';
  const targetCountry = payload.targetCountry || 'UNKNOWN';
  const fate = payload.fate || 'KILLED IN ACTION — CONFIRMED';

  useEffect(() => {
    let timer: NodeJS.Timeout;
    switch(phase) {
      case 0:
        audio.sfxKeyClick();
        audio.sfxRadioIntercept();
        timer = setTimeout(() => setPhase(1), 3000);
        break;
      case 1:
        if (fate.includes('KIA') || fate.includes('KILLED')) audio.sfxNuclearAlarm();
        else if (fate.includes('TURNED')) audio.sfxCoupStaticBurst();
        else if (fate.includes('EXTRACT')) audio.sfxRadarPing();
        else { audio.sfxCrisisWarning(); setTimeout(() => audio.sfxCrisisWarning(), 100); }
        timer = setTimeout(() => setPhase(2), 2000);
        break;
      case 2:
        timer = setTimeout(() => setPhase(3), 4000);
        break;
      case 3:
        timer = setTimeout(() => setPhase(4), 3000);
        break;
      case 4:
        audio.sfxSuccessConfirmation();
        break;
    }
    return () => clearTimeout(timer);
  }, [phase, fate]);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#020202] text-zinc-300 font-mono flex items-center justify-center p-8 select-none">
      <AnimatePresence mode="wait">
        {phase < 4 && (
          <motion.div 
            key="doc"
            initial={{ opacity: 0, rotateX: 10 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-4xl h-full max-h-[800px] border-2 border-zinc-800 bg-[#f7f7f7] text-zinc-900 flex flex-col p-12 relative overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="border-b-4 border-black pb-4 mb-8 flex flex-col gap-2 relative">
              <div className="text-3xl font-black tracking-widest text-black">PERSONNEL FILE — CASE OFFICER RECORD</div>
              <div className="text-red-700 font-bold tracking-widest">CLASSIFICATION: TOP SECRET // HCS // ORCON</div>
              <div className="text-sm font-bold tracking-widest text-zinc-500">CASE FILE: {opId}</div>
            </div>

            {/* PHASE 0 & 1 Content */}
            {(phase === 0 || phase === 1) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex gap-12">
                
                <div className="w-1/3 relative border border-black p-2 flex flex-col justify-center items-center h-80 bg-white">
                  {/* Pseudo SVG silhouette since portrait generator takes specific personality */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="currentColor">
                    <circle cx="50" cy="40" r="25" />
                    <path d="M 10 100 C 10 60, 90 60, 90 100 Z" />
                  </svg>
                  
                  <motion.div 
                    initial={{ scale: 2, opacity: 0, rotate: -25 }}
                    animate={{ scale: 1, opacity: 1, rotate: -25 }}
                    transition={{ delay: 2, duration: 0.4 }}
                    className="absolute text-5xl font-black text-red-600 border-4 border-red-600 px-4 py-2"
                  >
                    COMPROMISED
                  </motion.div>
                </div>

                <div className="w-2/3 flex flex-col gap-6 font-bold text-lg">
                  <div><TypewriterText text={`NAME: ${opName}`} delay={200} onComplete={() => audio.sfxKeyClick()} /></div>
                  <div><TypewriterText text={`ALIAS: ${opCover}`} delay={400} onComplete={() => audio.sfxKeyClick()} /></div>
                  <div><TypewriterText text={`OPERATIONAL THEATER: ${targetCountry}`} delay={600} onComplete={() => audio.sfxKeyClick()} /></div>
                  <div><TypewriterText text={`YEARS OF SERVICE: ${Math.floor(Math.random() * 14) + 4}`} delay={800} onComplete={() => audio.sfxKeyClick()} /></div>
                  <div><TypewriterText text={`SPECIALTY: HUMINT / SIGINT / COVERT ACTION`} delay={1000} onComplete={() => audio.sfxKeyClick()} /></div>
                  
                  <div className="mt-8 relative">
                    <div className="flex gap-4 items-center">
                      <span>STATUS:</span>
                      {phase === 0 ? (
                        <div className="bg-black text-black">████████████████</div>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={
                          fate.includes('TURNED') ? 'text-red-600 animate-pulse' :
                          fate.includes('KIA') || fate.includes('KILLED') ? 'bg-black text-white px-2' :
                          fate.includes('EXTRACT') ? 'text-green-700' :
                          fate.includes('COMPROMISED') ? 'text-amber-600' : 'text-red-700'
                        }>
                          {fate}
                        </motion.div>
                      )}
                    </div>
                    {phase >= 1 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-xs text-zinc-500 font-normal">
                        <div>STATUS UPDATED: {new Date().toISOString()}</div>
                        <div>REPORTING SOURCE: FIELD SECURE COMM LINK</div>
                      </motion.div>
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* PHASE 2 */}
            {phase === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-8">
                <div className="text-2xl font-bold tracking-widest">OPERATIONAL EXPOSURE ASSESSMENT</div>
                
                <div className="flex flex-col gap-4 bg-zinc-100 p-6 border border-zinc-300">
                  <div className="font-bold underline">NETWORKS AT RISK:</div>
                  <div className="grid grid-cols-3 font-bold text-sm tracking-widest gap-2">
                    <div>{generateOperationName(opId)}</div><div className="text-red-600">COMPROMISED</div><div>[PRIORITY: CRITICAL]</div>
                    <div>{generateOperationName(opName)}</div><div className="text-amber-600">AT RISK</div><div>[PRIORITY: HIGH]</div>
                    <div>{generateOperationName(targetCountry)}</div><div className="text-green-700">SECURE</div><div>[PRIORITY: MEDIUM]</div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 bg-red-50 p-6 border border-red-200">
                  <div className="font-bold underline text-red-900">COUNTERINTELLIGENCE RESPONSE:</div>
                  <div className="flex flex-col gap-2 font-bold text-sm text-red-900">
                    <TypewriterText text="— Initiate asset rollup protocol BRAVO" delay={0} onComplete={() => audio.sfxIntelChime()} />
                    <TypewriterText text={`— Suspend all HUMINT collection in ${targetCountry} 48 hours`} delay={400} onComplete={() => audio.sfxIntelChime()} />
                    <TypewriterText text="— Alert station chief" delay={800} onComplete={() => audio.sfxIntelChime()} />
                    <TypewriterText text={`— Begin damage assessment: EST. COMPLETION ${new Date(Date.now() + 6*3600*1000).toISOString()}`} delay={1200} onComplete={() => audio.sfxIntelChime()} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* PHASE 3 */}
            {phase === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-12">
                 <div className="text-2xl font-bold tracking-widest border-b-2 border-black pb-2">PERSONAL CIRCUMSTANCES — FOR CASE OFFICER USE</div>
                 
                 <div className="flex flex-col gap-4 font-bold text-lg">
                   <TypewriterText text={`Family status: Married`} delay={0} />
                   <TypewriterText text={`Dependents: 2 children, ages 6 and 9`} delay={400} />
                   <TypewriterText text={`Last known communication with family: 14 days ago`} delay={800} />
                   <TypewriterText text={`Emergency contact: Spousal. — NOTIFICATION STATUS: PENDING`} delay={1200} />
                 </div>

                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }} className="mt-12 text-center text-xl font-bold max-w-2xl mx-auto italic">
                   "This individual served their country under cover, in silence, without recognition. Their name will not appear in official records."
                 </motion.div>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 4: CLOSE */}
      {phase === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8">
           <div className="text-white font-mono tracking-widest uppercase">
             {opName} — {new Date().toISOString().split('T')[0]} — {fate.split('—')[0].trim()}
           </div>
        </motion.div>
      )}

    </div>
  );
};
