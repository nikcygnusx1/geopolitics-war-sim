import React from 'react';
import { useWorldStore } from '../../store/worldStore';

export default function DataTicker() {
  const markets = useWorldStore((s) => s.commodityMarkets);
  const globalEventLog = useWorldStore((s) => s.globalEventLog);

  // Take the last 3 events to cycle
  const recentEvents = globalEventLog.slice(0, 3).map((e) => `[TICK ${e.tick}] ${e.text}`);
  const eventText = recentEvents.length > 0 ? recentEvents.join('  •  ') : 'Sovereign systems monitoring nominal...';

  return (
    <div className="w-full bg-[#040804] border-y border-[#1a3a1a] h-7 flex items-center overflow-hidden text-[10px] font-mono tracking-wide">
      {/* Ticker label */}
      <div className="bg-[#1a4a1a] text-[#00ff44] px-3 py-1 font-bold shrink-0 uppercase border-r border-[#1a3a1a] z-10 select-none">
        LIVE WIRE
      </div>

      {/* Marquee Wrapper */}
      <div className="flex flex-1 items-center gap-12 animate-[marquee_25s_linear_infinite] whitespace-nowrap overflow-visible">
        {/* Commodities price printout */}
        <div className="flex gap-6 text-[#00e5ff] shrink-0">
          {markets.map((m) => {
            const hasShock = m.supplyShockActive;
            const priceStr = `$${m.spotPriceUSD.toFixed(1)}`;
            return (
              <span key={m.type} className="flex gap-1 items-center">
                <span className="text-gray-400 font-semibold">{m.type}:</span>
                <span className={hasShock ? 'text-phosphor-red font-bold' : 'text-phosphor-cyan'}>
                  {priceStr}
                </span>
                {hasShock && <span className="text-xs text-phosphor-red animate-pulse">▲</span>}
              </span>
            );
          })}
        </div>

        {/* Global Events wire crawl */}
        <div className="text-[#ffb300] shrink-0 flex gap-2 items-center">
          <span className="text-gray-400 uppercase font-semibold">CRAWL:</span>
          <span>{eventText}</span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
    </div>
  );
}
