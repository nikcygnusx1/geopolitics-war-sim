import React from 'react';

interface HexGaugeProps {
  label: string;
  value: number; // 0-100
  color?: 'green' | 'amber' | 'red' | 'cyan';
  size?: number;
}

export default function HexGauge({
  label,
  value,
  color = 'green',
  size = 64,
}: HexGaugeProps) {
  const currentVal = Math.min(100, Math.max(0, value));
  const strokeDashoffset = 188 - (188 * currentVal) / 100; // circumference is 2 * PI * 30 ≈ 188

  const colors = {
    green: {
      stroke: 'stroke-[#00ff44]',
      text: 'text-[#00ff44]',
      glow: 'drop-shadow(0 0 3px rgba(0,255,68,0.5))',
    },
    amber: {
      stroke: 'stroke-[#ffb300]',
      text: 'text-[#ffb300]',
      glow: 'drop-shadow(0 0 3px rgba(255,179,0,0.5))',
    },
    red: {
      stroke: 'stroke-[#ff2244]',
      text: 'text-[#ff2244]',
      glow: 'drop-shadow(0 0 3px rgba(255,34,68,0.5))',
    },
    cyan: {
      stroke: 'stroke-[#00e5ff]',
      text: 'text-[#00e5ff]',
      glow: 'drop-shadow(0 0 3px rgba(0,229,255,0.5))',
    },
  };

  const selected = colors[color];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r="30"
            fill="transparent"
            stroke="rgba(26, 58, 26, 0.4)"
            strokeWidth="4"
          />
          {/* Active indicator */}
          <circle
            cx="40"
            cy="40"
            r="30"
            fill="transparent"
            className={`${selected.stroke} transition-all duration-500`}
            strokeWidth="5"
            strokeDasharray="188"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ filter: selected.glow }}
          />
        </svg>
        {/* Dynamic percentage label in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[11px] font-mono font-bold tracking-tighter ${selected.text}`}>
            {Math.round(currentVal)}%
          </span>
        </div>
      </div>
      <span className="text-[9px] uppercase tracking-wider text-gray-400 mt-1 font-mono text-center">
        {label}
      </span>
    </div>
  );
}
