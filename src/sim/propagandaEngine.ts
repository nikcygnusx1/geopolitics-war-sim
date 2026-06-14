import { WorldState } from '../types';
import { usePropagandaStore } from '../store/propagandaStore';
import { usePlayerStore } from '../store/playerStore';
import { useLeaderStore } from '../store/leaderStore';
import { ConsequenceEngine } from './consequenceEngine';

// SECTION 10: 10 Core Template Strings driven by active operation metadata
function generateHeraldHeadline(
  sourceName: string,
  targetName: string,
  spend: number,
  direction: string,
  opType: string,
  createdBy: 'PLAYER' | 'AI'
): string {
  const isHostile = direction === 'DESTABILIZE' || direction === 'ANTI_PLAYER';
  const isHighSpend = spend >= 1.5;

  if (createdBy === 'PLAYER') {
    if (isHostile) {
      if (isHighSpend) {
        // Headline templates 1 & 2
        return Math.random() < 0.5
          ? `NARRATIVE BREAKTHROUGH: ${sourceName} media networks leak severe government corruption files inside ${targetName}, sparking unrest.`
          : `INFORMATION BLITZKRIEG: Massive signal arrays from ${sourceName} saturate ${targetName} local routers with ${direction} core alignments.`;
      } else {
        // Headline templates 3 & 4
        return Math.random() < 0.5
          ? `CYBER CORROSION: Low-intensity ${direction} radio and forum campaigns sponsored by ${sourceName} are detected across ${targetName} provincial lines.`
          : `DISSIDENT SYNDICATE: Discontent brews in ${targetName} as sponsored ${direction} editorial columns bypass local censorship blocks.`;
      }
    } else {
      // Headline templates 5 & 6 (Regime stabilization / bolstering)
      return Math.random() < 0.5
        ? `REGIME ENVELOPE: Broad-spectrum media operations by ${sourceName} bolster state authorities inside ${targetName}, securing civic trust.`
        : `SENSORY SATURATION: State broadcasts in ${targetName} run high-fidelity ${direction} campaigns funded by regional allies to stabilize markets.`;
    }
  } else {
    // AI counter-propaganda (Headline templates 7 & 8)
    return Math.random() < 0.5
      ? `COVENANT SHIELD: State security networks of ${targetName} declare complete containment of foreign cognitive contamination.`
      : `REBUTTAL SATELLITE: ${sourceName} initiates aggressive counter-propaganda campaigns against ${targetName} after detecting deep espionage vectors.`;
  }
}

