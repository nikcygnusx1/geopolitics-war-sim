import { create } from 'zustand';
import { useUIStore } from './uiStore';
import { usePlayerStore } from './playerStore';

export type AnalysisMode = 'MAP' | 'GRAPH' | 'TIMELINE' | 'SPLIT';
export type PresetFocusMode = 'STRATEGIC' | 'CONFLICT' | 'DIPLOMACY' | 'NUCLEAR' | 'ECONOMIC';

export interface AnalysisEdge {
  source: string;
  target: string;
  type: string;
}

interface LinkedAnalysisState {
  analysisMode: AnalysisMode;
  presetFocusMode: PresetFocusMode;
  selectedCountryId: string | null;
  selectedEdge: AnalysisEdge | null;
  selectedEventId: string | null;
  timeRange: [number, number] | null; // [minTick, maxTick]
  filterTypes: string[]; // e.g. ['STRIKE', 'SANCTION', 'DIPLOMACY', 'COVERT_OP']
  
  // Actions
  setAnalysisMode: (mode: AnalysisMode) => void;
  setPresetFocusMode: (preset: PresetFocusMode) => void;
  selectCountry: (countryId: string | null, source?: string) => void;
  selectEdge: (edge: AnalysisEdge | null) => void;
  selectEvent: (eventId: string | null) => void;
  setTimeRange: (range: [number, number] | null) => void;
  setFilterTypes: (types: string[]) => void;
  toggleFilterType: (type: string) => void;
  resetAnalysisState: () => void;
}

export const useLinkedAnalysisStore = create<LinkedAnalysisState>((set, get) => ({
  analysisMode: 'MAP',
  presetFocusMode: 'STRATEGIC',
  selectedCountryId: null,
  selectedEdge: null,
  selectedEventId: null,
  timeRange: null,
  filterTypes: ['STRIKE', 'SANCTION', 'DIPLOMACY', 'COVERT_OP', 'RESEARCH', 'FISCAL', 'MARKET', 'SYSTEM', 'OTHER'],

  setAnalysisMode: (mode) => set({ analysisMode: mode }),
  
  setPresetFocusMode: (preset) => {
    set({ presetFocusMode: preset });
    
    // Auto-adjust filters and layers based on the preset focus
    switch (preset) {
      case 'STRATEGIC':
        set({
          filterTypes: ['STRIKE', 'SANCTION', 'DIPLOMACY', 'COVERT_OP', 'RESEARCH', 'FISCAL', 'MARKET', 'SYSTEM', 'OTHER'],
        });
        break;
      case 'CONFLICT':
        set({
          filterTypes: ['STRIKE', 'SANCTION', 'COVERT_OP'],
        });
        break;
      case 'DIPLOMACY':
        set({
          filterTypes: ['DIPLOMACY', 'FISCAL', 'SYSTEM'],
        });
        break;
      case 'NUCLEAR':
        set({
          filterTypes: ['STRIKE', 'SYSTEM'],
        });
        break;
      case 'ECONOMIC':
        set({
          filterTypes: ['SANCTION', 'MARKET', 'FISCAL'],
        });
        break;
    }
  },

  selectCountry: (countryId, source = 'workspace') => {
    set({ selectedCountryId: countryId, selectedEdge: null });

    // Sync with other existing stores to coordinate UI Inspector boards
    if (countryId) {
      const hudMode = usePlayerStore.getState().hudMode;
      const playerCountryId = usePlayerStore.getState().countryId;

      if (hudMode === 'WAR_ROOM' && countryId !== playerCountryId) {
        usePlayerStore.getState().setTargetCountry(countryId);
      } else {
        useUIStore.getState().setCountryInspector(countryId);
      }
    } else {
      useUIStore.getState().setCountryInspector(null);
    }
  },

  selectEdge: (edge) => set({ selectedEdge: edge, selectedCountryId: null, selectedEventId: null }),

  selectEvent: (eventId) => {
    set({ selectedEventId: eventId });
  },

  setTimeRange: (range) => set({ timeRange: range }),

  setFilterTypes: (types) => set({ filterTypes: types }),

  toggleFilterType: (type) => {
    const current = get().filterTypes;
    if (current.includes(type)) {
      set({ filterTypes: current.filter((t) => t !== type) });
    } else {
      set({ filterTypes: [...current, type] });
    }
  },

  resetAnalysisState: () => set({
    analysisMode: 'MAP',
    presetFocusMode: 'STRATEGIC',
    selectedCountryId: null,
    selectedEdge: null,
    selectedEventId: null,
    timeRange: null,
    filterTypes: ['STRIKE', 'SANCTION', 'DIPLOMACY', 'COVERT_OP', 'RESEARCH', 'FISCAL', 'MARKET', 'SYSTEM', 'OTHER'],
  }),
}));
