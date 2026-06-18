import React, { useEffect, useState } from 'react';

export interface ClassifiedDocumentProps {
  classification: 'TOP SECRET' | 'SECRET' | 'CONFIDENTIAL' | 'UNCLASSIFIED';
  codewords?: string[];
  department?: string;
  children: React.ReactNode;
  className?: string; // Optional outer styling injection
  title?: string;
}

export const ClassifiedDocument: React.FC<ClassifiedDocumentProps> = ({
  classification,
  codewords = [],
  department = 'DEPARTMENT OF DEFENSE',
  children,
  className = '',
  title = ''
}) => {
  const [headerTyped, setHeaderTyped] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
    let i = 0;
    const fullText = `REFERENCE: ${Math.random().toString(36).substring(2, 10).toUpperCase()} // DECLASS: NEVER`;
    const interval = setInterval(() => {
      setHeaderTyped(fullText.substring(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const getStyle = () => {
    switch (classification) {
      case 'TOP SECRET': return { bg: 'bg-[#b91c1c]', text: 'text-red-100', border: 'border-red-900/50', label: 'TS//SCI' };
      case 'SECRET': return { bg: 'bg-[#b45309]', text: 'text-amber-100', border: 'border-amber-900/50', label: 'S//REL' };
      case 'CONFIDENTIAL': return { bg: 'bg-[#1e3a8a]', text: 'text-blue-100', border: 'border-blue-900/50', label: 'C//NOFORN' };
      default: return { bg: 'bg-[#27272a]', text: 'text-zinc-300', border: 'border-zinc-800', label: 'U' };
    }
  };

  const style = getStyle();

  return (
    <div className={`relative flex flex-col bg-[#050505] border-2 ${style.border} overflow-hidden shadow-2xl ${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* SCANLINE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-[100] opacity-[0.03]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }}></div>
      
      {/* VIGNETTE SOFT EDGES */}
      <div className="absolute inset-0 pointer-events-none z-[99] shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]"></div>

      {/* TOP CLASSIFICATION BANNER */}
      <div className={`w-full py-1 ${style.bg} ${style.text} flex justify-center items-center relative uppercase tracking-[0.3em] font-black text-xs sm:text-sm shadow-md z-10`}>
        <span className="opacity-90">{classification}</span>
        {codewords.length > 0 && (
          <span className="ml-3 border-l pl-3 border-current/30 opacity-75">{codewords.join(' // ')}</span>
        )}
      </div>

      <div className="flex-1 flex flex-col p-1">
        {/* HEADER METADATA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-2 border-b border-[#222] bg-[#0c0c0c] text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-widest relative">
           <div>{department}</div>
           <div className="flex items-center gap-2 mt-1 sm:mt-0">
             <span className="w-2 h-2 rounded-full bg-red-800 animate-pulse hidden sm:block" />
             <span>{headerTyped}</span>
           </div>
           {/* FILE STAMP */}
           <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none select-none text-4xl sm:text-6xl font-black rotate-[-12deg] text-red-600 whitespace-nowrap mix-blend-screen">
             {style.label}
           </div>
        </div>

        {/* INNER CONTENT RECEPTACLE */}
        <div className="flex-1 overflow-hidden p-2 relative bg-[#090909]">
           {children}
        </div>
      </div>

      {/* BOTTOM CLASSIFICATION BANNER */}
      <div className={`w-full py-1 sm:py-0.5 ${style.bg} ${style.text} flex justify-center items-center uppercase tracking-[0.3em] font-black text-[10px] sm:text-xs opacity-80 z-10`}>
        <span>{classification}</span>
      </div>
    </div>
  );
};
