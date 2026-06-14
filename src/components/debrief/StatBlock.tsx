import React, { useState, useEffect } from 'react';

interface StatBlockProps {
  id: string;
  label: string;
  value: number;
  format?: 'number' | 'currency' | 'percent';
  icon: React.ReactNode;
  delayMs?: number;
}

export const StatBlock: React.FC<StatBlockProps> = ({
  id,
  label,
  value,
  format = 'number',
  icon,
  delayMs = 0,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 1200; // 1.2s smooth count-up
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad formula: progress * (2 - progress)
      const easeProgress = progress * (2 - progress);
      const current = Math.round(start + (end - start) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(animate);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delayMs]);

  // Format display numbers beautifully
  const formatDisplay = (num: number) => {
    if (format === 'currency') {
      return `$${num.toLocaleString()}B`;
    }
    if (format === 'percent') {
      return `${num}%`;
    }
    return num.toLocaleString();
  };

  return (
    <div
      id={id}
      className="flex items-center gap-3.5 p-3.5 border border-cyan-950/40 bg-slate-950/80 rounded-[2px] shadow-sm select-none transition-all hover:border-cyan-500/20"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-950/20 text-cyan-400 border border-cyan-800/20">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span className="font-sans text-xl font-bold tracking-tight text-white mt-0.5">
          {formatDisplay(displayValue)}
        </span>
      </div>
    </div>
  );
};
