import React, { useEffect, useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { audio } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

interface FlashEvent {
  id: string;
  text: string;
  severity: string;
}

export default function FlashPrecedenceBanner() {
  const globalEventLog = useWorldStore(s => s.globalEventLog);
  const [queue, setQueue] = useState<FlashEvent[]>([]);
  const [processedLogSize, setProcessedLogSize] = useState(0);
  const [typedText, setTypedText] = useState('');

  // Process new events natively using an effect that compares log diffs locally for UI extraction
  useEffect(() => {
    if (globalEventLog.length > processedLogSize) {
      const newEvents = globalEventLog.slice(0, globalEventLog.length - processedLogSize).reverse(); // Get latest
      
      const flashEvents: FlashEvent[] = [];
      newEvents.forEach((evt) => {
        const textLower = evt.text.toLowerCase();
        const isCritical = evt.severity === 'CRITICAL';
        const hasTriggerWord = textLower.includes('nuclear') || textLower.includes('launch') || textLower.includes('collapse') || textLower.includes('war');
        
        if (isCritical || hasTriggerWord) {
          flashEvents.push({
            id: Math.random().toString(36).substring(2, 9),
            text: evt.text,
            severity: evt.severity || 'CRITICAL'
          });
        }
      });

      if (flashEvents.length > 0) {
        setQueue(prev => [...prev, ...flashEvents]);
        
        // Play alert if new items arrived
        const hasNuke = flashEvents.some(e => e.text.toLowerCase().includes('nuclear'));
        if (hasNuke) {
          audio.sfxNuclearAlarm();
        } else {
          audio.sfxCrisisWarning();
        }
      }

      setProcessedLogSize(globalEventLog.length);
    }
  }, [globalEventLog, processedLogSize]);

  // Handle Typewriter effect for the active message
  const activeEvent = queue[0];

  useEffect(() => {
    if (!activeEvent) {
      setTypedText('');
      return;
    }

    let i = 0;
    setTypedText('');
    const fullText = activeEvent.text.toUpperCase();
    const interval = setInterval(() => {
      setTypedText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 15);

    return () => clearInterval(interval);
  }, [activeEvent]);

  if (!activeEvent) return null;

  const handleAck = () => {
    audio.sfxKeyClick();
    setQueue(prev => prev.slice(1));
  };

  return (
    <AnimatePresence>
      <motion.div
        key={activeEvent.id}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="fixed top-16 left-0 w-full z-40 bg-[#000] border-t border-b border-[#ffae00] shadow-[0_10px_30px_rgba(255,174,0,0.2)] font-mono text-sm uppercase overflow-hidden"
      >
        {/* HAZARD STRIPES */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ffae00, #ffae00 10px, #000 10px, #000 20px)' }}></div>
        <div className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ffae00, #ffae00 10px, #000 10px, #000 20px)' }}></div>
        
        <div className="flex w-full items-stretch py-2 px-6 h-12">
          {/* LEFT: BADGE */}
          <div className="flex items-center gap-4 shrink-0 text-[#ffae00] font-black tracking-[0.2em] animate-pulse border-r border-[#ffae00]/30 pr-6 mr-6">
            <span className="text-xl">⚠️</span>
            <span>FLASH PRECEDENCE</span>
          </div>

          {/* CENTER: TYPEWRITER TEXT */}
          <div className="flex-1 flex items-center overflow-hidden">
            <span className="text-red-400 font-bold whitespace-nowrap overflow-hidden pr-4">{typedText}</span>
            {typedText.length < activeEvent.text.length && (
              <span className="inline-block w-2 h-4 bg-[#ffae00] animate-ping ml-1" />
            )}
          </div>

          {/* RIGHT: ACK BUTTON */}
          <div className="flex items-center gap-4 pl-4 border-l border-[#ffae00]/30 shrink-0">
             {queue.length > 1 && (
               <div className="text-[10px] text-[#ffae00] font-bold mr-4">
                 + {queue.length - 1} PENDING
               </div>
             )}
             <button
               onClick={handleAck}
               className="bg-[#ffae00] text-black font-black px-6 py-1 hover:bg-white transition-colors flex items-center gap-2"
             >
               ACKNOWLEDGE <span className="opacity-70">[ Z ]</span>
             </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
