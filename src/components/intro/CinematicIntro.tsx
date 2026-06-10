import React, { useEffect, useState } from 'react';
import { WebGLGlobe } from './WebGLGlobe';
import { audio } from '../../utils/audio';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [act, setAct] = useState<1 | 2 | 3 | 4>(1);
  const [briefedText, setBriefedText] = useState('');
  const [greenTint, setGreenTint] = useState(0);
  const [speed, setSpeed] = useState(0.001);

  const fullBriefingLines = [
    '> SIGNAL INTERCEPT: COVERT DECRYPTION STABLE',
    '> GEOPOLITICAL SCAN: 4 ACTIVE CONFLICTS DETECTED',
    '> DEFCON POSTURE: ELEVATED TO Watch STATUS',
    '> SPACE DEFENSE COMBAT CHANNELS: ACTIVE',
    '> COMMAND DECK: AUTHORIZED FOR INGRESS.',
    '█'
  ];

  useEffect(() => {
    // Start Audio
    audio.init();
    audio.startAmbient();

    // Act 1: Orbital (0s - 4s)
    const t2 = setTimeout(() => {
      setAct(2); // Incoming Signal
    }, 4000);

    // Act 2: Green tint transition starts (6s)
    const t3 = setTimeout(() => {
      setAct(3); // Green tint takeover
      setGreenTint(1.0);
      setSpeed(0.004); // briefly accelerate
      audio.sfxKlaxon();
    }, 6000);

    // Act 3: Slow down rotation & slide lobby in (8s)
    const t4 = setTimeout(() => {
      setSpeed(0.0006);
      setAct(4); // Trigger completion or go to select lobby
    }, 8500);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Act 2 & 3 Typewriter briefings
  useEffect(() => {
    if (act < 2) return;
    let lineIndex = 0;
    let charIndex = 0;
    let currentText = '';

    const interval = setInterval(() => {
      if (lineIndex < fullBriefingLines.length) {
        const line = fullBriefingLines[lineIndex];
        if (charIndex < line.length) {
          currentText += line[charIndex];
          setBriefedText(currentText);
          audio.sfxKeyClick();
          charIndex++;
        } else {
          currentText += '\n';
          setBriefedText(currentText);
          lineIndex++;
          charIndex = 0;
          audio.sfxRadarPing();
        }
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [act]);

  const handleEnterLobby = () => {
    audio.sfxKeyClick();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030503] flex flex-col justify-between overflow-hidden font-mono select-none">
      {/* Cinematic CRT Overlay screen lines */}
      <div className="scanlines absolute inset-0 pointer-events-none z-45" />

      {/* ACT 1: Top & Bottom Letterbox boundary bars */}
      <div className="h-[60px] bg-black border-b border-[#1a3a1a] flex items-center justify-between px-6 z-10">
        <span className="text-[10px] text-[#00ff44] tracking-widest uppercase font-bold glow-green">
          📡 OPERATIONAL CONTROL // LEVEL-5 CLEARANCE REQUIRED
        </span>
        <span className="text-[9px] text-[#88ffaa] opacity-60">
          NODE: PRE-SHIELD_B4
        </span>
      </div>

      {/* Main viewport rendering Earth */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <WebGLGlobe greenTintProgress={greenTint} rotSpeed={speed} />
      </div>

      {/* Act overlays and Text stamps */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        {act === 1 && (
          <div className="absolute top-[80px] left-12 animate-pulse">
            <h1 className="text-xl md:text-3xl font-display font-medium tracking-widest text-[#00ff44] glow-green uppercase">
              SOVEREIGN COMMAND SIMULATOR
            </h1>
            <p className="text-xs text-[#ffb300] tracking-widest mt-2 uppercase">
              Initializing Secure Link Node-9...
            </p>
          </div>
        )}

        {/* ACT 2: Signal targeting crosshair */}
        {act >= 2 && act < 4 && (
          <div className="absolute w-[240px] h-[240px] border border-[#ff2244]/30 rounded-full flex items-center justify-center animate-ping pointer-events-none">
            <div className="w-4 h-4 bg-[#ff2244] rounded-full" />
          </div>
        )}

        {/* ACT 2, 3: Typewriter signal logs container */}
        {act >= 2 && (
          <div className="absolute left-6 md:left-12 bottom-[100px] w-full max-w-[450px] p-6 border border-[#1a3a1a] bg-black/85 backdrop-blur shadow-2xl rounded text-left z-20">
            <div className="text-[9px] uppercase font-bold text-[#ffb300] tracking-widest border-b border-[#1a3a1a] pb-2 mb-4 flex justify-between">
              <span>📡 ACTIVE INCOMING INTERCEPT RECORD</span>
              <span className="text-red-500 animate-pulse font-bold">● CRISIS ELEVATION WATCH</span>
            </div>
            <pre className="text-[10px] leading-relaxed text-[#00ff44] whitespace-pre-wrap font-mono">
              {briefedText}
            </pre>
          </div>
        )}
      </div>

      {/* Skip/Ingress interaction controls */}
      <div className="h-[60px] bg-black border-t border-[#1a3a1a] flex items-center justify-between px-6 z-10">
        <span className="text-[9px] text-[#ffb300] tracking-wider uppercase font-medium">
          CLASSIFIED // EYES ONLY // CLEARANCE: COSMIC TOP SECRET
        </span>
        
        {act === 4 ? (
          <button
            onClick={handleEnterLobby}
            className="px-6 py-1.5 border border-[#00ff44] bg-[#00ff44]/10 text-[#00ff44] hover:bg-[#00ff44]/20 transition-all text-[11px] tracking-widest font-bold cursor-pointer rounded animate-bounce shadow-[0_0_12px_rgba(0,255,68,0.3)] glow-green"
          >
            ENTER TACTICAL COMMAND LOBBY &gt;&gt;
          </button>
        ) : (
          <button
            onClick={handleEnterLobby}
            className="px-4 py-1.5 border border-[#1a3a1a] text-[#00ff44] hover:border-[#00ff44] hover:bg-[#060f06] transition-colors rounded text-[10px] tracking-widest cursor-pointer uppercase font-bold"
          >
            SKIP BRIEFING
          </button>
        )}
      </div>
    </div>
  );
};

export default CinematicIntro;
