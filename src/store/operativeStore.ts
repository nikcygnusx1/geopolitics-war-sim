import { create } from 'zustand';
import { 
  Operative, 
  Handler, 
  Cell, 
  CompartmentalizationGraph 
} from '../types/operative';

interface OperativeStateModel {
  operatives: Record<string, Operative>;
  handlers: Record<string, Handler>;
  cells: Record<string, Cell>;
  networkGraph: CompartmentalizationGraph;
  
  // Actions
  addOperative: (id: string, operative: Operative) => void;
  updateOperative: (id: string, updates: Partial<Operative>) => void;
  addHandler: (id: string, handler: Handler) => void;
  addCell: (id: string, cell: Cell) => void;
  addNetworkLink: (source: string, target: string, type: 'KNOWS' | 'CONTACT' | 'FUNDS') => void;
  exposeOperative: (id: string, reason: string, tick: number) => void;
  burnOperative: (id: string, reason: string, tick: number) => void;
}

export const useOperativeStore = create<OperativeStateModel>((set, get) => ({
  operatives: {},
  handlers: {},
  cells: {},
  networkGraph: { nodes: [], links: [] },

  addOperative: (id, operative) => set(state => ({
    operatives: { ...state.operatives, [id]: operative },
    networkGraph: {
      ...state.networkGraph,
      nodes: state.networkGraph.nodes.includes(id) ? state.networkGraph.nodes : [...state.networkGraph.nodes, id]
    }
  })),

  updateOperative: (id, updates) => set(state => {
    const active = state.operatives[id];
    if (!active) return state;
    return {
      operatives: {
        ...state.operatives,
        [id]: { ...active, ...updates }
      }
    };
  }),

  addHandler: (id, handler) => set(state => ({
    handlers: { ...state.handlers, [id]: handler }
  })),

  addCell: (id, cell) => set(state => ({
    cells: { ...state.cells, [id]: cell }
  })),

  addNetworkLink: (source, target, type) => set(state => {
    const exists = state.networkGraph.links.find(l => l.source === source && l.target === target && l.type === type);
    if (exists) return state;
    return {
      networkGraph: {
        ...state.networkGraph,
        links: [...state.networkGraph.links, { source, target, type }]
      }
    };
  }),

  exposeOperative: (id, reason, tick) => set(state => {
    const op = state.operatives[id];
    if (!op) return state;
    return {
      operatives: {
        ...state.operatives,
        [id]: { 
          ...op, 
          exposureLevel: Math.min(100, op.exposureLevel + 25),
          compromiseHistory: [...op.compromiseHistory, { tick, reason }]
        }
      }
    };
  }),

  burnOperative: (id, reason, tick) => set(state => {
    const op = state.operatives[id];
    if (!op || op.state === 'BURNED') return state;
    return {
      operatives: {
        ...state.operatives,
        [id]: { 
          ...op, 
          state: 'BURNED',
          burnRisk: 100,
          exposureLevel: 100,
          compromiseHistory: [...op.compromiseHistory, { tick, reason }]
        }
      }
    };
  })
}));
