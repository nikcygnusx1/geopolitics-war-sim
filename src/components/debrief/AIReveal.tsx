import React from 'react';
import { Eye, ShieldAlert, Binary, Fingerprint } from 'lucide-react';
import { AIOperationLogEntry } from '../../types';

interface AIRevealProps {
  id: string;
  operations: AIOperationLogEntry[];
}

export const AIReveal: React.FC<AIRevealProps> = ({ id, operations }) => {
  // Take top 5 entries
  const displayedOps = (operations || []).slice(0, 5);

  if (displayedOps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-slate-950/45 border border-dashed border-slate-800/60 p-6 rounded" id={id}>
        <Eye className="w-8 h-8 text-slate-600 opacity-40 mb-2.5 animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          AI DECLASSIFICATION SIGNALS DEGRADED
        </span>
        <p className="text-[11px] text-slate-600 font-sans text-center mt-1.5 max-w-xs leading-relaxed">
          No tactical adversarial communications intercepts recorded in this campaign matrix.
        </p>
      </div>
    );
  }

  return (
    <div id={id} className="space-y-3.5 select-none">
      <div className="flex items-center gap-1.5 mb-2 font-mono text-[9px] text-slate-500 tracking-wider uppercase">
        <Binary className="w-3.5 h-3.5 text-rose-500/80" />
        <span>INTELLIGENCE INTERCEPTS DECLASSIFIED • ADVERSARY STRATEGIC TIMELINE</span>
      </div>

      {displayedOps.map((op, idx) => (
        <div
          key={idx}
          id={`ai-op-${idx}`}
          className="relative p-3.5 bg-slate-950 border border-slate-900 rounded-[2px] transition-all hover:bg-[#060b13] hover:border-slate-800"
        >
          {/* Subtle classification watermark */}
          <div className="absolute right-3 top-3 pointer-events-none opacity-10">
            <Fingerprint className="w-10 h-10 text-cyan-500" />
          </div>

          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span className="font-extrabold text-rose-500 uppercase tracking-tight">
                  [ INTERCEPT {idx + 1} ]
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-white font-bold uppercase">{op.countryName}</span>
                <span className="text-slate-600">→</span>
                <span className="font-semibold text-slate-400 capitalize">
                  {op.targetCountryName || 'Global Grid'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 font-sans font-semibold text-slate-300 text-xs">
                <span>{op.action}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 font-mono text-[8px] uppercase tracking-wide text-right">
              {op.tick !== undefined && (
                <span className="text-slate-500">INIT: TICK {op.tick}</span>
              )}
              <span className="flex items-center gap-1 text-slate-600">
                STATUS: <span className="text-emerald-500/90 font-semibold">[ DECLASSIFIED ]</span>
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-relaxed mt-2.5 max-w-[95%] antialiased italic border-l border-slate-800 pl-2.5">
            "{op.description}"
          </p>

          <div className="flex items-center gap-3.5 mt-3 font-mono text-[8px] text-slate-500 border-t border-slate-950 pt-2.5">
            <div className="flex items-center gap-1">
              <span className="tracking-tight text-slate-600">SECRECY LEVEL:</span>
              <div className="flex items-center gap-0.5">
                <span className="text-rose-400/90 font-bold">{op.secrecyScore}%</span>
                <span className="text-slate-700">|</span>
                <div className="flex gap-[1px]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-[6px] h-[3px] rounded-[1px] ${
                        i < Math.round(op.secrecyScore / 20) ? 'bg-rose-500/80' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="tracking-tight text-slate-600">IMPACT INDEX:</span>
              <div className="flex items-center gap-0.5">
                <span className="text-yellow-400/90 font-bold">{op.impactScore}%</span>
                <span className="text-slate-700">|</span>
                <div className="flex gap-[1px]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-[6px] h-[3px] rounded-[1px] ${
                        i < Math.round(op.impactScore / 20) ? 'bg-yellow-500/80' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {operations.length > 5 && (
        <p className="font-mono text-[8px] text-slate-500 text-center uppercase tracking-tight mt-1">
          + {operations.length - 5} ADDITIONAL ADVERSARY SUBVERSIONS REMAIN REDACTED IN ARCHIVE
        </p>
      )}
    </div>
  );
};