export function processSentiment(draft: WorldState) {
  const activeOps = usePropagandaStore.getState().activeOperations;
  const playerCountryId = usePlayerStore.getState().countryId;
  const currentTick = draft.currentTick;

  // Track narrative shifts to apply per country this tick
  const narrativeDeltas: Record<string, number> = {};
  const opsToCancel: string[] = [];
  const opUpdates: Record<string, { effectivenessPerTick: number; runtimeTicks: number }> = {};

  // 1. Process and fund active media operations
  activeOps.forEach((op) => {
    if (!op.active) return;

    const source = draft.countries[op.sourceCountryId];
    const target = draft.countries[op.targetCountryId];

    if (!source || !target) {
      opsToCancel.push(op.id);
      return;
    }

    // Cost verification and recurring deduction
    const cost = op.spendPerTick;
    if (source.economic.treasuryCashB < cost) {
      // Out of funds -> suspend operation
      opsToCancel.push(op.id);
      draft.globalEventLog.unshift({
        tick: currentTick,
        text: `💸 LOGISTICS EMBARGO: Narrative operations run by ${source.name} in ${target.name} suspended. treasury reserve cannot support the dedicated recurring spend of $${cost}B/tick.`,
        severity: 'WARNING'
      });
      return;
    }

    // Spend from treasury!
    source.economic.treasuryCashB = parseFloat((source.economic.treasuryCashB - cost).toFixed(3));

    // Exact mandatory formula: eff = (spendPerTick * 0.1) * (1 - target.mediaResistance)
    const resistance = target.mediaResistance ?? 0.5;
    const effectiveness = (cost * 0.1) * (1 - resistance);

    // Track effectiveness updates for the store
    const nextRuntimeTicks = (op.runtimeTicks ?? 0) + 1;
    opUpdates[op.id] = {
      effectivenessPerTick: parseFloat(effectiveness.toFixed(3)),
      runtimeTicks: nextRuntimeTicks,
    };

    // Resolve direction
    let directionMultiplier = 0;
    if (op.narrativeDirection === 'DESTABILIZE' || op.narrativeDirection === 'ANTI_PLAYER') {
      directionMultiplier = -1;
    } else if (op.narrativeDirection === 'STABILIZE' || op.narrativeDirection === 'PRO_PLAYER') {
      directionMultiplier = 1;
    }

    const netDelta = effectiveness * directionMultiplier;
    narrativeDeltas[op.targetCountryId] = (narrativeDeltas[op.targetCountryId] ?? 0) + netDelta;

    // --- Headline generation (Templates 1 to 8) on startup or periodically ---
    if (nextRuntimeTicks === 1 || nextRuntimeTicks % 6 === 0) {
      const headline = generateHeraldHeadline(
        source.name,
        target.name,
        op.spendPerTick,
        op.narrativeDirection,
        op.operationType,
        op.createdBy
      );
      draft.globalEventLog.unshift({
        tick: currentTick,
        text: headline,
        severity: op.createdBy === 'PLAYER' ? 'INFO' : 'WARNING',
      });
    }
  });

  // Periodically inject generic real-world atmosphere news (Headline templates 9 & 10)
  if (activeOps.filter(o => o.active).length > 0 && currentTick % 11 === 4) {
    const randomAtmosphere = Math.random() < 0.5
      ? `CYBER RECONNAISSANCE: Analysts report sharp escalation in narrative manipulation across multiple geopolitical blocks.`
      : `SOVEREIGN BLACKLIST: Global media regulatory body warns against systemic usage of mass persuasion networks.`;
    
    draft.globalEventLog.unshift({
      tick: currentTick,
      text: randomAtmosphere,
      severity: 'SYSTEM'
    });
  }

  // Defer all store synchronization safely
  if (Object.keys(opUpdates).length > 0 || opsToCancel.length > 0) {
    setTimeout(() => {
      usePropagandaStore.getState().updateOperationsTickState(opUpdates, opsToCancel);
    }, 0);
  }

  // 2. Apply general country stability drifts, approvals, and update domestic narratives
  Object.keys(draft.countries).forEach((id) => {
    const c = draft.countries[id];
    const pol = c.political;
    const econ = c.economic;

    // Initialize domestic narrative if undefined
    if (c.domesticNarrative === undefined) {
      c.domesticNarrative = pol.ideology === 'DEMOCRACY' ? 55 : pol.ideology === 'AUTOCRACY' ? 75 : 65;
    }
    if (c.mediaResistance === undefined) {
      c.mediaResistance = Math.max(0.15, Math.min(0.95, (pol.ideology === 'DEMOCRACY' ? 0.35 : pol.ideology === 'AUTOCRACY' ? 0.75 : 0.55) + (c.intelligence.signalIntelScore > 70 ? 0.15 : 0.05)));
    }

    // Apply accumulated active operations delta
    const opDelta = narrativeDeltas[id] ?? 0;
    c.recentNarrativeDelta = parseFloat(opDelta.toFixed(3));

    // Move domestic narrative by delta, clamped [0, 100]
    c.domesticNarrative = Math.max(0, Math.min(100, parseFloat((c.domesticNarrative + opDelta).toFixed(3))));

    // General media influence on popular leadership metrics (existing design)
    const mediaPower = pol.propagandaEffectiveness * (pol.censorship / 100);
    const domesticSpendingShift = (econ.spendingAllocation.propaganda * 15.0);
    let grossSentimentShift = (mediaPower * 0.05) + domesticSpendingShift + (opDelta * 0.5); // Operations drift approval

    let baseApproval = pol.leaderApprovalRating;
    baseApproval += (pol.stabilityIndex - baseApproval) * 0.04 + grossSentimentShift;
    baseApproval -= pol.popularUnrest * 0.15;

    // Active Oligarch corporate control on public messaging
    const loyalOligarchs = econ.oligarchs.filter((o) => o.loyalty > 60);
    loyalOligarchs.forEach((o) => {
      if (o.sector === 'MEDIA') {
        baseApproval += (o.influenceScore / 100) * 2;
      }
    });

    pol.leaderApprovalRating = Math.max(1, Math.min(100, Math.round(baseApproval)));

    // Periodic Elections for Democracies
    if (pol.ideology === 'DEMOCRACY') {
      if (pol.electionDueTick === undefined || pol.electionDueTick === 0) {
        pol.electionDueTick = currentTick + 30 + Math.floor(Math.random() * 20); // every 30-50 ticks
      }

      if (currentTick >= pol.electionDueTick) {
        // Run Election!
        const randVal = Math.random() * 100;
        // Re-election chance base on leader approval rating
        const reelectChance = pol.leaderApprovalRating;
        
        if (randVal < reelectChance) {
          // Current leader is re-elected! Set next due
          pol.electionDueTick = currentTick + 35 + Math.floor(Math.random() * 15);
          draft.globalEventLog.unshift({
            tick: currentTick,
            text: `🗳️ DEMOCRATIC ELECTION: Voters in ${c.name} have re-elected President ${pol.leaderName} with an approval rating of ${pol.leaderApprovalRating}%. Continues current geopolitical posture.`,
            severity: 'INFO',
          });
          c.lastEventLog.unshift(`President ${pol.leaderName} re-elected for a new term.`);
        } else {
          // Replaced by new leader
          const oldLeaderName = pol.leaderName;
          const newElected = useLeaderStore.getState().generateNewLeader(id, 'ELECTION', currentTick);
          useLeaderStore.getState().setLeader(id, newElected);
          pol.leaderName = newElected.name;
          pol.electionDueTick = currentTick + 35 + Math.floor(Math.random() * 15);
          
          ConsequenceEngine.register('REGIME_CHANGE', { sourceCountryId: id }, draft);
          
          draft.globalEventLog.unshift({
            tick: currentTick,
            text: `🗳️ DEMOCRATIC ELECTION: ${c.name} has elected a new leader! President ${newElected.name} (TEMPERAMENT: ${newElected.type}) replaces ${oldLeaderName}.`,
            severity: 'INFO',
          });
          c.lastEventLog.unshift(`President ${newElected.name} wins general election, taking command.`);
        }
      }
    }

    // Dynamic unrest decay or increase based on economy, approval and target narrative collapse
    let unrestDelta = 0;
    if (econ.inflationRate > 15) unrestDelta += 1.8;
    if (pol.leaderApprovalRating < 30) unrestDelta += 2.0;
    if (econ.unemploymentRate > 8.0) unrestDelta += 1.2;

    // Severe narrative manipulation spikes anger
    if (c.domesticNarrative < 35) {
      unrestDelta += (35 - c.domesticNarrative) * 0.15;
    }

    // Martial law dampening
    if (pol.martialLawActive) {
      unrestDelta -= 3.5;
    } else {
      unrestDelta -= (pol.stabilityIndex / 50); // General peaceful decay
    }

    pol.popularUnrest = Math.max(0, Math.min(100, Math.round((pol.popularUnrest + unrestDelta) * 10) / 10));

    // Decaying martial law duration
    if (pol.martialLawActive && pol.martialLawTicksRemaining > 0) {
      pol.martialLawTicksRemaining--;
      if (pol.martialLawTicksRemaining <= 0) {
        pol.martialLawActive = false;
        c.lastEventLog.unshift('Martial Law rescinded. Sovereign military units returned to barracks.');
      }
    }

    // --- SECTION 8: THRESHOLD CIVIL UNREST ENGINE ---
    if (c.domesticNarrative < 20) {
      if (!c.hasCivilUnrestTriggered) {
        c.hasCivilUnrestTriggered = true;
        draft.globalEventLog.unshift({
          tick: currentTick,
          text: `🚨 CIVIL UNREST EXPLODED: Public information trust in ${c.name} has completely collapsed (${c.domesticNarrative.toFixed(1)}%). Massive populist protests and riot divisions block city centers!`,
          severity: 'CRITICAL'
        });
        pol.popularUnrest = Math.min(100, pol.popularUnrest + 35);
        pol.stabilityIndex = Math.max(10, pol.stabilityIndex - 25);
      }
    } else if (c.domesticNarrative >= 30) {
      c.hasCivilUnrestTriggered = false; // Reset to allow re-trigger on subsequent degradation
    }

    // ELECTION INTERFERENCE ENGINE
    if (c.domesticNarrative > 80) {
      if (!c.hasElectionInterferenceTriggered) {
        c.hasElectionInterferenceTriggered = true;
        draft.globalEventLog.unshift({
          tick: currentTick,
          text: `🗳️ CHRONIC ELECTION INTERFERENCE: Narrative saturation of information in ${c.name} has exceeded critical defensive limits (${c.domesticNarrative.toFixed(1)}%). State electoral loops are compromised by synchronized external propaganda lines.`,
          severity: 'WARNING'
        });
        econ.gdpGrowthRate = Math.max(-3, econ.gdpGrowthRate - 1.2);
        pol.stabilityIndex = Math.max(30, pol.stabilityIndex - 10);
      }
    } else if (c.domesticNarrative <= 70) {
      c.hasElectionInterferenceTriggered = false; // Reset flag on stabilization
    }

    // --- SECTION 7: AI RESPONSIVE COUNTER-PROPAGANDA DECISION MECHANISM ---
    const hostilePlayerOpsOnSelf = activeOps.filter(
      (op) => op.targetCountryId === id && op.createdBy === 'PLAYER' && (op.narrativeDirection === 'DESTABILIZE' || op.narrativeDirection === 'ANTI_PLAYER')
    );

    if (id !== playerCountryId && hostilePlayerOpsOnSelf.length > 0) {
      const alreadyCounterOpposing = activeOps.some(
        (op) => op.sourceCountryId === id && op.targetCountryId === playerCountryId && op.createdBy === 'AI'
      );

      const hasTreasuryPower = c.economic.treasuryCashB > 5.0;

      if (hasTreasuryPower && !alreadyCounterOpposing) {
        // High likelihood to trigger counter-action if narrative drops, or default 25% chance
        const triggerRetaliation = (c.domesticNarrative < 45 && Math.random() < 0.50) || (Math.random() < 0.20);
        
        if (triggerRetaliation) {
          // Commit counter spend proportional to sovereignty wealth (clamped to 0.5 - 2.5)
          const defensiveSpend = Math.min(2.5, Math.max(0.6, parseFloat((c.economic.treasuryCashB * 0.08).toFixed(1))));

          setTimeout(() => {
            usePropagandaStore.getState().launchMediaOperation(
              id,
              playerCountryId,
              defensiveSpend,
              'DESTABILIZE',
              'COUNTER_PROPAGANDA',
              'AI'
            );
          }, 0);

          draft.globalEventLog.unshift({
            tick: currentTick,
            text: `🛰️ COUNTER-PROPAGANDA ACTIVATED: State intelligence networks of ${c.name} have launched retaliatory cyber-media operations in ${draft.countries[playerCountryId]?.name || 'Player Homeland'} to combat ongoing domestic subversion. ($${defensiveSpend}B/tick committed)`,
            severity: 'WARNING'
          });
        }
      }
    }
  });
}
