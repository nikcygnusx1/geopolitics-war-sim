import React from 'react';

export type MapLayer = 'POLITICAL' | 'MILITARY' | 'ECONOMIC' | 'CYBER' | 'WEATHER' | 'PROPAGANDA';

interface MapControlsProps {
  activeLayer: MapLayer;
  setActiveLayer: (layer: MapLayer) => void;
  viewMode: 'MAP' | 'GRAPH';
  setViewMode: (mode: 'MAP' | 'GRAPH') => void;
}

export default function MapControls({
  activeLayer,
  setActiveLayer,
  viewMode,
  setViewMode,
}: MapControlsProps) {
  const layers: MapLayer[] = ['POLITICAL', 'MILITARY', 'ECONOMIC', 'CYBER', 'WEATHER', 'PROPAGANDA'];

  return (
    <div className="w-full bg-[#040804] border-b border-[#1a3a1a] h-9 p-1 flex justify-between items-center text-[10px] font-mono shrink-0 select-none">
      {/* Visual Modes Switcher */}
      <div className="flex gap-1 items-center">
        <button
          onClick={() => setViewMode('MAP')}
          className={`px-3 py-1 border border-[#1a3a1a] uppercase cursor-pointer ${
            viewMode === 'MAP' ? 'bg-[#1a4a1a] text-[#00ff44] font-bold text-shadow-sm' : 'text-gray-400 hover:text-[#00ff44]'
          }`}
        >
          THEATER MAP
        </button>
        <button
          onClick={() => setViewMode('GRAPH')}
          className={`px-3 py-1 border border-[#1a3a1a] uppercase cursor-pointer ${
            viewMode === 'GRAPH' ? 'bg-[#1a4a1a] text-[#00ff44] font-bold text-shadow-sm' : 'text-gray-400 hover:text-[#00ff44]'
          }`}
        >
          RELATION GRAPH
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="flex gap-1 items-center overflow-x-auto">
        <span className="text-gray-500 font-bold uppercase mr-1">DATA LAYER:</span>
        {layers.map((lay) => (
          <button
            key={lay}
            onClick={() => setActiveLayer(lay)}
            className={`px-2 py-1 border border-[#1a3a1a] text-[9px] uppercase tracking-wider cursor-pointer transition-all ${
              activeLayer === lay
                ? 'bg-[#1a4a1a] text-[#00ff44] font-bold border-[#00ff44] text-shadow-sm'
                : 'text-gray-400 hover:bg-[#081508]'
            }`}
          >
            {lay}
          </button>
        ))}
      </div>
    </div>
  );
}
