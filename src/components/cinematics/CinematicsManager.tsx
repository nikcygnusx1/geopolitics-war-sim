import React, { useEffect, useRef } from 'react';
import { useCinematicQueue } from './useCinematicQueue';
import { renderWarDeclaration } from './renderers/war';
import { renderNuclearLaunch } from './renderers/nuclear';
import { renderCoup } from './renderers/coup';
import { renderEconomicCollapse } from './renderers/economy';
import { renderPeaceAgreement } from './renderers/peace';

export default function CinematicsManager() {
  const activeCinematic = useCinematicQueue((s) => s.activeCinematic);
  const skipCurrent = useCinematicQueue((s) => s.skipCurrent);
  const finishCurrent = useCinematicQueue((s) => s.finishCurrent);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeCinematic) return;

    activeIdRef.current = activeCinematic.id;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frameNumber = 0;
    const startTime = performance.now();
    const duration = activeCinematic.duration;

    // Handle Window Resize dynamically
    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Main animation loop
    const tick = (now: number) => {
      // Ensure we are working on the same active cinematic
      if (activeIdRef.current !== activeCinematic.id) return;

      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      frameNumber++;

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Select corresponding rendering function
      switch (activeCinematic.type) {
        case 'WAR_DECLARATION':
          renderWarDeclaration(ctx, w, h, progress, activeCinematic.data, frameNumber);
          break;
        case 'NUCLEAR_LAUNCH':
          renderNuclearLaunch(ctx, w, h, progress, activeCinematic.data, frameNumber);
          break;
        case 'COUP':
          renderCoup(ctx, w, h, progress, activeCinematic.data, frameNumber);
          break;
        case 'ECONOMIC_COLLAPSE':
          renderEconomicCollapse(ctx, w, h, progress, activeCinematic.data, frameNumber);
          break;
        case 'PEACE_AGREEMENT':
          renderPeaceAgreement(ctx, w, h, progress, activeCinematic.data, frameNumber);
          break;
      }

      if (progress >= 1.0) {
        finishCurrent();
      } else {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);

    // Skip trigger (any keypress or mouse click)
    const handleSkip = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      skipCurrent();
    };

    window.addEventListener('keydown', handleSkip, { capture: true });
    window.addEventListener('mousedown', handleSkip, { capture: true });

    // Precise Cleanup phase
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleSkip, { capture: true });
      window.removeEventListener('mousedown', handleSkip, { capture: true });
    };
  }, [activeCinematic, skipCurrent, finishCurrent]);

  if (!activeCinematic) return null;

  return (
    <div
      id="cinematic-canvas-overlay"
      className="fixed inset-0 w-screen h-screen z-[99999] bg-black select-none pointer-events-auto overflow-hidden touch-none"
      style={{ cursor: 'pointer' }}
      title="PRESS ANY KEY OR CLICK TO SKIP CINEMATIC"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* Visual touch instructions in margins */}
      <div className="absolute bottom-4 right-4 text-[9px] font-mono font-black text-gray-500 tracking-widest animate-pulse pointer-events-none select-none uppercase">
        ⚡ PRESS ANY KEY / CLICK TO BYPASS TRANSMISSION ⚡
      </div>
    </div>
  );
}
