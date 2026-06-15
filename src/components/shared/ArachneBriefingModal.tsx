import React, { useState } from 'react';
import { useArachneStore } from '../../store/arachneStore';
import { usePlayerStore } from '../../store/playerStore';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../../utils/audio';

export default function ArachneBriefingModal() {
  const {
    pdbCards,
    pdbActive,
    setPdbActive,
    dismissPdbCard,
    setSelectedItem
  } = useArachneStore();

  const [activeIndex, setActiveIndex] = useState(0);

  if (!pdbActive || pdbCards.length === 0) return null;

  // Correct bounds
  const currentCard = pdbCards[activeIndex] || pdbCards[0] || null;
  if (!currentCard) return null;

  const handleNext = () => {
    audio.sfxKeyClick();
    if (activeIndex < pdbCards.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      setActiveIndex(0);
    }
  };

  const handlePrev = () => {
    audio.sfxKeyClick();
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else {
      setActiveIndex(pdbCards.length - 1);
    }
  };

  const handleDismissCard = (cardId: string) => {
    audio.sfxKeyClick();
    // Dismiss
    dismissPdbCard(cardId);
    // Correct bounds
    if (activeIndex >= pdbCards.length - 1) {
      setActiveIndex(Math.max(0, pdbCards.length - 2));
    }
  };

  const handleDrilldown = (cardId: string) => {
    audio.sfxKeyClick();
    setSelectedItem(cardId);
    usePlayerStore.setState({ activeTab: 6 }); // switch to Intel Panel (F6)
    setPdbActive(false);
  };

  const sourceTypeLabels: Record<string, string> = {
    RUMINT: '📢 RUMINT (Unverified Rumors)',
    OSINT: '📰 OSINT (Open Source Intelligence)',
    SIGINT: '📡 SIGINT (Technical Intercepts)',
    HUMINT: '🕵️ HUMINT (Clandestine Humint)',
    CONFIRMED: '🚨 CONFIRMED DIRECTIVE FEED'
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-gradient-to-b from-[#0b140b] via-[#040604] to-black border border-[#1a5c1a] rounded shadow-2xl relative flex flex-col p-5 font-mono overflow-hidden">
        
        {/* Background Cyber-Net Texture Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1a5c1a_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-[#1a3a1a] pb-3 mb-4 select-none">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] tracking-widest text-[#ff4e4e] font-black uppercase">⚠️ PRESIDENTIAL DAILY BRIEFING</span>
            <span className="text-[7.5px] text-gray-500 uppercase tracking-widest">ARACHNE OSINT BRIEFING PORTAL // FOR YOUR EYES ONLY</span>
          </div>
          <button
            onClick={() => { audio.sfxKeyClick(); setPdbActive(false); }}
            className="text-[9px] px-2.5 py-1 border border-gray-800 text-gray-400 hover:text-white rounded hover:bg-white/5 cursor-pointer transition-all active:translate-y-0.2"
          >
            MINIMIZE [ESC]
          </button>
        </div>

        {/* PDB Deck Navigation Summary */}
        <div className="flex justify-between items-center mb-3 text-[9px] text-gray-400 border-b border-[#0f240f] pb-1.5 uppercase select-none">
          <div>ACTIVE DIRECTORY STACK: <span className="text-white font-black">{pdbCards.length} THREAT CARDS</span></div>
          <div>CURRENT DEVELOPMENT: <span className="text-[#00ff44] font-black">{activeIndex + 1} OF {pdbCards.length}</span></div>
        </div>

        {/* Swipe Card Deck container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col gap-4 border border-[#1e3c1e] bg-[#020502]/90 p-4 rounded text-xs select-none shadow-inner relative"
          >
            {/* Top credibility tag */}
            <div className="flex justify-between items-center bg-[#071307] border border-[#113211] p-2 rounded uppercase text-[8.5px]">
              <span className="text-[#ffd666] font-bold">{sourceTypeLabels[currentCard.sourceType]}</span>
              <span className="text-gray-500">Confidence: <b className="text-white">{currentCard.confidence}</b></span>
            </div>

            {/* Title */}
            <div className="text-[11.5px] font-black uppercase text-[#00ff44] border-l-2 border-[#00ff44] pl-2 leading-relaxed">
              {currentCard.title}
            </div>

            {/* Brief and Summary */}
            <div className="space-y-3 font-sans text-gray-300 normal-case leading-relaxed text-[10px]">
              <div className="space-y-1">
                <span className="font-mono text-[8.5px] uppercase tracking-widest text-[#ff6c22] block">TACTICAL RATIONALE:</span>
                <p className="text-justify">{currentCard.summary}</p>
              </div>

              <div className="bg-[#1c120c] border border-[#ff6c22]/20 p-2.5 rounded text-justify">
                <span className="font-mono text-[8.2px] uppercase tracking-widest text-[#ff6c22] block mb-1">OPERATIONAL WHY IT MATTERS:</span>
                <p className="text-[#ffd666]/90">{currentCard.whyItMatters}</p>
              </div>
            </div>

            {/* Country links and regions */}
            <div className="flex flex-wrap gap-1 border-t border-[#1a3a1a] pt-3 text-[8.5px] font-mono select-none uppercase text-gray-500">
              <span className="mr-1">ZONES DEPLOYED:</span>
              {currentCard.regionIds.map(rid => (
                <span key={rid} className="text-white font-bold bg-neutral-900 border border-neutral-800 px-1 py-0.2 rounded">{rid}</span>
              ))}
              {currentCard.countryIds.map(cid => (
                <span key={cid} className="text-[#00e5ff] font-bold bg-[#00e5ff]/5 border border-[#00e5ff]/20 px-1 py-0.2 rounded">[{cid}]</span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Action Controls Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-[9px] select-none">
          <div className="flex gap-1 justify-start">
            <button
              onClick={handlePrev}
              className="flex-1 px-3 py-2 bg-black hover:bg-[#111] border border-gray-800 text-gray-400 hover:text-white rounded transition-colors cursor-pointer text-center uppercase"
            >
              ◀ PREV
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-3 py-2 bg-black hover:bg-[#111] border border-gray-800 text-gray-400 hover:text-white rounded transition-colors cursor-pointer text-center uppercase"
            >
              NEXT ▶
            </button>
          </div>

          <button
            onClick={() => handleDrilldown(currentCard.id)}
            className="px-3 py-2 bg-[#122e12] border border-[#00ff44] text-[#00ff44] rounded hover:bg-[#1b431b] transition-colors cursor-pointer text-center uppercase font-black"
          >
            👁️ DEEP FEED DRILLDOWN
          </button>

          <button
            onClick={() => handleDismissCard(currentCard.id)}
            className="px-3 py-2 bg-[#300a0e] border border-red-500 text-red-400 hover:bg-[#400e13] transition-colors cursor-pointer text-center uppercase font-black"
          >
            ❌ DISMISS FROM STACK
          </button>
        </div>

      </div>
    </div>
  );
}
