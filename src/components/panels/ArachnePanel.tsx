import React, { useMemo } from 'react';
import { useArachneStore } from '../../store/arachneStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useLinkedAnalysisStore } from '../../store/linkedAnalysisStore';
import { ArachneTheme, ArachneSourceClass, ArachneUrgency, ArachneConfidence, ArachneFreshness, ArachneIntelItem } from '../../types/arachne';
import { audio } from '../../utils/audio';

export default function ArachnePanel() {
  const {
    feed,
    filters,
    selectedItemId,
    setSelectedItem,
    updateFilters,
    resetFilters,
    setPdbActive
  } = useArachneStore();

  const countries = useWorldStore((s) => s.countries);
  const selectCountry = useLinkedAnalysisStore((s) => s.selectCountry);

  const selectedItem = useMemo(() => {
    return feed.find(item => item.id === selectedItemId) || null;
  }, [feed, selectedItemId]);

  // Derived filter options
  const regions = useMemo(() => {
    const list = new Set<string>();
    feed.forEach(item => item.regionIds.forEach(r => list.add(r)));
    return Array.from(list).sort();
  }, [feed]);

  const countriesWithItems = useMemo(() => {
    const list = new Set<string>();
    feed.forEach(item => item.countryIds.forEach(c => list.add(c)));
    return Array.from(list).sort();
  }, [feed]);

  // Apply filters to feed
  const filteredFeed = useMemo(() => {
    return feed.filter(item => {
      // 1. Search Query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesText = 
          item.title.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query) ||
          item.fullBrief.toLowerCase().includes(query) ||
          item.whyItMatters.toLowerCase().includes(query);
        if (!matchesText) return false;
      }

      // 2. Country
      if (filters.country !== 'ALL') {
        if (!item.countryIds.includes(filters.country)) return false;
      }

      // 3. Region
      if (filters.region !== 'ALL') {
        if (!item.regionIds.includes(filters.region)) return false;
      }

      // 4. Theme
      if (filters.theme !== 'ALL') {
        if (!item.themeTags.includes(filters.theme)) return false;
      }

      // 5. Urgency
      if (filters.urgency !== 'ALL') {
        if (item.urgency !== filters.urgency) return false;
      }

      // 6. Source Type
      if (filters.sourceType !== 'ALL') {
        if (item.sourceType !== filters.sourceType) return false;
      }

      // 7. Confidence
      if (filters.confidence !== 'ALL') {
        if (item.confidence !== filters.confidence) return false;
      }

      return true;
    });
  }, [feed, filters]);

  const sourceColors: Record<ArachneSourceClass, string> = {
    RUMINT: 'bg-[#5c4004] text-[#ffd666] border-[#ffd666]/30',
    OSINT: 'bg-[#1b2530] text-[#8ab4f8] border-[#8ab4f8]/30',
    SIGINT: 'bg-[#1c3024] text-[#81c995] border-[#81c995]/30',
    HUMINT: 'bg-[#2b1828] text-[#f28b82] border-[#f28b82]/30',
    CONFIRMED: 'bg-[#40121b] text-[#f28b82] border-[#ff4e4e]/40 border-l-2 border-l-red-500',
  };

  const urgencyColors: Record<ArachneUrgency, string> = {
    LOW: 'text-gray-400 border-gray-800',
    MEDIUM: 'text-[#ffd666] border-[#ffd666]/40',
    HIGH: 'text-[#ff9d4d] border-[#ff9d4d]/50 font-bold',
    CRITICAL: 'text-[#ff4e4e] border-[#ff4e4e]/70 font-black animate-pulse',
  };

  const handleInspectCountry = (countryId: string) => {
    audio.sfxKeyClick();
    selectCountry(countryId);
    usePlayerStore.setState({ activeTab: 1 }); // Switch to Government dossier
  };

  return (
    <div className="w-full text-xs flex flex-col gap-3 font-mono">
      {/* Search and Filters Strip */}
      <div className="border border-[#1a3a1a] bg-[#030503] p-3 rounded flex flex-col gap-2.5 shadow-md">
        {/* Search Input and PDB Toggle */}
        <div className="flex gap-2 justify-between items-center">
          <div className="flex-1 flex gap-2 items-center bg-[#071107] border border-[#113211] px-2 py-1 rounded">
            <span className="text-gray-500">🔍</span>
            <input
              type="text"
              placeholder="SEARCH BLACK APERTURE FEEDS..."
              value={filters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              className="bg-transparent border-none text-white outline-none w-full text-[10px] uppercase placeholder-gray-600 font-mono"
            />
          </div>
          <button
            onClick={() => { audio.sfxKeyClick(); setPdbActive(true); }}
            className="px-3 py-1.5 bg-[#401c10]/20 border border-[#ff6c22] text-[#ff6c22] rounded hover:bg-[#401c10]/40 transition-colors cursor-pointer text-[9px] font-black uppercase flex items-center gap-1.5"
          >
            📋 OPEN PDB BRIEFING
          </button>
        </div>

        {/* Horizontal Filters Matrices */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Theme Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-gray-500 uppercase tracking-widest">THEME BLOCK</span>
            <select
              value={filters.theme}
              onChange={(e) => { audio.sfxKeyClick(); updateFilters({ theme: e.target.value as ArachneTheme | 'ALL' }); }}
              className="bg-[#030503] border border-[#1a3a1a] text-gray-300 outline-none p-1 text-[9px] rounded w-full cursor-pointer uppercase font-mono"
            >
              <option value="ALL">-- ALL THEMES --</option>
              {['DIPLOMACY', 'MILITARY', 'ECONOMIC', 'SANCTIONS', 'CYBER', 'UNREST', 'LEADERSHIP', 'COVERT_RISK', 'ENERGY'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Region Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-gray-500 uppercase tracking-widest">GEOGRAPHIC ZONE</span>
            <select
              value={filters.region}
              onChange={(e) => { audio.sfxKeyClick(); updateFilters({ region: e.target.value }); }}
              className="bg-[#030503] border border-[#1a3a1a] text-gray-300 outline-none p-1 text-[9px] rounded w-full cursor-pointer uppercase font-mono"
            >
              <option value="ALL">-- ALL REGIONS --</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Provenance Taxonomy Class */}
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-gray-500 uppercase tracking-widest">PROVENANCE CLASSIF.</span>
            <select
              value={filters.sourceType}
              onChange={(e) => { audio.sfxKeyClick(); updateFilters({ sourceType: e.target.value as ArachneSourceClass | 'ALL' }); }}
              className="bg-[#030503] border border-[#1a3a1a] text-gray-300 outline-none p-1 text-[9px] rounded w-full cursor-pointer uppercase font-mono"
            >
              <option value="ALL">-- CREDIBILITY TAX --</option>
              {['RUMINT', 'OSINT', 'SIGINT', 'HUMINT', 'CONFIRMED'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Urgency Level */}
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-gray-500 uppercase tracking-widest">URGENCY BAND</span>
            <select
              value={filters.urgency}
              onChange={(e) => { audio.sfxKeyClick(); updateFilters({ urgency: e.target.value as ArachneUrgency | 'ALL' }); }}
              className="bg-[#030503] border border-[#1a3a1a] text-gray-300 outline-none p-1 text-[9px] rounded w-full cursor-pointer uppercase font-mono"
            >
              <option value="ALL">-- ALL SEVERITIES --</option>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filters.theme !== 'ALL' || filters.region !== 'ALL' || filters.sourceType !== 'ALL' || filters.urgency !== 'ALL' || filters.searchQuery !== '') && (
          <button
            onClick={() => { audio.sfxKeyClick(); resetFilters(); }}
            className="text-[8px] uppercase font-bold text-[#ff4e4e] hover:underline self-end cursor-pointer"
          >
            ❌ RESET INTEL FILTERS
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Feed List (Left side) */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          <div className="combat-panel border border-[#1a3a1a] bg-[#030503] rounded p-2 shadow-inner">
            <div className="flex justify-between items-center border-b border-[#1a3a1a] pb-1.5 mb-2">
              <h3 className="font-bold text-[#00ff44] text-[10px] uppercase">
                ARACHNE STREAM REPORT ({filteredFeed.length} ALIGNED LOGS)
              </h3>
              <div className="text-[8px] text-gray-500 font-bold">SORTED BY THREAT SCORE</div>
            </div>

            <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin flex flex-col">
              {filteredFeed.length === 0 ? (
                <div className="text-gray-500 italic py-8 text-center bg-black/40 border border-[#1a2d1a] rounded">
                  No developments matched current filter configurations.
                </div>
              ) : (
                filteredFeed.map((item) => {
                  const isSelected = item.id === selectedItemId;
                  const firstTheme = item.themeTags[0] || 'MILITARY';

                  return (
                    <div
                      key={item.id}
                      onClick={() => { audio.sfxKeyClick(); setSelectedItem(item.id); }}
                      className={`border border-[#112d11] p-2.5 rounded font-mono transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'bg-[#122e12]/60 border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.15)]' 
                          : 'bg-[#040704] hover:bg-[#091509]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[8.5px] px-1.5 py-0.2 rounded border uppercase font-black font-sans ${sourceColors[item.sourceType]}`}>
                          {item.sourceType}
                        </span>
                        <div className="flex gap-1.5 items-center">
                          <span className="text-[8px] text-gray-500">TICK {item.timestampTick}</span>
                          <span className={`text-[8px] uppercase px-1 border rounded ${urgencyColors[item.urgency]}`}>
                            {item.urgency}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] font-bold text-gray-100 uppercase leading-snug">
                        {item.title}
                      </div>

                      <div className="text-[9px] text-gray-400 font-sans leading-relaxed line-clamp-2">
                        {item.summary}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[8px] text-[#00ff44] bg-[#00ff44]/10 px-1 py-0.2 rounded uppercase font-bold">
                          #{firstTheme}
                        </span>
                        {item.countryIds.map(cid => (
                          <span key={cid} className="text-[8px] text-[#00e5ff] bg-[#00e5ff]/10 px-1 py-0.2 rounded font-bold">
                            [{cid}]
                          </span>
                        ))}
                        {item.regionIds.map(rid => (
                          <span key={rid} className="text-[8px] text-gray-500 bg-gray-900 px-1 py-0.2 rounded">
                            {rid}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Dossier Detail Drawer (Right side) */}
        <div className="lg:col-span-5">
          {selectedItem ? (
            <div className="combat-panel border border-[#1a3a1a] bg-[#030503] rounded p-4 shadow-md flex flex-col gap-3 h-full min-h-[460px] justify-between relative overflow-hidden">
              {/* Cover border flair */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-600 via-[#ff6c22] to-amber-700" />
              
              <div className="flex flex-col gap-3.5">
                {/* Taxonomy header */}
                <div className="flex justify-between items-center border-b border-[#1a3a1a] pb-2">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">ARACHNE INTEL SUMMARY</span>
                  <span className="text-[9px] text-[#00ff44] bg-[#1a4a1a] px-2 py-0.5 rounded font-black uppercase">
                    CONFIDENCE: {selectedItem.confidence}
                  </span>
                </div>

                {/* Primary Metadata Box */}
                <div className="bg-[#071107] border border-[#113211] p-2.5 rounded flex flex-col gap-1.5 uppercase text-[9px] text-gray-400">
                  <div><span className="text-gray-500">Source Provenance:</span> <span className="text-white font-bold">{selectedItem.sourceLabel}</span></div>
                  <div><span className="text-gray-500">Theme Tags:</span> <span className="text-[#00ff44] font-bold">{selectedItem.themeTags.join(', ')}</span></div>
                  <div><span className="text-gray-500">Geographic Focus:</span> <span className="text-[#00e5ff] font-bold">{selectedItem.regionIds.join(', ')}</span></div>
                  <div><span className="text-gray-500">Associated States:</span> <span className="text-white font-bold">{selectedItem.countryIds.join(', ') || 'NONE DETECTED'}</span></div>
                </div>

                {/* Title */}
                <div className="text-xs font-black uppercase text-[#ffc107] border-l-2 border-[#ffc107] pl-2 leading-relaxed">
                  {selectedItem.title}
                </div>

                {/* Detailed Analysis Content */}
                <div className="space-y-3 font-sans leading-relaxed text-[10px] text-gray-300">
                  <div className="space-y-1">
                    <span className="font-mono text-[8.5px] uppercase tracking-widest text-emerald-500 block">TACTICAL INTELLIGENCE BRIEF:</span>
                    <p className="indent-4 text-justify normal-case">{selectedItem.fullBrief}</p>
                  </div>

                  <div className="border border-[#1a3a1a] bg-black/60 p-2.5 rounded border-l-2 border-l-[#ff6c22]">
                    <span className="font-mono text-[8.5px] uppercase tracking-widest text-[#ff6c22] block mb-1">OPERATIONAL WHY IT MATTERS:</span>
                    <p className="normal-case leading-relaxed">{selectedItem.whyItMatters}</p>
                  </div>
                </div>
              </div>

              {/* Interaction Block */}
              <div className="pt-3 border-t border-[#1a3a1a] flex flex-col gap-2">
                <span className="text-[8px] text-gray-500 uppercase tracking-wider block text-center font-bold">COMMAND INTELLIGENCE DRILLDOWN PATHS</span>
                
                {selectedItem.countryIds.length === 0 ? (
                  <div className="text-[9.5px] text-gray-650 italic text-center uppercase">No specific sovereign node linkages resolved for deep-dive.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.countryIds.map(cid => {
                      const countryName = countries[cid]?.name || cid;
                      return (
                        <button
                          key={cid}
                          onClick={() => handleInspectCountry(cid)}
                          className="px-2.5 py-1.5 bg-[#122412] border border-[#00ff44] text-[#00ff44] rounded hover:bg-[#1a3b1a] transition-all cursor-pointer font-extrabold uppercase text-[9px] flex items-center justify-center gap-1.5"
                        >
                          👁️ INSPECT {cid} DOSSIER
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="combat-panel border border-dashed border-gray-800 bg-[#020502]/40 rounded p-12 text-center text-gray-500 italic text-[10.5px]">
              Select any intelligence development logging index to extract detailed provenance and deep operational brief.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
