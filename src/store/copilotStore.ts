import { create } from 'zustand';
import { useWorldStore } from './worldStore';
import { useLinkedAnalysisStore, AnalysisMode, PresetFocusMode } from './linkedAnalysisStore';
import { usePlayerStore } from './playerStore';
import { audio } from '../utils/audio';

export type CopilotCategory = 'FLASHPOINT' | 'CHOKEPOINT' | 'ALLIANCE' | 'CORRIDOR' | 'SANCTION';
export type AssistanceLevel = 'MINIMAL' | 'ASSIST' | 'FULL';

export interface CopilotInsight {
  id: string;
  category: CopilotCategory;
  title: string;
  description: string;
  whySurfaced: string;
  signalsUsed: string[];
  severity: 'HIGH' | 'MED' | 'LOW';
  confidence: number; // percentage (e.g. 85)
  affectedActors: string[]; // countryIds
  potentialConsequence: string;
  entities: {
    countries: string[];
    edges: { source: string; target: string; type: string }[];
  };
  recommendedView: {
    analysisMode: AnalysisMode;
    presetFocusMode: PresetFocusMode;
    targetTab?: number; // activeTab F1-F6
  };
}

interface CopilotState {
  assistanceLevel: AssistanceLevel;
  activeInsights: CopilotInsight[];
  activeInsightId: string | null;
  activePipeline: CopilotCategory | null;
  highlightedCountries: string[];
  highlightedEdges: { source: string; target: string; type: string }[];
  
  // Actions
  setAssistanceLevel: (level: AssistanceLevel) => void;
  setActiveInsightId: (id: string | null) => void;
  runAnalysis: () => void;
  triggerPipeline: (pipeline: CopilotCategory | null) => void;
  clearHighlights: () => void;
}

