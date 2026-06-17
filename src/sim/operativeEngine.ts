import { useOperativeStore } from '../store/operativeStore';
import { useWorldStore } from '../store/worldStore';
import { useUIStore } from '../store/uiStore';
import { Operative, Cell, Handler } from '../types/operative';

// ==========================================
// T5.1 - OPERATIVE NETWORK ENGINE
// ==========================================

export function processOperativeNetwork(tick: number) {
  const store = useOperativeStore.getState();
  const worldStore = useWorldStore.getState();
  const pushAlert = useUIStore.getState().pushAlert;
  
  const { operatives, handlers, cells, networkGraph } = store;

  // 1. Process Handlers
  Object.values(handlers).forEach(handler => {
    // If a handler's trust drops, affects cells
    if (handler.state === 'COMPROMISED') {
      // Find cells managed by handler
      const managedCells = Object.values(cells).filter(c => c.handlerId === handler.id);
      managedCells.forEach(cell => {
         // Compromise cascade to cells
         const cellOperatives = Object.values(operatives).filter(o => o.cellId === cell.id);
         cellOperatives.forEach(op => {
           if (op.state !== 'BURNED' && op.state !== 'COMPROMISED') {
             store.updateOperative(op.id, {
               stress: Math.min(100, op.stress + 15),
               burnRisk: Math.min(100, op.burnRisk + 20)
             });
           }
         });
      });
    }
  });

  // 2. Process Cells
  // Cells with high exposure boundaries mitigate risks

  // 3. Process Operatives
  Object.values(operatives).forEach(op => {
    if (op.state === 'BURNED' || op.state === 'EXTRACTED') return;

    let newStress = op.stress;
    let newLoyalty = op.loyalty;
    let newBurnRisk = op.burnRisk;

    // Movement / State changes
    const isDormant = op.state === 'DORMANT';
    const isCompromised = op.state === 'COMPROMISED';

    // Stress mechanics
    if (isCompromised) {
      newStress += 5; // Passive stress drain
    } else if (op.currentAssignment) {
      newStress += 2; // Active usage stress
    } else if (isDormant) {
      newStress -= 3; // Cooldown
    }

    // Cover Type impact on Burn Risk
    if (!isDormant) {
      if (op.coverType === 'DIPLOMATIC') {
        newBurnRisk += 0.5; // High visibility
      } else if (op.coverType === 'CRIMINAL') {
        newBurnRisk += 1; // High danger
      } else if (op.coverType === 'COMMERCIAL') {
        newBurnRisk -= 0.1; // Stable
      }
    } else {
      newBurnRisk -= 2; // Cool down faster
    }
    
    // Loyalty mechanics
    const topMotivation = Object.entries(op.motivationProfile).sort((a,b) => b[1] - a[1])[0];
    if (topMotivation[0] === 'IDEOLOGY') {
      // Very stable
      if (newStress > 80) newLoyalty -= 1;
    } else if (topMotivation[0] === 'MONEY') {
      if (!op.currentAssignment && !isDormant) newLoyalty -= 2; // Wanting action/pay
    } else if (topMotivation[0] === 'COERCION') {
      if (newStress > 60) newLoyalty -= 3; // Rapid collapse
    } else if (topMotivation[0] === 'EGO') {
      newLoyalty += 1; // Rebuilds fast, drops on insult
    }

    // Network effects (Cascade Check)
    if (newBurnRisk > 90 && !isCompromised) {
      store.updateOperative(op.id, { state: 'COMPROMISED' });
      pushAlert({
        title: `OPERATIVE COMPROMISED: ${op.alias}`,
        message: `Burn risk exceeded safe thresholds. Local counter-intelligence has identified ${op.alias}.`,
        type: 'WARNING'
      });
      // Trigger Cascade
      triggerCascade(op.id, tick, store, pushAlert);
    }

    // Clamp 
    newStress = Math.max(0, Math.min(100, newStress));
    newLoyalty = Math.max(0, Math.min(100, newLoyalty));
    newBurnRisk = Math.max(0, Math.min(100, newBurnRisk));

    // Update
    store.updateOperative(op.id, {
      stress: newStress,
      loyalty: newLoyalty,
      burnRisk: newBurnRisk
    });
  });
}

