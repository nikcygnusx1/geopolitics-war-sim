import React, { useEffect, useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { useFxStore } from '../../store/fxStore';
import { audio } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

export default function WhiteFlashOverlay() {
  const nuclearExchangeOccurred = useWorldStore(s => s.nuclearExchangeOccurred);
  const activeFx = useFxStore(s => s.activeFx);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isBurning, setIsBurning] = useState(false);

  useEffect(() => {
    // Add dummy audio method if it doesn't exist
    if (!audio.sfxWhiteout) {
      audio.sfxWhiteout = () => { /* dummy */ };
    }

    const hasDetonationFx = activeFx.some(fx => fx.type === 'NUCLEAR_DETONATION');
    
    if (nuclearExchangeOccurred || hasDetonationFx) {
      if (!isFlashing && !isBurning) {
        setIsFlashing(true);
        audio.sfxWhiteout();
        
        // Initial flash lasts 100ms
        setTimeout(() => {
          setIsFlashing(false);
          setIsBurning(true);
          
          // Burn-in dissipates over 15 seconds
          setTimeout(() => {
            setIsBurning(false);
          }, 15000);
          
        }, 100);
      }
    }
  }, [nuclearExchangeOccurred, activeFx, isFlashing, isBurning]);

  return (
    <AnimatePresence>
      {isFlashing && (
        <motion.div
          key="pure-flash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0 }}
          className="fixed inset-0 bg-white pointer-events-none z-[99999]"
        />
      )}
      
      {isBurning && !isFlashing && (
        <motion.div
          key="burn-in"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 6, ease: "easeOut" }}
          className="fixed inset-0 pointer-events-none z-[99999] mix-blend-screen"
        >
          {/* Main violent glow */}
          <div className="absolute inset-0 bg-white" />
          
          {/* Noise/Burn-in overlay that slowly dissipates over the 15s wrapper state */}
          <div 
            className="absolute inset-0 opacity-40 mix-blend-multiply transition-opacity duration-[15000ms]"
            style={{ 
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' 
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
