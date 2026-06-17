import React, { useEffect, useRef } from 'react';
import { usePanelFx } from '../../hooks/usePanelFx';
import { FxEventType } from '../../store/fxStore';

export interface PanelFxShellProps {
  panelId: string;
  relevantFxTypes: FxEventType[];
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function PanelFxShell({
  panelId,
  relevantFxTypes,
  children,
  className = '',
  style = {},
}: PanelFxShellProps) {
  const panelFx = usePanelFx(panelId, relevantFxTypes);

  return (
    <div
      className={`relative ${className}`}
      style={{ ...style, position: 'relative' }}
    >
      {children}

      {/* FX OVERLAY LAYER */}
      {panelFx.isActive && (
        <div
          className="panel-fx-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 40,
            background: panelFx.backgroundTint,
            border: `1px solid ${panelFx.borderColor}`,
            boxShadow: `inset 0 0 ${panelFx.borderIntensity * 20}px ${
              panelFx.borderIntensity * 8
            }px ${panelFx.borderColor}55, 0 0 ${
              panelFx.borderIntensity * 30
            }px ${panelFx.borderColor}33`,
            borderRadius: 'inherit',
            animation: panelFx.isFlickering
              ? `panelFlicker ${panelFx.pulseSpeed} steps(2) infinite`
              : `panelPulse ${panelFx.pulseSpeed} ease-in-out infinite`,
            transition: 'all 0.4s ease',
          }}
        />
      )}

      {/* NOISE CANVAS LAYER */}
      {panelFx.isActive && panelFx.noiseOpacity > 0 && (
        <PanelNoiseCanvas
          opacity={panelFx.noiseOpacity}
          isGlitching={panelFx.isGlitching}
          eventType={panelFx.activeEvent?.type}
        />
      )}

      {/* EVENT LABEL BADGE */}
      {panelFx.isActive && (
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            right: 6,
            fontSize: '7px',
            fontFamily: 'monospace',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: panelFx.borderColor,
            opacity: 0.85,
            zIndex: 42,
            textShadow: `0 0 6px ${panelFx.borderColor}`,
            animation: 'panelLabelBlink 1.5s ease-in-out infinite',
          }}
        >
          {panelFx.eventLabel}
        </div>
      )}
    </div>
  );
}

interface PanelNoiseCanvasProps {
  opacity: number;
  isGlitching: boolean;
  eventType?: FxEventType;
}

function PanelNoiseCanvas({ opacity, isGlitching, eventType }: PanelNoiseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect?.width || canvas.clientWidth || 300;
      canvas.height = rect?.height || canvas.clientHeight || 200;
    };
    resize();

    // Determine noise colors
    let noiseColor = 'rgba(255, 255, 255, '; // Default greyish-white
    if (eventType === 'CYBER_ATTACK' || eventType === 'CYBER_BLACKOUT') {
      noiseColor = 'rgba(0, 255, 68, '; // Green phosphor
    } else if (eventType === 'NUCLEAR_DETONATION' || eventType === 'MISSILE_LAUNCH') {
      noiseColor = 'rgba(255, 120, 30, '; // White-orange
    }

    const drawNoise = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw pixel noise
      const density = 0.08; // 8% density is clean and looks highly designed
      const totalPixels = Math.floor(w * h * density);
      ctx.fillStyle = `${noiseColor}${opacity})`;

      for (let i = 0; i < totalPixels; i++) {
        const x = Math.floor(Math.random() * w);
        const y = Math.floor(Math.random() * h);
        ctx.fillRect(x, y, 1.2, 1.2);
      }

      // Draw static glitch horizontal lines if relevant or random chance
      if (isGlitching) {
        const lineCount = Math.floor(Math.random() * 2) + 1; // 1 to 2 lines
        for (let j = 0; j < lineCount; j++) {
          const lineY = Math.floor(Math.random() * h);
          const lineHeight = Math.floor(Math.random() * 2) + 1;
          const lineAlpha = (Math.random() * 0.15 + 0.05).toFixed(2);
          ctx.fillStyle = Math.random() > 0.5 ? `rgba(0, 255, 68, ${lineAlpha})` : `rgba(255, 255, 255, ${lineAlpha})`;
          ctx.fillRect(0, lineY, w, lineHeight);
        }
      }
    };

    const intervalId = setInterval(drawNoise, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [opacity, isGlitching, eventType]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 41,
        pointerEvents: 'none',
      }}
    />
  );
}

export default PanelFxShell;