function triggerCascade(
  compromisedId: string, 
  tick: number, 
  store: ReturnType<typeof useOperativeStore.getState>,
  pushAlert: (alert: any) => void
) {
  const op = store.operatives[compromisedId];
  if (!op) return;

  const cell = op.cellId ? store.cells[op.cellId] : null;
  const mitigate = cell ? cell.exposureBoundary / 100 : 0;

  // Find linked nodes
  const linkedNodes = store.networkGraph.links
    .filter(l => l.source === compromisedId || l.target === compromisedId)
    .map(l => l.source === compromisedId ? l.target : l.source);

  linkedNodes.forEach(linkId => {
    const targetOp = store.operatives[linkId];
    if (!targetOp || targetOp.state === 'BURNED') return;

    const evasionRoll = Math.random();
    if (evasionRoll > mitigate) {
      // Burn propagates
      store.exposeOperative(linkId, `Associated with compromised asset ${op.alias}`, tick);
      store.updateOperative(linkId, { burnRisk: Math.min(100, targetOp.burnRisk + 30) });

      if (targetOp.burnRisk > 70) {
        pushAlert({
          title: `COMPROMISE SPREAD`,
          message: `Cascade failure from ${op.alias} has exposed ${targetOp.alias}.`,
          type: 'DANGER'
        });
      }
    }
  });
}

// Generate an Operative
export function generateOperative(baseId: string, region: string): Operative {
  const seed = Math.random();
  return {
    id: `op_${baseId}_${Math.floor(seed * 10000)}`,
    name: `Agent ${Math.floor(seed * 999)}`,
    alias: `Phantom-${Math.floor(seed * 99)}`,
    trueIdentity: null,
    cellId: null,
    handlerId: null,
    regionOfOperation: region,
    regionFamiliarity: { [region]: 80 + Math.floor(Math.random() * 20) },
    coverType: 'COMMERCIAL',
    coverQuality: 60 + Math.floor(Math.random() * 30),
    coverExposureRisk: 10 + Math.floor(Math.random() * 20),
    coverConsistency: 80,
    skills: {
      SURVEILLANCE: 50 + Math.floor(Math.random() * 40),
      RECRUITMENT: 40 + Math.floor(Math.random() * 40),
      SABOTAGE: 30 + Math.floor(Math.random() * 50),
      INFILTRATION: 60 + Math.floor(Math.random() * 30),
      TECHNICAL_COLLECTION: 40 + Math.floor(Math.random() * 40),
      COUNTER_SURVEILLANCE: 50 + Math.floor(Math.random() * 40),
      EXFILTRATION_SUPPORT: 40 + Math.floor(Math.random() * 40),
      INFLUENCE_PERSUASION: 50 + Math.floor(Math.random() * 40),
      DECEPTION_HANDLING: 60 + Math.floor(Math.random() * 30),
      REGION_NAVIGATION: 70 + Math.floor(Math.random() * 20)
    },
    loyalty: 70 + Math.floor(Math.random() * 30),
    stress: Math.floor(Math.random() * 20),
    burnRisk: Math.floor(Math.random() * 15),
    exposureLevel: 0,
    accessLevel: 20 + Math.floor(Math.random() * 60),
    motivationProfile: {
      IDEOLOGY: Math.floor(Math.random() * 100),
      MONEY: Math.floor(Math.random() * 100),
      COERCION: Math.floor(Math.random() * 100),
      EGO: Math.floor(Math.random() * 100)
    },
    leverageProfile: [],
    recruitmentSource: 'IDEOLOGY',
    lastContactTick: 0,
    lastMissionTick: 0,
    state: 'DORMANT',
    compromiseHistory: [],
    missionHistory: [],
    operationalValue: 50 + Math.floor(Math.random() * 50),
    reliability: 50 + Math.floor(Math.random() * 50),
    volatility: Math.floor(Math.random() * 50),
    currentAssignment: null
  };
}
