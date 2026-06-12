import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WebGLGlobe, WebGLGlobeRef } from './WebGLGlobe';
import { audio } from '../../utils/audio';
import { ClassifiedBriefingPanel } from './ClassifiedBriefingPanel';
import { IntroProgressBar, INTRO_PHASES } from './IntroProgressBar';
import { playClassifiedDocumentBreak } from './ClassifiedDocumentBreak';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [act, setAct] = useState<1 | 2 | 3 | 4>(1);
  const [speed, setSpeed] = useState(0.0006);
  
  // Tactical telemetry streams for left column
  const [systemLoad, setSystemLoad] = useState('42.4%');
  const [pingSec, setPingSec] = useState('14ms');
  const [satUplink, setSatUplink] = useState('ACTIVE_SECURE');

  // New sequence states
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(-1);

  const startTimeRef = useRef<number | null>(null);
  const lastPhaseIndexRef = useRef<number>(-1);
  const globeRef = useRef<WebGLGlobeRef | null>(null);
  const crackTriggeredRef = useRef<boolean>(false);

  const currentPhase = currentPhaseIndex >= 0 ? INTRO_PHASES[currentPhaseIndex] : null;

  // Dynamic ticking values to simulate an incredibly alive defense system
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      setSystemLoad((35 + Math.random() * 15).toFixed(1) + '%');
      setPingSec(Math.round(12 + Math.random() * 8) + 'ms');
      const stateList = ['ACTIVE_SECURE', 'SWEEPING_TARGETS', 'UPDATING_ORBITS', 'TRANSIT_SECURE'];
      setSatUplink(stateList[Math.floor(Math.random() * stateList.length)]);
    }, 1500);

    return () => clearInterval(telemetryInterval);
  }, []);

  // Main high-fidelity timeline loop
  useEffect(() => {
    // Initialize WebAudio context and play customized drone backdrop
    audio.init();
    audio.startIntroDrone();

    let animId: number;

    const tick = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }
      const elapsed = now - startTimeRef.current;
      setElapsedMs(elapsed);

      // Map elapsed to older 'act' states to preserve left/right container animations seamlessly
      if (elapsed >= 24000) {
        setAct(4);
      } else if (elapsed >= 9000) {
        setAct(3);
      } else if (elapsed >= 4000) {
        setAct(2);
      } else {
        setAct(1);
      }

      // Track active briefing phase
      let activePhaseIdx = -1;
      for (let i = INTRO_PHASES.length - 1; i >= 0; i--) {
        if (elapsed >= INTRO_PHASES[i].startTime) {
          activePhaseIdx = i;
          break;
        }
      }

      if (activePhaseIdx !== lastPhaseIndexRef.current) {
        lastPhaseIndexRef.current = activePhaseIdx;
        setCurrentPhaseIndex(activePhaseIdx);
        if (activePhaseIdx >= 0) {
          try {
            audio.playPhaseReveal();
          } catch (err) {}
        }
      }

      // Green tint begins at 28 seconds (28000ms)
      if (elapsed >= 28000) {
        const tintProgress = Math.min((elapsed - 28000) / 1500, 1.0);
        if (globeRef.current) {
          globeRef.current.setGreenTint(tintProgress);
        }
      }

      // Trigger crack transition at 29.5 seconds (29500ms)
      if (elapsed >= 29500 && !crackTriggeredRef.current) {
        crackTriggeredRef.current = true;
        try {
          audio.playDocumentBreak();
        } catch (e) {}
        playClassifiedDocumentBreak(() => {
          onComplete(); // Jump to game lobby
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [onComplete]);

  const handleSkipBriefing = () => {
    if (crackTriggeredRef.current) return;
    
    // Jump time directly to green stamp activation
    if (startTimeRef.current !== null) {
      startTimeRef.current = performance.now() - 28000;
      setElapsedMs(28000);
    } else {
      // Fallback
      crackTriggeredRef.current = true;
      try {
        audio.playDocumentBreak();
      } catch (e) {}
      playClassifiedDocumentBreak(() => {
        onComplete();
      });
    }
  };

  const handleEnterLobby = () => {
    audio.sfxKlaxon();
    onComplete();
  };

  return (
    <div id="sovereign-cinematic-intro" className="fixed inset-0 z-50 bg-[#020305] flex flex-col justify-between overflow-hidden font-mono select-none text-white text-[11px] leading-relaxed antialiased">
      
      {/* Top Briefing Header / Status Band */}
      <div id="intro-header-band" className="h-[55px] bg-[#03060c]/95 border-b-[0.5px] border-[#1e3a60]/50 flex items-center justify-between px-6 z-10 backdrop-blur-md relative shadow-[0_1px_15px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-650 rounded-full animate-ping shrink-0" />
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full absolute shrink-0" />
            <span className="text-[10px] font-bold tracking-widest text-[#00e5ff] uppercase drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              📡 COVERT SATELLITE INTERCEPT // SECURE STREAM
            </span>
          </div>
          <span className="hidden md:inline text-[9px] text-[#00e5ff]/40 font-semibold border-l-[0.5px] border-[#1e3a60]/40 pl-4">
            CLEARANCE: COSMIC TOP SECRET // LEVEL-5
          </span>
        </div>

        <div className="flex items-center gap-6 text-[9.5px] text-[#8ea8ff] font-bold">
          <div className="hidden lg:flex items-center gap-4">
            <div>
              <span className="text-gray-500 mr-1 uppercase">ORBIT_P_ID:</span>
              <span className="text-[#00e5ff]">CN-92_SHIELD</span>
            </div>
            <div>
              <span className="text-gray-500 mr-1 uppercase">SYS_LOAD:</span>
              <span className="text-white font-mono">{systemLoad}</span>
            </div>
            <div>
              <span className="text-gray-500 mr-1 uppercase">PING:</span>
              <span className="text-white font-mono">{pingSec}</span>
            </div>
          </div>
          <div className="bg-red-950/45 px-2.5 py-0.5 border border-red-900/50 text-red-400 text-[8.5px] font-bold rounded animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.2)]">
            POSTURE: CRISIS OVERWATCH STAGE
          </div>
        </div>
      </div>

      {/* Primary Scenic Container (Globe + Layered Telemetry side columns) */}
      <div id="intro-scenic-viewport" className="flex-1 w-full relative flex justify-between z-0">
        
        {/* Left Telemetry Column - Pushed to the edges to preserve perfect central negative space for globe */}
        <div id="intro-sidebar-left" className="hidden md:flex flex-col justify-between w-[220px] lg:w-[280px] bg-gradient-to-r from-[#02050b]/98 via-[#02050b]/90 to-transparent border-r-[0.5px] border-[#1e3a60]/30 p-6 z-10 backdrop-blur-[2px] relative shadow-[10px_0_35px_rgba(0,0,0,0.5)]">
          {/* Confined scanline overlay strictly inside the panel area to avoid overlaying & softening the central globe */}
          <div className="scanlines absolute inset-0 pointer-events-none opacity-10 z-0" />
          
          <div className="space-y-6 z-10 relative">
            <div className="border-[0.5px] border-[#1a355e]/50 bg-[#03070f]/92 p-4 rounded-md relative overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-300 hover:border-[#1a355e]/85">
              <div className="absolute top-0 right-0 w-12 h-[1px] bg-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.7)]" />
              <div className="absolute top-0 right-0 w-[1px] h-12 bg-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.7)]" />
              
              <h3 className="text-[10px] font-bold uppercase text-[#00e5ff] tracking-widest border-b-[0.5px] border-[#1e3a60]/30 pb-1.5 mb-2.5">
                ✦ Space Operations
              </h3>
              <div className="space-y-2 font-mono text-[10px] text-[#a4c2f4]">
                <div className="flex justify-between">
                  <span className="text-gray-500">RECON_SAT_01:</span>
                  <span className="font-bold text-white">LOCK ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">COVERT_UPLINK:</span>
                  <span className="text-[#00e5ff] font-semibold">{satUplink}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">DECRYPTION:</span>
                  <span className="text-[#ffb300]">STABLE 256-BIT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SENSORS GRID:</span>
                  <span className="text-[#00ff44]">99.1% ALIGNED</span>
                </div>
              </div>
            </div>

            <div className="border-[0.5px] border-[#1a355e]/50 bg-[#03070f]/92 p-4 rounded-md relative shadow-[0_10px_25px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-300 hover:border-[#1a355e]/85">
              <h3 className="text-[10px] font-bold uppercase text-[#00e5ff] tracking-widest border-b-[0.5px] border-[#1e3a60]/30 pb-1.5 mb-2.5">
                ✦ Defensive Posture
              </h3>
              <div className="space-y-3 font-mono text-[#a4c2f4]">
                <div>
                  <div className="flex justify-between text-[9.5px] items-center mb-1">
                    <span className="text-gray-400">NUCLEAR ARSENAL MATRIX</span>
                    <span className="text-[#00e5ff] font-bold">100%</span>
                  </div>
                  <div className="w-full bg-[#111f38]/40 h-1 border border-[#1e3a60]/30 overflow-hidden rounded">
                    <div className="bg-[#00e5ff] h-full w-[100%] shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[9.5px] items-center mb-1">
                    <span className="text-gray-400">GLOBAL FORCE INDEX</span>
                    <span className="text-[#ffb300] font-bold">78.5%</span>
                  </div>
                  <div className="w-full bg-[#111f38]/40 h-1 border border-[#1e3a60]/30 overflow-hidden rounded">
                    <div className="bg-[#ffb300] h-full w-[78.5%] shadow-[0_0_8px_rgba(255,179,0,0.5)]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[9.5px] items-center mb-1">
                    <span className="text-gray-400">CYBER SHIELD INTEGRITY</span>
                    <span className="text-red-500 font-bold animate-pulse">45.2%</span>
                  </div>
                  <div className="w-full bg-[#111f38]/40 h-1 border border-[#1e3a60]/30 overflow-hidden rounded">
                    <div className="bg-red-500 h-full w-[45.2%] shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-[#00e5ff]/35 leading-normal border-t-[0.5px] border-[#1e3a60]/30 pt-4 uppercase z-10 relative">
            // orbital assets synchronized. <br/>
            latitude parameters mapped to military coordinates grid.
          </div>
        </div>

        {/* Floating Absolute Center: WebGL Globe occupies the majestic screen focal core */}
        <div id="intro-globe-wrapper" className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <WebGLGlobe ref={globeRef} rotSpeed={speed} elapsedMs={elapsedMs} />
        </div>

        {/* Right Telemetry Column - Pushed to the edges to frame the exquisite planet rendering */}
        <div id="intro-sidebar-right" className="hidden md:flex flex-col justify-between w-[220px] lg:w-[280px] bg-gradient-to-l from-[#02050b]/98 via-[#02050b]/90 to-transparent border-l-[0.5px] border-[#1e3a60]/30 p-6 z-10 backdrop-blur-[2px] text-right relative shadow-[-10px_0_35px_rgba(0,0,0,0.5)]">
          {/* Confined scanline overlay strictly inside the panel area to avoid overlaying & softening the central globe */}
          <div className="scanlines absolute inset-0 pointer-events-none opacity-10 z-0" />

          <div className="space-y-6 z-10 relative">
            <div className="border-[0.5px] border-[#1a355e]/50 bg-[#03070f]/92 p-4 rounded-md relative text-left shadow-[0_10px_25px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-300 hover:border-[#1a355e]/85">
              <div className="absolute top-0 left-0 w-12 h-[1px] bg-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.7)]" />
              <div className="absolute top-0 left-0 w-[1px] h-12 bg-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.7)]" />
              
              <h3 className="text-[10px] font-bold uppercase text-[#00e5ff] tracking-widest border-b-[0.5px] border-[#1e3a60]/30 pb-1.5 mb-2.5 flex justify-between">
                <span>✦ Conflict Monitors</span>
                <span className="text-red-500 animate-pulse font-extrabold">● MONITOR</span>
              </h3>
              
              <div className="space-y-2.5">
                {[
                  { name: 'LEVANT BASIN', status: 'RED ALERT', val: 'CRITICAL' },
                  { name: 'EURO_SECTOR', status: 'AMBER WARNING', val: 'HIGH_STAGE' },
                  { name: 'TAIWAN STRAIT', status: 'CRITICAL SHIELD', val: 'OVERCAP' },
                  { name: 'DMZ KOREA', status: 'DEPLOYING', val: 'TENSION' }
                ].map((th) => (
                  <div key={th.name} className="border border-[#1a355e]/30 bg-[#030814]/90 rounded p-2.5 text-xs transition-colors hover:bg-[#060e22]/90">
                    <div className="flex justify-between items-center text-[9.5px]">
                      <span className="font-bold text-[#ffb300]">{th.name}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${th.val === 'CRITICAL' ? 'bg-red-955/80 text-red-500 border border-red-900/40 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.4)]' : 'bg-blue-950/60 text-[#a4c2f4]'}`}>
                        {th.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-[0.5px] border-[#1a355e]/50 bg-[#03070f]/92 p-4 rounded-md relative text-left shadow-[0_10px_25px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-300 hover:border-[#1a355e]/85">
              <h3 className="text-[10px] font-bold uppercase text-[#ff3355] tracking-widest border-b-[0.5px] border-[#1e3a60]/30 pb-1.5 mb-2.5">
                ✦ Satellite Lock Signals
              </h3>
              <div className="font-mono text-[9.5px] text-gray-400 leading-relaxed uppercase">
                LAT: <span className="text-white font-medium">23.504° N</span><br/>
                LON: <span className="text-white font-medium">121.056° E</span><br/>
                SECTOR: <span className="text-[#ff3355] font-bold">WEST TAIWAN STRAIT</span><br/>
                ALTITUDE: <span className="text-[#00e5ff] font-medium">35,786 KM (GLOBAL-LOCK)</span>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-[#00e5ff]/35 leading-normal border-t-[0.5px] border-[#1e3a60]/30 pt-4 uppercase text-right z-10 relative">
            // surveillance encryption keys active. <br/>
            nuclear defense deterrence codes verified.
          </div>
        </div>
      </div>

      {/* Floating Briefing Overlay & Progress Indicators */}
      {currentPhaseIndex >= 0 && (
        <div className="absolute left-6 bottom-[220px] z-20 pointer-events-none md:pointer-events-auto">
          <ClassifiedBriefingPanel
            lines={currentPhase?.briefingLines ?? []}
            currentPhase={currentPhase?.label ?? 'UPLINK'}
          />
        </div>
      )}

      <div className="absolute left-1/2 -translate-x-1/2 bottom-[215px] z-30 w-full max-w-[500px] px-6">
        <IntroProgressBar
          elapsedMs={elapsedMs}
          totalMs={30000}
          onSkip={handleSkipBriefing}
        />
      </div>

      {/* Narrative Decryption terminal and entry actions */}
      <div id="intro-control-terminal" className="h-[200px] bg-[#020408]/98 border-t-[0.5px] border-[#1e3a60]/45 flex flex-col justify-between p-6 z-10 backdrop-blur-md relative gap-4 shadow-[0_-5px_25px_rgba(0,0,0,0.9)]">
        {/* Soft terminal scanlines */}
        <div className="scanlines absolute inset-0 pointer-events-none opacity-8 z-0" />

        {/* Dynamic Typewriter terminal block */}
        <div className="flex-1 max-w-[1200px] mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-center z-10 relative">
          
          <div className="hidden lg:flex flex-col gap-1.5 opacity-80">
            <div className="text-[10px] font-bold text-[#00e5ff] tracking-wider uppercase">
              ✦ SECURE CHANNELS OVERWATCH
            </div>
            <p className="text-[9.5px] leading-relaxed text-gray-400">
              The Geopolitical Defense matrix is decrypting real-time satellite intercepts. Command staff is ordered to analyze regional flashpoints immediately upon system ingress.
            </p>
          </div>

          {/* Actual typewriter feed container */}
          <div className="col-span-1 lg:col-span-2 border-[0.5px] border-[#1a355e]/60 bg-[#010306]/98 p-4 rounded-lg relative overflow-hidden h-[110px] custom-scrollbar text-left flex flex-col justify-between shadow-[inset_0_0_15px_rgba(0,0,0,0.95)]">
            <div className="text-[9px] uppercase font-bold text-[#ffb300] tracking-widest border-b-[0.5px] border-[#1e3a60]/30 pb-1.5 mb-2 flex justify-between">
              <span>📡 ACTIVE SIGNAL INTERCEPT INBOUND</span>
              <span className="text-[#00e5ff] animate-pulse font-bold">● DECRYPTION ACTIVE</span>
            </div>
            <pre className="text-[10.5px] leading-relaxed text-[#00e5ff] whitespace-pre-wrap font-mono h-[70px] overflow-y-auto overflow-x-hidden scrollbar-thin">
              {currentPhase ? currentPhase.briefingLines.join('\n') : '>>> ESTABLISHING ULTRALINK TO SECURE SATELLITE CHANNELS...'}
            </pre>
          </div>
        </div>

        {/* Command deck footer actions */}
        <div className="w-full flex justify-between items-center border-t-[0.5px] border-[#1e3a60]/30 pt-4 mt-2 z-10 relative">
          <span className="text-[9px] text-[#ffb300]/65 tracking-wider uppercase font-medium">
            CLASSIFIED // EYES ONLY // STAGE CONGRUENCE // TERMINAL ID_COSMIC-91
          </span>
          
          <AnimatePresence mode="wait">
            {act === 4 ? (
              <motion.button
                key="enter-command-btn"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={handleEnterLobby}
                className="px-10 py-3 border border-[#00e5ff] bg-[#00e5ff]/12 hover:bg-[#00e5ff]/30 text-[#00e5ff] transition-all duration-300 text-xs tracking-widest font-bold cursor-pointer rounded shadow-[0_0_25px_rgba(0,229,255,0.35)] uppercase select-none font-mono outline-none motion-safe:animate-pulse"
              >
                EXECUTE STRATEGIC COMMAND INGRESS &gt;&gt;
              </motion.button>
            ) : (
              <motion.button
                key="skip-briefing-btn"
                initial={{ opacity: 1 }}
                onClick={handleSkipBriefing}
                className="px-6 py-2 border border-[#1e3a60]/80 text-[#00e5ff]/80 hover:border-[#00e5ff] hover:bg-[#040c1a] hover:text-[#00e5ff] transition-all duration-300 rounded text-[10px] tracking-widest cursor-pointer uppercase font-bold"
              >
                SKIP INTEL BRIEFING
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CinematicIntro;
