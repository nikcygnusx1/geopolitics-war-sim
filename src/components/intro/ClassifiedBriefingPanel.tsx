import React, { useEffect, useState, useRef } from 'react';

export interface ClassifiedBriefingPanelProps {
  lines: string[];
  currentPhase: string;
}

export const ClassifiedBriefingPanel: React.FC<ClassifiedBriefingPanelProps> = ({
  lines,
  currentPhase,
}) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Typewriter effect: 28ms per character, 220ms pause between lines
  useEffect(() => {
    if (lineIndex >= lines.length) return;

    const targetLine = lines[lineIndex];
    if (charIndex < targetLine.length) {
      intervalRef.current = setInterval(() => {
        setCharIndex((i) => i + 1);
        setCurrentLine(targetLine.slice(0, charIndex + 1));
      }, 20); // Sharp, responsive typing
    } else {
      // Line complete — pause then move to next
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => [...prev, targetLine]);
        setCurrentLine('');
        setCharIndex(0);
        setLineIndex((i) => i + 1);
      }, targetLine === '' ? 100 : 220);
      return () => clearTimeout(timer);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lineIndex, charIndex, lines]);

  // Reset when lines prop changes (phase transition)
  useEffect(() => {
    setDisplayedLines([]);
    setCurrentLine('');
    setLineIndex(0);
    setCharIndex(0);
  }, [lines]);

  const PHASE_COLORS = {
    'UPLINK':      '#00e5c8',
    'CONFLICTS': '#ff3b4e',
    'MILITARY':  '#f5a623',
    'NUCLEAR':   '#00cfff',
    'ECONOMIC':  '#39d98a',
    'ASSIGNMENT': '#00e5c8',
  };
  const accentColor = PHASE_COLORS[currentPhase as keyof typeof PHASE_COLORS] || '#00e5c8';

  return (
    <div 
      id="classified-briefing-panel"
      className="fixed left-6 bottom-24 w-[340px] md:w-[380px] z-20 pointer-events-none select-none font-mono"
    >
      {/* Phase header */}
      <div 
        className="text-[9px] font-bold tracking-[0.22em] mb-3.5 px-3 py-1.5 border uppercase inline-block text-left transition-all duration-300"
        style={{
          color: accentColor,
          borderColor: `${accentColor}80`,
          backgroundColor: `${accentColor}0a`,
          boxShadow: `0 0 12px ${accentColor}25`,
        }}
      >
        ▶ {currentPhase} // INTEL STREAM ACTIVE
      </div>

      {/* Terminal Backdrop panel for readability */}
      <div className="bg-[#02050aa5] border border-[#1e3a60]/20 p-4 rounded backdrop-blur-[4px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {/* Previous lines — dim */}
        <div className="space-y-1">
          {displayedLines.slice(-6).map((line, i) => {
            const opacity = 0.25 + i * 0.12;
            return (
              <div 
                key={i} 
                className="text-[10px] leading-relaxed transition-all duration-300"
                style={{
                  color: line.startsWith('▶') ? accentColor
                       : line.startsWith('⚠') ? '#ff3b4e'
                       : `rgba(${hexToRgb(accentColor)}, ${opacity})`,
                  letterSpacing: '0.06em',
                  textShadow: i === displayedLines.slice(-6).length - 1 ? `0_0_8px_${accentColor}50` : 'none'
                }}
              >
                {line || '\u00A0'}
              </div>
            );
          })}

          {/* Active typewriter line */}
          {currentLine !== null && (lineIndex < lines.length) && (
            <div 
              className="text-[10px] leading-relaxed"
              style={{
                color: currentLine.startsWith('▶') ? accentColor
                     : currentLine.startsWith('⚠') ? '#ff3b4e'
                     : '#e8f0f2',
                letterSpacing: '0.06em',
                textShadow: `0 0 8px ${accentColor}80`,
              }}
            >
              {currentLine}
              <span 
                className="inline-block w-1.5 h-3.5 ml-1 align-middle animate-pulse" 
                style={{ backgroundColor: accentColor }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
