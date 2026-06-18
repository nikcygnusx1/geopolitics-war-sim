import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCommsStore, CommsMessage } from '../../store/commsStore';
import { audio } from '../../utils/audio';
import { ClassifiedDocument } from '../shared/ClassifiedDocument';

interface CommsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommsPanel({ isOpen, onClose }: CommsPanelProps) {
  const comms = useCommsStore((s) => s.comms);
  const unreadCount = useCommsStore((s) => s.unreadCount);
  const activeFilter = useCommsStore((s) => s.activeChannelFilter);
  const isMuted = useCommsStore((s) => s.isMuted);
  const setChannelFilter = useCommsStore((s) => s.setChannelFilter);
  const markAllAsRead = useCommsStore((s) => s.markAllAsRead);
  const toggleMute = useCommsStore((s) => s.toggleMute);
  const clearComms = useCommsStore((s) => s.clearComms);

  // Filter messages
  const filteredMessages = useMemo(() => {
    if (activeFilter === 'ALL') return comms;
    return comms.filter((c) => c.channel === activeFilter);
  }, [comms, activeFilter]);

  // Count active per category
  const counts = useMemo(() => {
    return {
      ALL: comms.length,
      STAFF_CHAT: comms.filter((c) => c.channel === 'STAFF_CHAT').length,
      ADVISORY_CABLE: comms.filter((c) => c.channel === 'ADVISORY_CABLE').length,
      INTELLIGENCE_TIP: comms.filter((c) => c.channel === 'INTELLIGENCE_TIP').length,
      URGENT_NOTICE: comms.filter((c) => c.channel === 'URGENT_NOTICE').length,
    };
  }, [comms]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 cursor-default"
          />

          {/* Sliding comms interface */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 h-screen w-full sm:w-[500px] z-[100] flex flex-col p-4 pointer-events-none"
          >
            <ClassifiedDocument classification="TOP SECRET" codewords={['UMBRA', 'GAMMA']} className="h-full w-full pointer-events-auto flex flex-col">
              {/* Cybersecurity digital scanning lines */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-red-600/30 animate-pulse pointer-events-none" />

              {/* Header Plate */}
              <div className="p-4 border-b border-[#00ff44]/35 bg-[#040904] flex flex-col gap-2 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black tracking-widest text-[#00ff44] uppercase flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  📡 ENCRYPTED COMMUNICATIONS CENTER
                </span>
                
                {/* Close Button */}
                <button
                  onClick={() => { audio.sfxKeyClick(); onClose(); }}
                  className="px-2.5 py-1 border border-[#00ff44]/40 hover:border-red-500 text-gray-400 hover:text-red-500 rounded cursor-pointer transition-all hover:bg-red-950/20 text-[10px]"
                >
                  ✕ DOCK
                </button>
              </div>
              
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">
                Multi-Spectrum Sovereign Transceiver v41.9 // Link Secure
              </p>

              {/* Utility controller triggers */}
              <div className="flex justify-between items-center mt-2 pt-1 border-t border-[#1a3a1a]/40">
                <div className="flex gap-2">
                  <button
                    onClick={() => { audio.sfxKeyClick(); markAllAsRead(); }}
                    className="text-[8px] tracking-wide text-cyan-400 hover:text-cyan-300 uppercase cursor-pointer border border-cyan-900/40 hover:border-cyan-500 bg-cyan-950/20 px-2 py-1 rounded"
                  >
                    ✓ Acknowledge All ({unreadCount})
                  </button>
                  <button
                    onClick={() => { audio.sfxKeyClick(); clearComms(); }}
                    className="text-[8px] tracking-wide text-[#ff2244] hover:text-[#ff3857] uppercase cursor-pointer border border-[#ff2244]/20 hover:border-[#ff2244] bg-[#ff2244]/5 px-2 py-1 rounded"
                  >
                    ✕ PURGE FEED
                  </button>
                </div>

                {/* Audio volume / mute toggle */}
                <button
                  onClick={toggleMute}
                  className={`text-[8.5px] items-center gap-1.5 px-2 py-1 rounded border flex cursor-pointer transition-all ${
                    isMuted 
                      ? 'border-[#ff2244] bg-[#ff2244]/10 text-[#ff2244] font-black' 
                      : 'border-[#00ff44]/45 bg-[#00ff44]/5 text-[#00ff44]'
                  }`}
                >
                  {isMuted ? '🔇 AUDIO MUTED' : '🔊 SYS SOUND'}
                </button>
              </div>
            </div>

            {/* Filter tags bar */}
            <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-[#1a3a1a] bg-black/40">
              {([
                { id: 'ALL', label: 'ALL INBOUND', color: 'border-gray-800 text-white' },
                { id: 'STAFF_CHAT', label: 'STAFF CHAT', color: 'border-green-950 text-[#00ff44]' },
                { id: 'ADVISORY_CABLE', label: 'ADVISORY', color: 'border-cyan-950 text-cyan-400' },
                { id: 'INTELLIGENCE_TIP', label: 'INTEL COVERT', color: 'border-yellow-950 text-[#ffb300]' },
                { id: 'URGENT_NOTICE', label: 'URGENT NOTICE', color: 'border-red-950 text-[#ff2244]' },
              ] as const).map((filter) => {
                const isActive = activeFilter === filter.id;
                const count = counts[filter.id];
                return (
                  <button
                    key={filter.id}
                    onClick={() => { audio.sfxKeyClick(); setChannelFilter(filter.id); }}
                    className={`px-2 py-1 text-[8px] font-black rounded border cursor-pointer transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-[#0a200a] text-[#00ff44] border-[#00ff44] shadow-[0_0_6px_rgba(0,255,68,0.15)]' 
                        : 'bg-[#010401] hover:bg-white/5 border-[#1a3a1a] text-gray-400'
                    }`}
                  >
                    {filter.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Messages body queue */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin dark-scroll pr-2 bg-black/20">
              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center text-gray-600 gap-2 border border-dashed border-[#1a3a1a]/40 rounded p-8">
                  <span className="text-lg">📡</span>
                  <p className="font-mono text-[10px] uppercase tracking-wider leading-relaxed">
                    NO SIGNAL INTERCEPTED IN THIS QUEUE.<br />
                    TREATY RE-ROUTING OR POLICY RATE ADVANCEMENTS WILL LOG ADVISORY DE-BRIEFS.
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  let badgeColor = 'text-green-500 bg-green-950/20 border-green-900/50';
                  let cardBorder = 'border-[#0a1f0a]';
                  let hoverEffect = 'hover:border-[#00ff44]/35 hover:shadow-[0_0_8px_rgba(0,255,100,0.03)]';
                  let signalIcon = '◇';
                  let textGlow = 'text-gray-200';

                  if (msg.channel === 'ADVISORY_CABLE') {
                    badgeColor = 'text-cyan-400 bg-cyan-950/20 border-cyan-900/50';
                    cardBorder = 'border-cyan-950/60';
                    hoverEffect = 'hover:border-cyan-500/35 hover:shadow-[0_0_8px_rgba(6,182,212,0.03)]';
                    signalIcon = '❑';
                  } else if (msg.channel === 'INTELLIGENCE_TIP') {
                    badgeColor = 'text-[#ffb300] bg-amber-950/20 border-amber-900/50';
                    cardBorder = 'border-amber-950/60';
                    hoverEffect = 'hover:border-[#ffb300]/30 hover:shadow-[0_0_8px_rgba(245,158,11,0.03)]';
                    signalIcon = '▲';
                  } else if (msg.channel === 'URGENT_NOTICE') {
                    badgeColor = 'text-[#ff2244] bg-red-950/25 border-red-900/60 animate-pulse';
                    cardBorder = 'border-red-950/90 shadow-[inset_0_0_6px_rgba(255,34,68,0.08)]';
                    hoverEffect = 'hover:border-[#ff2244]/45 hover:shadow-[0_0_12px_rgba(255,34,68,0.08)]';
                    signalIcon = '☢';
                    textGlow = 'text-red-100 font-bold';
                  }

                  return (
                    <motion.div
                      layoutId={`comms-${msg.id}`}
                      key={msg.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative border bg-[#010401]/90 rounded p-3 flex flex-col gap-1.5 transition-all leading-normal ${cardBorder} ${hoverEffect}`}
                    >
                      {/* Unread flashing dot indicator */}
                      {msg.isNew && (
                        <span className="absolute top-2.5 right-2 px-1 py-0.5 bg-[#00ff44]/15 border border-[#00ff44] text-[#00ff44] text-[6.5px] font-black rounded uppercase animate-pulse">
                          NEW TRANSCEIVER
                        </span>
                      )}

                      {/* Header block details */}
                      <div className="flex justify-between items-center text-[8.5px] border-b border-[#1a3a1a]/40 pb-1 mr-12 sm:mr-16">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500 font-bold select-none">[T-{msg.tick}]</span>
                          <span className={`px-1 rounded border text-[7.5px] ${badgeColor}`}>
                            {msg.channel.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-gray-500 font-bold">{msg.timestamp}</span>
                      </div>

                      {/* Sender Bio Block */}
                      <div className="flex flex-col select-all">
                        <span className="text-[10px] text-white font-heavy uppercase tracking-wider">
                          {msg.source}
                        </span>
                        <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-widest mt-0.5">
                          Position: {msg.senderTitle}
                        </span>
                      </div>

                      {/* Message Transcription text */}
                      <div className="flex gap-2.5 items-start mt-0.5">
                        <span className="text-[11px] text-[#00ff44] opacity-80 select-none">
                          {signalIcon}
                        </span>
                        <p className={`text-[10px] leading-relaxed break-words flex-1 ${textGlow}`}>
                          {msg.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Bottom Safe Area Warning */}
            <div className="p-3 bg-[#030603] border-t border-[#1a3a1a] text-center text-[7.5px] text-gray-600 uppercase tracking-widest select-none shrink-0">
              Sovereign Command Comms Panel // All audio secure & isolated.
            </div>
            </ClassifiedDocument>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