export const useCopilotStore = create<CopilotState>((set, get) => ({
  assistanceLevel: 'ASSIST',
  activeInsights: [],
  activeInsightId: null,
  activePipeline: null,
  highlightedCountries: [],
  highlightedEdges: [],

  setAssistanceLevel: (level) => {
    set({ assistanceLevel: level });
    get().runAnalysis();
  },

  setActiveInsightId: (id) => {
    const currentInsight = get().activeInsights.find(ins => ins.id === id);
    if (currentInsight) {
      set({ 
        activeInsightId: id,
        highlightedCountries: currentInsight.entities.countries,
        highlightedEdges: currentInsight.entities.edges,
      });
      audio.sfxKeyClick();
    } else {
      set({ 
        activeInsightId: null,
        highlightedCountries: [],
        highlightedEdges: [],
      });
    }
  },

  clearHighlights: () => {
    set({ highlightedCountries: [], highlightedEdges: [], activeInsightId: null });
  },

  triggerPipeline: (pipeline) => {
    audio.playPhaseReveal();
    if (pipeline === null) {
      set({ activePipeline: null, highlightedCountries: [], highlightedEdges: [] });
      return;
    }
    set({ activePipeline: pipeline });
    get().runAnalysis();

    // Collect all entities in the first detected insight of this pipeline as the current active focus
    const filtered = get().activeInsights.filter(ins => ins.category === pipeline);
    if (filtered.length > 0) {
      const first = filtered[0];
      set({
        activeInsightId: first.id,
        highlightedCountries: first.entities.countries,
        highlightedEdges: first.entities.edges,
      });
    } else {
      set({ highlightedCountries: [], highlightedEdges: [], activeInsightId: null });
    }
  },

  runAnalysis: () => {
    const worldState = useWorldStore.getState();
    const countries = worldState.countries;
    const activeStrikes = worldState.activeStrikes;
    const currentTick = worldState.currentTick;
    const playerId = usePlayerStore.getState().countryId;

    const insights: CopilotInsight[] = [];

    const countryIds = Object.keys(countries);

    // ==========================================
    // 1. FLASHPOINTS ANALYSIS
    // ==========================================
    for (let i = 0; i < countryIds.length; i++) {
      const idA = countryIds[i];
      const cA = countries[idA];
      
      for (let j = i + 1; j < countryIds.length; j++) {
        const idB = countryIds[j];
        const cB = countries[idB];

        const warState = cA.atWarWith?.includes(idB) || cB.atWarWith?.includes(idA);
        const optA = cA.opinions?.[idB] ?? 50;
        const optB = cB.opinions?.[idA] ?? 50;
        const avgOpinion = (optA + optB) / 2;

        if (warState) {
          insights.push({
            id: `flashpoint_war_${idA}_${idB}_${currentTick}`,
            category: 'FLASHPOINT',
            title: `ACTIVE COMBAT CONTIGUITY: ${cA.name} ✖ ${cB.name}`,
            description: `Aggressive cross-border warfare is actively engaged between ${cA.name} and ${cB.name}. Heavy tactical damage is occurring, threatening to metastasize regional supply networks.`,
            whySurfaced: `Direct kinetic exchange state is flagged high-priority on space radar channels. Both sovereign forces are locked in offensive sorties.`,
            signalsUsed: ['Kinetic War state engagement', 'Orbital target trace tracks', 'High military mobilization coefficient'],
            severity: 'HIGH',
            confidence: 99,
            affectedActors: [idA, idB],
            potentialConsequence: `Spillover to adjacent non-combatants, complete border closure, potential nuclear transition state if doctrine permits first-strike.`,
            entities: {
              countries: [idA, idB],
              edges: [{ source: idA, target: idB, type: 'WAR' }],
            },
            recommendedView: {
              analysisMode: 'MAP',
              presetFocusMode: 'CONFLICT',
              targetTab: 3, // Arsenal
            }
          });
        } else if (avgOpinion < -45) {
          const highThreat = cA.threatLevel === 'RED' || cB.threatLevel === 'RED' || cA.threatLevel === 'ORANGE' || cB.threatLevel === 'ORANGE';
          insights.push({
            id: `flashpoint_tension_${idA}_${idB}_${currentTick}`,
            category: 'FLASHPOINT',
            title: `CRITICAL DETRIMENT AXIS: ${cA.name} ◄► ${cB.name}`,
            description: `Extreme diplomatic deterioration between ${cA.name} and ${cB.name}. Mutual opinions are at an all-time low (${Math.round(avgOpinion)} points) with rapid military assets centering along boundaries.`,
            whySurfaced: `Extremely low mutual diplomatic assessment combined with high local preparedness levels.`,
            signalsUsed: ['Diplomatic evaluation degradation', 'Tactical deployment profiles', 'Border signal interceptions'],
            severity: highThreat ? 'HIGH' : 'MED',
            confidence: 82,
            affectedActors: [idA, idB],
            potentialConsequence: `Unilateral military strike engagement, covert grid cyber attacks, immediate sovereign proxy mobilization.`,
            entities: {
              countries: [idA, idB],
              edges: [{ source: idA, target: idB, type: 'DIPLOMACY' }],
            },
            recommendedView: {
              analysisMode: 'GRAPH',
              presetFocusMode: 'CONFLICT',
              targetTab: 4, // Diplomacy
            }
          });
        }
      }
    }

    // ==========================================
    // 2. CHOKEPOINTS / DEPENDENCY STRESS
    // ==========================================
    countryIds.forEach((id) => {
      const c = countries[id];
      if (!c.economic.supplyChains) return;

      const chains = c.economic.supplyChains;
      const criticalDeps: string[] = [];
      let severity: 'HIGH' | 'MED' | 'LOW' = 'LOW';
      let confidence = 70;

      if (chains.energyDependency > 60) criticalDeps.push('CRITICAL ENERGY POWER');
      if (chains.semiconductorDependency > 60) criticalDeps.push('ADVANCED SEMICONDUCTORS');
      if (chains.defenseDependency > 60) criticalDeps.push('MILITARY DEFENSE UNITS');

      // If they have dependencies, and prominent global providers are unstable
      if (criticalDeps.length > 0) {
        // e.g. Taiwan (TW) for semiconductors, Saudi Arabia (SA) for energy
        const hasEnergyIssue = chains.energyDependency > 60 && countries['SA'] && countries['SA'].political.stabilityIndex < 45;
        const hasSemiIssue = chains.semiconductorDependency > 60 && countries['TW'] && countries['TW'].political.stabilityIndex < 45;

        if (hasEnergyIssue || hasSemiIssue) {
          const majorProviderId = hasEnergyIssue ? 'SA' : 'TW';
          const p = countries[majorProviderId];
          insights.push({
            id: `chokepoint_vulnerability_${id}_${currentTick}`,
            category: 'CHOKEPOINT',
            title: `SYSTEMIC SUPPLY OVERSTRESS: ${c.name}`,
            description: `${c.name} demonstrates a precarious supply chain dependency regarding ${criticalDeps.join(' and ')}. Controller supplier ${p.name}'s stability index has dropped to ${Math.round(p.political.stabilityIndex)}%, making the supply chain exceptionally fragile.`,
            whySurfaced: `Cross-correlation of resource dependency percentages against producer country political vulnerability indices.`,
            signalsUsed: ['Logistics dependency coefficient', 'Source country stability drop', 'Trade path bottleneck warning'],
            severity: p.political.stabilityIndex < 30 ? 'HIGH' : 'MED',
            confidence: 85,
            affectedActors: [id, majorProviderId],
            potentialConsequence: `Industrial manufacturing halt, sovereign economic default cascade, immediate commodity spot price spikes.`,
            entities: {
              countries: [id, majorProviderId],
              edges: [{ source: id, target: majorProviderId, type: 'TRADE' }],
            },
            recommendedView: {
              analysisMode: 'SPLIT',
              presetFocusMode: 'ECONOMIC',
              targetTab: 2, // Central Bank
            }
          });
        }
      }
    });

    // ==========================================
    // 3. UNSTABLE ALLIANCES
    // ==========================================
    const allianceNodes: Record<string, string[]> = {};
    countryIds.forEach((id) => {
      const block = countries[id].allianceBlock;
      if (block && block !== 'NEUTRAL') {
        if (!allianceNodes[block]) allianceNodes[block] = [];
        allianceNodes[block].push(id);
      }
    });

    Object.keys(allianceNodes).forEach((block) => {
      const members = allianceNodes[block];
      if (members.length < 2) return;

      for (let i = 0; i < members.length; i++) {
        const idA = members[i];
        const cA = countries[idA];
        for (let j = i + 1; j < members.length; j++) {
          const idB = members[j];
          const cB = countries[idB];

          const optA = cA.opinions?.[idB] ?? 50;
          const optB = cB.opinions?.[idA] ?? 50;
          const avgOpinion = (optA + optB) / 2;

          // Ideological friction inside same alliance block is extremely unstable
          const ideologicalDiff = cA.political.ideology !== cB.political.ideology;

          if (avgOpinion < 25) {
            insights.push({
              id: `alliance_strain_${idA}_${idB}_${currentTick}`,
              category: 'ALLIANCE',
              title: `${block} ALLIANCE FRACTURED: ${cA.name} ◄► ${cB.name}`,
              description: `A severe internal division is detected inside ${block} between ${cA.name} and ${cB.name}. Despite their common security pact, mutual diplomat assessments average ${Math.round(avgOpinion)} points${ideologicalDiff ? ` with major structural friction due to ${cA.political.ideology} vs ${cB.political.ideology} governance models` : ''}.`,
              whySurfaced: `Alliance block co-alignment audit yields high opinion divergence between treaty partners.`,
              signalsUsed: ['Intra-alliance opinion disparity', 'Ideological divergence friction', 'Treaty loyalty default signals'],
              severity: avgOpinion < 0 ? 'HIGH' : 'MED',
              confidence: 76,
              affectedActors: [idA, idB],
              potentialConsequence: `Unresolved mutual defense treaty failure during strategic engagement, unilateral breakaway alliances, block containment dissolution.`,
              entities: {
                countries: [idA, idB],
                edges: [{ source: idA, target: idB, type: 'ALLIANCE' }],
              },
              recommendedView: {
                analysisMode: 'GRAPH',
                presetFocusMode: 'DIPLOMACY',
                targetTab: 4, // Diplomacy
              }
            });
          }
        }
      }
    });

    // ==========================================
    // 4. ESCALATION CORRIDORS (Multi-theater Tension)
    // ==========================================
    // Identify states hosting multi-theater active wars or targeted by multiple different nations
    countryIds.forEach((id) => {
      const c = countries[id];
      if (c.atWarWith && c.atWarWith.length >= 2) {
        insights.push({
          id: `corridor_escalation_${id}_${currentTick}`,
          category: 'CORRIDOR',
          title: `CRITICAL ESCALATION COORDINATES: ${c.name}`,
          description: `${c.name} has become a high-betweenness flashpoint, locked in kinetic combat with multiple sovereigns simultaneously (${c.atWarWith.map(hid => countries[hid]?.name || hid).join(', ')}). Local popular unrest level is peaking at ${Math.round(c.political.popularUnrest)}% with system-wide regime stability declining.`,
          whySurfaced: `Detection of a multi-front sovereign war node carrying high degree centrality in regional threat patterns.`,
          signalsUsed: ['Multi-theater kinetic war state', 'Regime stability depletion rate', 'Elevated civil unrest index'],
          severity: 'HIGH',
          confidence: 90,
          affectedActors: [id, ...c.atWarWith],
          potentialConsequence: `Complete state structures collapse, immediate localized borders spillover to neighbor neutral corridors, high risk of thermonuclear exchange.`,
          entities: {
            countries: [id, ...c.atWarWith],
            edges: c.atWarWith.map(hid => ({ source: id, target: hid, type: 'WAR' })),
          },
          recommendedView: {
            analysisMode: 'SPLIT',
            presetFocusMode: 'NUCLEAR',
            targetTab: 6, // Intel
          }
        });
      }
    });

    // ==========================================
    // 5. SANCTIONS PRESSURE CHAINS
    // ==========================================
    countryIds.forEach((id) => {
      const c = countries[id];
      if (c.economic.sanctionedBy && c.economic.sanctionedBy.length > 0) {
        const stress = c.economic.debtStressIndex;
        const inflation = c.economic.inflationRate;
        const cashFlow = c.economic.gdpGrowthRate;

        if (stress > 55 || inflation > 0.08 || cashFlow < 0) {
          insights.push({
            id: `sanctions_pressure_${id}_${currentTick}`,
            category: 'SANCTION',
            title: `SEVERE RESTRICTIONS SUFFOCATION: ${c.name}`,
            description: `${c.name} is experiencing violent economic contraction from strict sanctions imposed by ${c.economic.sanctionedBy.map(sid => countries[sid]?.name || sid).join(', ')}. Debt stress has peaked to ${Math.round(stress)}% alongside an elevated currency devaluation wave.`,
            whySurfaced: `Direct correlation of active sanction vectors against system currency market value decay, gdp decline rate, and sovereign risk stress coefficients.`,
            signalsUsed: ['Active trade embargo footprint', 'Systemic currency devaluation', 'GDP growth vector inversion'],
            severity: stress > 75 ? 'HIGH' : 'MED',
            confidence: 92,
            affectedActors: [id, ...c.economic.sanctionedBy],
            potentialConsequence: `Oligarch network loyalty revolt, hyperinflation cascade, total central bank cash liquidity exhaust.`,
            entities: {
              countries: [id, ...c.economic.sanctionedBy],
              edges: c.economic.sanctionedBy.map(sid => ({ source: sid, target: id, type: 'SANCTIONS' })),
            },
            recommendedView: {
              analysisMode: 'MAP',
              presetFocusMode: 'ECONOMIC',
              targetTab: 2, // Central Bank
            }
          });
        }
      }
    });

    // Filter insights based on assistance level limits to satisfy strict accessibility and settings requirements:
    // - MINIMAL: Only show HIGH priority warnings.
    // - ASSIST: Show MED and HIGH priority warnings.
    // - FULL: Show all (LOW, MED, HIGH) warnings.
    let filteredInsights = insights;
    if (get().assistanceLevel === 'MINIMAL') {
      filteredInsights = insights.filter(ins => ins.severity === 'HIGH');
    } else if (get().assistanceLevel === 'ASSIST') {
      filteredInsights = insights.filter(ins => ins.severity === 'HIGH' || ins.severity === 'MED');
    }

    // Apply active category filter if pipeline active
    const activePipeline = get().activePipeline;
    if (activePipeline) {
      filteredInsights = filteredInsights.filter(ins => ins.category === activePipeline);
    }

    set({ activeInsights: filteredInsights });
  }
}));
