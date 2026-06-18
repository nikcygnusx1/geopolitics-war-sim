import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CinematicScene } from '../../../store/cinematicsStore';
import { audio } from '../../../utils/audio';
import { useWorldStore } from '../../../store/worldStore';
import { useDefconStore } from '../../../store/defconStore';
import { getCapital, getRegion } from '../../../utils/canonicalGenerator';

interface NuclearSceneProps {
  scene: CinematicScene;
  onComplete: () => void;
}

const REGIONAL_NAMES: Record<string, {first: string[], last: string[], occ: string[], hood: string[]}> = {
  'EASTERN_EUROPE': {
    first: ['Anya', 'Dmitry', 'Elena', 'Ivan', 'Natalia', 'Sergei'],
    last: ['Ivanov', 'Petrov', 'Sokolov', 'Volkov', 'Lebedev'],
    occ: ['Software Engineer', 'Teacher', 'Transit Operator', 'Mechanic', 'Student'],
    hood: ['Central District', 'Industrial Sector 4', 'Riverside', 'Old Town']
  },
  'EAST_ASIA': {
    first: ['Mei', 'Wei', 'Jian', 'Ying', 'Satoshi', 'Yuki', 'Jin'],
    last: ['Lin', 'Wang', 'Chen', 'Sato', 'Tanaka', 'Kim', 'Lee'],
    occ: ['Logistics Coordinator', 'Schoolteacher', 'Accountant', 'Retail Worker'],
    hood: ['Haidian', 'Jing\'an', 'Shinjuku', 'Gangnam', 'High-Tech Zone']
  },
  'NORTH_AMERICA': {
    first: ['Michael', 'Sarah', 'David', 'Emma', 'James', 'Olivia'],
    last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'],
    occ: ['Nurse', 'Financial Analyst', 'Construction Worker', 'Store Manager'],
    hood: ['Downtown', 'Westside', 'North Hills', 'Suburban District']
  },
  'MIDDLE_EAST': {
    first: ['Amir', 'Fatima', 'Hassan', 'Zahra', 'Omar', 'Maryam'],
    last: ['Al-Farsi', 'Haddad', 'Mahmoud', 'Saleh', 'Ibrahim'],
    occ: ['Civil Engineer', 'Pharmacist', 'Market Vendor', 'University Student'],
    hood: ['Old City', 'Financial District', 'New Development', 'South Quarter']
  }
};

const generateCitizen = (countryId: string, idx: number) => {
  const { region } = getRegion(countryId) || { region: 'NORTH_AMERICA' };
  const pool = REGIONAL_NAMES[region] || REGIONAL_NAMES['NORTH_AMERICA'];
  const seed = (countryId.charCodeAt(0) + idx) * 17;
  
  return {
    id: `00${idx + 1}`,
    name: `${pool.first[seed % pool.first.length]} ${pool.last[(seed * 3) % pool.last.length]}`,
    age: 22 + (seed % 40),
    occupation: pool.occ[(seed * 5) % pool.occ.length],
    neighborhood: pool.hood[(seed * 7) % pool.hood.length]
  };
};

