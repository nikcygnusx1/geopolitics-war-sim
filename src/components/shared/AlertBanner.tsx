import React from 'react';
import { useUIStore } from '../../store/uiStore';

export default function AlertBanner() {
  const alerts = useUIStore((s) => s.alerts);
  const dismissAlert = useUIStore((s) => s.dismissAlert);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto">
      {alerts.map((a) => {
        let borderClass = 'border-[#00ff44] bg-[#021c02] text-[#00ff44]';
        if (a.type === 'WARNING') borderClass = 'border-[#ffb300] bg-[#1d1400] text-[#ffb300]';
        if (a.type === 'DANGER') borderClass = 'border-[#ff2244] bg-[#1a0004] text-[#ff2244] animate-pulse';

        return (
          <div
            key={a.id}
            className={`border p-3 rounded shadow-md flex flex-col gap-1 text-xs font-mono relative backdrop-blur-sm ${borderClass}`}
          >
            <div className="flex justify-between items-center font-bold tracking-wider">
              <span>⚠️ {a.title}</span>
              <button
                onClick={() => dismissAlert(a.id)}
                className="hover:text-white font-black cursor-pointer text-[10px] ml-4 font-mono select-none"
              >
                [X]
              </button>
            </div>
            <p className="opacity-80 leading-normal text-[11px]">
              {a.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}
