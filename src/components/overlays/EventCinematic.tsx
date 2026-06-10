import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../../utils/audio';

export type CinematicType = 
  | 'NUCLEAR_DETONATION'
  | 'WAR_DECLARATION'
  | 'COUP_DETAT'
  | 'SOVEREIGN_DEFAULT'
  | 'DEFCON_CHANGE'
  | 'SCENARIO_WIN'
  | 'SCENARIO_LOSS';

export interface CinematicEvent {
  id: string;
  type: CinematicType;
  data: {
    countryA?: string;
    countryB?: string;
    weaponType?: string;
    yieldMT?: number;
    newDefcon?: number;
    message?: string;
    debtAmount?: number;
  };
  durationMs: number;
}

interface EventCinematicProps {
  activeEvent: CinematicEvent | null;
  onComplete: () => void;
}

export const EventCinematic: React.FC<EventCinematicProps> = ({ activeEvent, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (!activeEvent) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adapt size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animId: number;
    const start = Date.now();
    const duration = activeEvent.durationMs;

    setShowText(false);
    const textTimer = setTimeout(() => setShowText(true), 500);

    // Initial triggers based on event type
    if (activeEvent.type === 'NUCLEAR_DETONATION') {
      audio.sfxMissileImpact();
    } else if (activeEvent.type === 'WAR_DECLARATION') {
      audio.sfxKlaxon();
    } else if (activeEvent.type === 'COUP_DETAT') {
      audio.sfxFactionAlert();
    } else if (activeEvent.type === 'SOVEREIGN_DEFAULT') {
      audio.sfxMarketCrash();
    } else if (activeEvent.type === 'DEFCON_CHANGE') {
      audio.sfxRadarPing();
    } else if (activeEvent.type === 'SCENARIO_WIN') {
      audio.sfxUNVote();
    } else if (activeEvent.type === 'SCENARIO_LOSS') {
      audio.sfxKlaxon();
    }

    const drawFrame = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Type-specific canvas renderings (Section 10.2)
      if (activeEvent.type === 'NUCLEAR_DETONATION') {
        // Core flashing screen (0-500ms whiteout)
        if (elapsed < 500) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          // Nuclear Fireball expansion
          const nProg = (elapsed - 500) / (duration - 500);
          ctx.fillStyle = '#020202';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Expansive ring
          const radius = nProg * 350;
          const auraRad = nProg * 450;
          
          const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, auraRad);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.2, '#ffdd44');
          grad.addColorStop(0.5, 'rgba(255, 34, 68, 0.85)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, auraRad, 0, Math.PI * 2);
          ctx.fill();

          // Draw dark orange/amber mushroom cloud silhouette (0.4+ progress)
          if (nProg > 0.3) {
            ctx.fillStyle = 'rgba(25, 12, 5, 0.9)';
            ctx.strokeStyle = '#ff3344';
            ctx.lineWidth = 1;
            // stem
            ctx.beginPath();
            ctx.ellipse(cx, cy + 100, 35, 120, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // cap cloud
            ctx.beginPath();
            ctx.ellipse(cx, cy - 30, 160, 70, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Scan line noises overlay
          ctx.fillStyle = 'rgba(255, 34, 68, 0.08)';
          for (let y = 0; y < canvas.height; y += 4) {
            ctx.fillRect(0, y + (elapsed % 10), canvas.width, 1.5);
          }
        }

      } else if (activeEvent.type === 'WAR_DECLARATION') {
        const angle = progress * Math.PI * 0.25;
        // Two sliding background columns representing armies
        ctx.fillStyle = 'rgba(255, 34, 68, 0.12)';
        ctx.fillRect(0, 0, cx - 100 + (1 - progress) * 200, canvas.height);
        ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
        ctx.fillRect(cx + 100 - (1 - progress) * 200, 0, canvas.width, canvas.height);

        // Render huge crossed swords in yellow/amber at center
        ctx.strokeStyle = '#ff6b00';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#ffb300';
        ctx.shadowBlur = 10;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-150, 0); ctx.lineTo(150, 0);
        ctx.moveTo(-120, -20); ctx.lineTo(-120, 20);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-angle - 0.2);
        ctx.beginPath();
        ctx.moveTo(-150, 0); ctx.lineTo(150, 0);
        ctx.moveTo(-120, -20); ctx.lineTo(-120, 20);
        ctx.stroke();
        ctx.restore();
        
        ctx.shadowBlur = 0;

      } else if (activeEvent.type === 'COUP_DETAT') {
        // regime change scan grids
        ctx.strokeStyle = 'rgba(255, 179, 0, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 60) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 60) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Radar targeting lock crosshairs sweeping
        ctx.strokeStyle = '#ff6b00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 140 + Math.sin(progress * 10) * 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 200, cy); ctx.lineTo(cx + 200, cy);
        ctx.moveTo(cx, cy - 200); ctx.lineTo(cx, cy + 200);
        ctx.stroke();

      } else if (activeEvent.type === 'SOVEREIGN_DEFAULT') {
        // Stock numbers falling cascading
        ctx.fillStyle = '#ff2244';
        ctx.font = '11px monospace';
        for (let i = 0; i < 40; i++) {
          const x = (i * 45) % canvas.width;
          const y = ((progress * 1.5 * canvas.height) + (i * 24)) % canvas.height;
          ctx.fillText(`$${(Math.random() * -100).toFixed(2)}%`, x, y);
        }

        // Sharding geometric center cracked dollar sign
        ctx.font = '72px monospace';
        ctx.fillStyle = '#ff2244';
        ctx.shadowColor = '#ff2244';
        ctx.shadowBlur = 10;
        ctx.fillText('$', cx - 20, cy - 20);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 50, cy - 80); ctx.lineTo(cx + 50, cy + 40);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (activeEvent.type === 'DEFCON_CHANGE') {
        // Draw expanding neon rings
        ctx.strokeStyle = activeEvent.data.newDefcon === 1 ? '#ff2244' : '#ffb300';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, progress * 400, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (elapsed < duration) {
        animId = requestAnimationFrame(drawFrame);
      } else {
        onComplete();
      }
    };

    drawFrame();

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(textTimer);
    };
  }, [activeEvent]);

  if (!activeEvent) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black flex items-center justify-center select-none font-mono">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Cinematic Details & Information Stamps (Fades in) */}
      {showText && (
        <div className="relative z-10 w-full max-w-2xl px-8 py-10 bg-black/85 border-2 border-[#1a5c1a] rounded text-center backdrop-blur shadow-2xl animate-fade-in animate-hud-switch">
          
          <div className="text-[10px] tracking-widest text-[#00e5ff] font-bold border-b border-[#1a5c1a]/50 pb-2 mb-6 uppercase flex justify-between select-none">
            <span>📡 SOVEREIGN RECORD_SIGNAL FEED LOG</span>
            <span className="text-red-500 animate-pulse font-bold">● CLASSIFIED DIRECTIVES LIVE</span>
          </div>

          <div className="space-y-4 my-8">
            {activeEvent.type === 'NUCLEAR_DETONATION' && (
              <>
                <h1 className="text-3xl font-display font-bold text-red-500 tracking-wider uppercase animate-pulse">
                  NUCLEAR EXCHANGE CONFIRMED
                </h1>
                <p className="text-xs text-[#ffb300] uppercase tracking-widest leading-relaxed">
                  TACTICAL ORBIT SCAN: {activeEvent.data.weaponType} IMPACT AT COGNATE {activeEvent.data.countryB}!
                </p>
                <div className="h-[1px] bg-[#220808] my-4" />
                <div className="grid grid-cols-2 text-left text-[11px] text-gray-500 uppercase">
                  <div>WARHEAD YIELD: <span className="text-white font-bold">{activeEvent.data.yieldMT} MEGATONS</span></div>
                  <div>THERMAL SIGNATURE: <span className="text-red-500 font-bold">CATASTROPHIC BLAST</span></div>
                </div>
              </>
            )}

            {activeEvent.type === 'WAR_DECLARATION' && (
              <>
                <h1 className="text-3xl font-display font-medium text-orange-500 tracking-wider uppercase">
                  ⚔ DECLARATION OF WAR
                </h1>
                <p className="text-xs text-white uppercase tracking-widest leading-relaxed pt-2">
                  THE SOVEREIGN STATE OF <span className="text-red-500 font-bold">{activeEvent.data.countryA}</span> HAS DECLARED THE START OF ACTIVE WARS ON <span className="text-cyan-400 font-bold">{activeEvent.data.countryB}</span>.
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                  Opinion matrix aligns to hostile parameters immediately of state lines.
                </p>
              </>
            )}

            {activeEvent.type === 'COUP_DETAT' && (
              <>
                <h1 className="text-3xl font-display font-bold text-[#ffb300] tracking-wider uppercase">
                  REGIME CHANGE DETECTED
                </h1>
                <p className="text-xs text-white uppercase tracking-widest leading-relaxed pt-2">
                  COUP D'ETAT COMPLETED IN <span className="text-[#ffb300] font-bold">{activeEvent.data.countryA}</span>.
                </p>
                <p className="text-[10px] text-gray-400 max-w-md mx-auto leading-relaxed border border-[#ffb300]/20 p-2 bg-[#1c150c]/50">
                  Government cabinets have been looted, regime cabinets reshuffled, and foreign advisors expelled immediately.
                </p>
              </>
            )}

            {activeEvent.type === 'SOVEREIGN_DEFAULT' && (
              <>
                <h1 className="text-3xl font-display font-bold text-red-500 tracking-wider uppercase animate-bounce">
                  💳 SOVEREIGN BANK DECREE DEFAULT
                </h1>
                <p className="text-xs text-white uppercase tracking-widest leading-relaxed pt-2">
                  COGNATE {activeEvent.data.countryA} HAS ANNOUNCED UNILATERAL SYSTEM DEFAULT.
                </p>
                <p className="text-[10px] text-gray-400 leading-normal border border-red-500/20 p-2 bg-[#200808]/50">
                  Global currency strength is depleted, bonds called. International rating degraded to D-status.
                </p>
              </>
            )}

            {activeEvent.type === 'DEFCON_CHANGE' && (
              <>
                <h1 className="text-[28px] font-display font-bold tracking-widest text-[#00ff44] uppercase leading-none">
                  DEFCON POSTURE ADJUSTMENT
                </h1>
                <p className="text-xs text-white uppercase tracking-widest leading-relaxed mt-4">
                  Tactical warning has scaled defence triggers to <span className="text-red-500 font-bold">DEFCON {activeEvent.data.newDefcon}</span>.
                </p>
              </>
            )}

            {activeEvent.type === 'SCENARIO_WIN' && (
              <>
                <h1 className="text-3xl font-display font-bold text-green-400 tracking-wider uppercase animate-pulse">
                  🏆 CAMPAIGN PROTOCOL COMPLETED
                </h1>
                <p className="text-xs text-gray-300 uppercase tracking-widest leading-relaxed pt-2">
                  {activeEvent.data.message || 'Geopolitical equilibrium restored successfully under supreme commander guidelines!'}
                </p>
              </>
            )}

            {activeEvent.type === 'SCENARIO_LOSS' && (
              <>
                <h1 className="text-3xl font-display font-bold text-red-500 tracking-wider uppercase">
                  ⚠️ OPERATION CRITICAL FAILED
                </h1>
                <p className="text-xs text-red-400 uppercase tracking-widest leading-relaxed pt-2">
                  {activeEvent.data.message || 'Strategic nuclear exchange occurred. Tactical casualties estimate surpasses threshold index.'}
                </p>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-[#1a5c1a]/50 text-center select-none">
            <span className="text-[9px] text-gray-600 block animate-pulse">
              WAITING FOR TRANSMISSION COMPLETE...
            </span>
          </div>

        </div>
      )}
    </div>
  );
};

export default EventCinematic;
