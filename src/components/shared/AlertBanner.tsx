import React, { useEffect, useRef } from 'react';
import { useUIStore } from '../../store/uiStore';
import { audio } from '../../utils/audio';

export default function AlertBanner() {
  const alerts = useUIStore((s) => s.alerts);
  const dismissAlert = useUIStore((s) => s.dismissAlert);
  const lastAlertCountRef = useRef(alerts.length);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Handle alert sound effects and auto-expiration
  useEffect(() => {
    alerts.forEach((alert) => {
      if (!processedIdsRef.current.has(alert.id)) {
        processedIdsRef.current.add(alert.id);

        // Sound cues depending on alert severity
        if (alert.type === 'DANGER') {
          audio.sfxKlaxon();
        } else if (alert.type === 'WARNING') {
          audio.sfxFactionAlert();
        } else {
          audio.sfxRadarPing();
        }

        // Auto-dismiss alert after 5000ms
        setTimeout(() => {
          dismissAlert(alert.id);
          processedIdsRef.current.delete(alert.id);
        }, 5000);
      }
    });
    lastAlertCountRef.current = alerts.length;
  }, [alerts, dismissAlert]);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-12 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto select-none">
      {alerts.map((a) => {
        let borderClass = 'border-[#00ff44] bg-[#021c02]/90 text-[#00ff44] shadow-[0_0_15px_rgba(0,255,68,0.15)]';
        let badge = 'TACTICAL INFO';
        let soundSymbol = '📡';

        if (a.type === 'WARNING') {
          borderClass = 'border-[#ffb300] bg-[#1d1400]/90 text-[#ffb300] shadow-[0_0_15px_rgba(255,179,0,0.15)]';
          badge = 'DECREE WARNING';
          soundSymbol = '⚠️';
        }
        if (a.type === 'DANGER') {
          borderClass = 'border-[#ff2244] bg-[#1a0004]/90 text-[#ff2244] animate-pulse shadow-[0_0_20px_rgba(255,34,68,0.25)]';
          badge = 'CRITICAL DIRECTIVE';
          soundSymbol = '☢️';
        }

        return (
          <div
            key={a.id}
            className={`border-t-2 relative overflow-hidden p-3 rounded-b-md border-x border-b backdrop-blur-md flex flex-col gap-1.5 text-xs font-mono transition-all duration-300 transform translate-x-0 ${borderClass}`}
          >
            {/* Tech background Scanline layer */}
            <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-20" />

            <div className="flex justify-between items-center font-bold tracking-wider text-[10px]">
              <div className="flex items-center gap-1.5 uppercase">
                <span>{soundSymbol}</span>
                <span className="font-sans font-extrabold tracking-widest">{badge}</span>
              </div>
              <button
                onClick={() => {
                  audio.sfxKeyClick();
                  dismissAlert(a.id);
                  processedIdsRef.current.delete(a.id);
                }}
                className="hover:text-white hover:bg-current/10 px-1 rounded transition-all font-black cursor-pointer text-[9px]"
              >
                DISMISS [X]
              </button>
            </div>

            <div className="border-b border-current/10 pb-1 flex flex-col gap-0.5">
              <span className="font-extrabold uppercase tracking-wide text-[10px]">{a.title}</span>
              <p className="opacity-90 leading-tight text-[11px] font-sans">
                {a.message}
              </p>
            </div>

            <div className="flex justify-between items-center text-[7px] opacity-50 tracking-widest leading-none">
              <span>EST COM: NOMINAL</span>
              <span>STATE: RETRIEVING SECURE CORRELATION</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
