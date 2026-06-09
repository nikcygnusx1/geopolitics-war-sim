import React from 'react';

interface GlowSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  unit?: string;
  color?: 'green' | 'amber' | 'red' | 'cyan';
}

export default function GlowSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  color = 'green',
}: GlowSliderProps) {
  const colorMap = {
    green: {
      text: 'text-phosphor-green',
      accent: 'accent-[#00ff44]',
    },
    amber: {
      text: 'text-phosphor-amber',
      accent: 'accent-[#ffb300]',
    },
    red: {
      text: 'text-phosphor-red',
      accent: 'accent-[#ff2244]',
    },
    cyan: {
      text: 'text-phosphor-cyan',
      accent: 'accent-[#00e5ff]',
    },
  };

  const choice = colorMap[color];

  return (
    <div className="flex flex-col gap-1 w-full text-xs py-1">
      <div className="flex justify-between items-center text-[10px] tracking-wider uppercase opacity-85">
        <span className={choice.text}>{label}</span>
        <span className="font-mono">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full bg-[#0d1f0d] border border-[#1a3a1a] h-1 rounded outline-none ${choice.accent} cursor-pointer`}
      />
    </div>
  );
}