const TypewriterText: React.FC<{ text: string; speed?: number; onComplete?: () => void; className?: string }> = ({ text, speed = 30, onComplete, className }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      setDisplayed(text.substring(0, i));
      i++;
      if (i > text.length) {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <span className={className}>{displayed}</span>;
};

export const NuclearExchangeScene: React.FC<NuclearSceneProps> = ({ scene, onComplete }) => {
  const [phase, setPhase] = useState(0);
  const payload = scene.payload || {};
  const targetId = payload.targetCountry || 'UNKNOWN';
  const originId = payload.originCountry || 'UNKNOWN';
  const yieldMT = payload.weaponYield || '1.2';
  const weaponType = payload.weaponType || 'MIRV';
  
  const tick = useWorldStore(s => s.currentTick);
  const defcon = useDefconStore(s => s.currentDefconLevel);
  const tension = defcon === 1 ? 1.0 : defcon === 2 ? 0.8 : defcon === 3 ? 0.6 : 0.4;

  // Time remaining logic for Phase 1
  const [countdown, setCountdown] = useState(8 * 60 + 22);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    switch(phase) {
      case 0:
        audio.enterCinematicSilence(3000);
        setTimeout(() => audio.sfxMissileLaunch(), 3500);
        timer = setTimeout(() => setPhase(1), 4000);
        break;
      case 1:
        audio.sfxRadarPing();
        setTimeout(() => audio.sfxCrisisWarning(), 2000);
        
        // Countdown
        const interval = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
        timer = setTimeout(() => {
          clearInterval(interval);
          setPhase(2);
        }, 5000);
        return () => { clearInterval(interval); clearTimeout(timer); };
        
      case 2:
        // Silhouette silence
        timer = setTimeout(() => setPhase(3), 6000);
        break;
      case 3:
        audio.sfxMissileImpact();
        setTimeout(() => audio.sfxCrisisWarning(), 2100);
        timer = setTimeout(() => setPhase(4), 3000);
        break;
      case 4:
        audio.setTensionState('NUCLEAR_ALERT', 3000);
        timer = setTimeout(() => {
          if (payload.secondaryLaunches && payload.secondaryLaunches > 0) {
            setPhase(5);
          } else {
            setPhase(6);
          }
        }, 8000);
        break;
      case 5:
        timer = setTimeout(() => setPhase(6), 5000);
        break;
      case 6:
        timer = setTimeout(() => onComplete(), 6000);
        break;
    }
    
    return () => clearTimeout(timer);
  }, [phase]);

  // Phase skip logic for 4, 5, 6
  useEffect(() => {
    const handleKey = () => {
      if (phase >= 4) {
        if (phase === 4 && payload.secondaryLaunches > 0) setPhase(5);
        else if (phase < 6) setPhase(6);
        else onComplete();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[99999] bg-black text-white font-mono overflow-hidden select-none cursor-default">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div key="p0" className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute top-4 left-4 text-xs text-zinc-500">DTG: {new Date().toISOString()}</div>
            <div className="absolute top-4 right-4 text-xs text-zinc-500">CLASSIFICATION: TOP SECRET // FURTHERANCE</div>
            
            <div className="text-7xl font-mono tracking-widest text-white">00:00:00</div>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-[10px] text-zinc-600 gap-1">
              <span>NUCLEAR RELEASE AUTHORITY: AUTHENTICATED</span>
              <span>LAUNCH CREW: AUTHENTICATED</span>
              <span>ENABLING ACTION: COMPLETE</span>
            </div>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div key="p1" className="absolute inset-0 flex flex-col items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute top-12 text-red-500 text-sm font-bold tracking-[0.5em] animate-pulse">
              ⚠ INBOUND TRAJECTORY DETECTED
            </div>
            
            <div className="relative w-full max-w-2xl h-64 border-b border-dashed border-red-900/50 flex items-end justify-between px-12 pb-4">
              <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                <motion.path 
                  d="M 50 240 Q 300 -100 600 240"
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="2" 
                  strokeDasharray="1000"
                  initial={{ strokeDashoffset: 1000 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              </svg>
              <div className="text-xs text-zinc-500">{originId} LAUNCH ORIGIN</div>
              <div className="absolute left-1/2 top-10 -translate-x-1/2 text-[10px] text-red-400">MAX ALT: 1200 KM</div>
              <div className="text-xs text-red-500 font-bold">{targetId}</div>
            </div>
            
            <div className="mt-8 flex flex-col gap-2 text-xs text-zinc-400 tracking-widest text-center">
              <div>ORIGIN: {originId}</div>
              <div>TARGET: {targetId} ({getCapital(targetId)})</div>
              <div>YIELD EST: {yieldMT} MT</div>
              <div>WARHEAD TYPE: {weaponType}</div>
            </div>
            
            <div className="absolute bottom-12 text-2xl text-red-500 font-bold tracking-widest font-mono">
              IMPACT IN: 00:{Math.floor(countdown/60).toString().padStart(2,'0')}:{(countdown%60).toString().padStart(2,'0')}
            </div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div key="p2" className="absolute inset-0 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* LEFT SIDE */}
            <div className="w-1/2 border-r border-[#222] p-16 flex flex-col justify-center">
              <div className="text-5xl font-black tracking-widest text-white mb-12">{targetId}</div>
              <div className="flex flex-col gap-4 text-xs text-zinc-400 font-mono tracking-widest">
                <div className="flex justify-between">
                  <span>METROPOLITAN POPULATION:</span>
                  <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }}>8.4M</motion.span>
                </div>
                <div className="flex justify-between">
                  <span>URBAN POPULATION IN BLAST RADIUS:</span>
                  <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }}>2,145K</motion.span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>PROJECTED IMMEDIATE CASUALTIES:</span>
                  <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }}>850K-1,200K</motion.span>
                </div>
                <div className="flex justify-between text-amber-500">
                  <span>PROJECTED DELAYED CASUALTIES:</span>
                  <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }}>400K-900K</motion.span>
                </div>
              </div>
            </div>
            
            {/* RIGHT SIDE */}
            <div className="w-1/2 p-16 flex flex-col justify-center gap-8">
              {[0, 1, 2].map(idx => {
                const citizen = generateCitizen(targetId, idx);
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 1.5, duration: 1 }}
                    className="text-xs text-zinc-300 tracking-widest"
                  >
                    <div className="text-zinc-600 border-b border-zinc-800 pb-1 mb-2">RESIDENT {citizen.id}</div>
                    <div className="text-white font-bold">{citizen.name}, {citizen.age}</div>
                    <div>{citizen.occupation}</div>
                    <div className="text-zinc-500">{citizen.neighborhood}, {getCapital(targetId)}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {phase === 3 && (
          <motion.div key="p3" className="absolute inset-0 bg-[#440000] flex items-center justify-center overflow-hidden" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}>
            {/* The multi-stage flash is handled via standard motion keyframes */}
            <motion.div 
              className="absolute inset-0 z-10 mix-blend-screen pointer-events-none"
              initial={{ backgroundColor: '#ffffff', opacity: 1 }}
              animate={{ 
                backgroundColor: ['#ffffff', '#ff8800', '#ff0000', '#000000'],
                opacity: [1, 1, 0.5, 0]
              }}
              transition={{ duration: 1.5, times: [0, 0.1, 0.4, 1] }}
            />
            
            <motion.div 
              className="absolute inset-0 border border-red-500 m-auto"
              initial={{ width: 0, height: 0, borderRadius: '50%', opacity: 1 }}
              animate={{ width: '200vw', height: '200vw', opacity: 0 }}
              transition={{ duration: 3, ease: 'easeOut' }}
            />
            
            <div className="z-20 flex flex-col items-center gap-4 text-center">
              <TypewriterText text="DETONATION CONFIRMED" className="text-4xl font-black text-red-500 tracking-[0.5em]" speed={40} />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-red-300 tracking-widest mt-4">
                YIELD: {yieldMT} MT EQUIVALENT
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-zinc-400 text-xs tracking-widest">
                {getCapital(targetId)} — {new Date().toISOString()}
              </motion.div>
            </div>
          </motion.div>
        )}

        {phase === 4 && (
          <motion.div key="p4" className="absolute inset-0 p-12 bg-[#050505] flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="border-b border-zinc-800 pb-4 mb-8">
              <div className="text-red-500 text-sm font-bold tracking-widest">STRATEGIC SITUATION ASSESSMENT — POST-DETONATION</div>
              <div className="text-xs text-zinc-500 mt-1">CLASSIFICATION: TOP SECRET // SCI</div>
              <div className="text-[10px] text-zinc-600">CTRL: NSA/CSS-{tick} // DTG: {new Date().toISOString()}</div>
            </div>
            
            <div className="border border-zinc-800 p-4 mb-8 grid grid-cols-2 gap-4 text-xs tracking-widest">
              <div>CURRENT DEFCON: <span className="text-red-500 font-bold">{defcon}</span></div>
              <div>WORLD TENSION: <span className="text-amber-500">{Math.round(tension * 100)}%</span></div>
              <div>CONFIRMED STRIKES: <span className="text-white">1</span></div>
              <div>AWAITING CONFIRMATION: <span className="text-zinc-500">0</span></div>
              <div>ALLIED RESPONSE: <span className="text-red-400">AUTHORIZING</span></div>
              <div>ADVERSARY STATUS: <span className="text-zinc-500">UNKNOWN</span></div>
              <div>INTERCEPT SUCCESS RATE: <span className="text-red-500">0%</span></div>
              <div>EMP ZONE: <span className="text-amber-500">1,200 KM</span></div>
            </div>
            
            <div className="text-zinc-400 text-sm leading-relaxed max-w-4xl text-justify">
              <TypewriterText text="Our assessment indicates successful detonation over the target zone. Initial telemetry confirms catastrophic infrastructure collapse. Regional allied forces are transitioning to defensive posture. Retaliatory strike packages are spun up and awaiting executive launch authority. Source reliability: HIGH. Corroborating SIGINT suggests complete decapitation of local command and control." />
            </div>
            
            <div className="mt-auto text-[10px] text-zinc-600 uppercase">
              THIS ASSESSMENT WILL BE UPDATED AS INFORMATION BECOMES AVAILABLE. — NMCC WATCH OFFICER
            </div>
          </motion.div>
        )}

        {phase === 5 && (
          <motion.div key="p5" className="absolute inset-0 p-12 bg-[#050505] flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-amber-500 text-xl font-bold tracking-widest animate-pulse border-b border-amber-900/50 pb-4 mb-8">
              SECONDARY LAUNCH DETECTION
            </div>
            
            <div className="flex flex-col gap-2 font-mono text-xs">
              {Array.from({ length: Math.min(5, payload.secondaryLaunches || 3) }).map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.8 }}
                  onAnimationStart={() => audio.sfxRadarPing()}
                  className="text-zinc-300"
                >
                  [{new Date().toLocaleTimeString()}] LAUNCH DETECTED — {originId} — TRAJECTORY: OUTBOUND
                </motion.div>
              ))}
              
              {(payload.secondaryLaunches || 3) > 5 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5 * 0.8 }} className="text-amber-600 mt-4">
                  ...AND {(payload.secondaryLaunches || 3) - 5} MORE DETECTIONS
                </motion.div>
              )}
            </div>
            
            <div className="mt-auto pt-8 border-t border-zinc-800 text-xs text-zinc-500 tracking-widest flex flex-col gap-2">
              <div>BALLISTIC MISSILE DEFENSE SYSTEM: <span className="text-red-500">DEGRADED</span></div>
              <div>CURRENT INTERCEPT CAPACITY: <span className="text-red-500">12%</span></div>
            </div>
          </motion.div>
        )}

        {phase === 6 && (
          <motion.div key="p6" className="absolute inset-0 p-12 bg-[#050505] flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex-1 grid grid-cols-3 gap-12 text-xs tracking-widest border-b border-zinc-800 pb-12 mb-8">
              
              <div className="flex flex-col gap-6">
                <div className="text-red-500 font-bold border-b border-zinc-800 pb-2">IMMEDIATE (0-72 HOURS)</div>
                <div className="text-zinc-300 flex flex-col gap-3">
                  <TypewriterText text="• Electromagnetic pulse disables civilian infrastructure" delay={0} />
                  <TypewriterText text="• Fallout plume trajectory: EAST at 24 km/h" speed={15} />
                  <TypewriterText text="• Regional air traffic: SUSPENDED" speed={15} />
                  <TypewriterText text="• Grid failure cascading across borders" speed={15} />
                </div>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="text-amber-500 font-bold border-b border-zinc-800 pb-2">SHORT-TERM (72H-30 DAYS)</div>
                <div className="text-zinc-300 flex flex-col gap-3">
                  <TypewriterText text={`• Radiation sickness casualties: est. 850K+`} speed={20} />
                  <TypewriterText text="• Agricultural contamination zone: 45,000 km²" speed={20} />
                  <TypewriterText text="• Global supply chain disruption: ENERGY, TECH" speed={20} />
                </div>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="text-zinc-400 font-bold border-b border-zinc-800 pb-2">STRATEGIC OUTLOOK</div>
                <div className="text-zinc-300 flex flex-col gap-3">
                  <TypewriterText text="• Alliance stability: CRITICAL FRACTURE" speed={25} />
                  <TypewriterText text="• Retaliatory posture: FULL SPECTRUM" speed={25} />
                  <TypewriterText text="• Diplomatic channel status: SEVERED" speed={25} />
                </div>
              </div>

            </div>
            
            <div className="mt-auto self-center text-[9px] text-zinc-700 tracking-[0.3em] opacity-50">
              HISTORY DOES NOT JUDGE DECISIONS. IT RECORDS OUTCOMES.
            </div>
            <div className="absolute bottom-4 right-4 text-[10px] text-zinc-600 animate-pulse">PRESS ANY KEY TO CONTINUE</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
