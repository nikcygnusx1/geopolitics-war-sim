import { useWorldStore } from '../store/worldStore';
import { usePlayerStore } from '../store/playerStore';
import { useClockStore } from '../store/clockStore';
import { useUnitStore } from '../store/unitStore';
import { useBlackMarketStore } from '../store/blackMarketStore';
import { useArachneStore } from '../store/arachneStore';
import { useGothamStore } from '../store/gothamStore';
import { useFoundryStore } from '../store/foundryStore';
import { useFinintStore } from '../store/finintStore';
import { useTradeStore } from '../store/tradeStore';
import { useEnergyStore } from '../store/energyStore';
import { useSanctionsStore } from '../store/sanctionsStore';
import { useUNStore } from '../store/unStore';
import { useBlocStore } from '../store/blocStore';
import { useSoftPowerStore } from '../store/softPowerStore';
import { pollScenarioStatus } from './scenarioEngine';
import { processFactions } from './factionEngine';
import { processFiscal } from './fiscalEngine';
import { processMarkets } from './commodityEngine';
import { advanceStrikes } from './militaryEngine';
import { processRelations } from './diplomaticEngine';
import { processSentiment } from './propagandaEngine';
import { processAllAI } from './aiDecisionEngine';
import { processComplexPhase2Geopolitics } from './geopoliticalEngine';
import { CovertOp, WorldState } from '../types';
import { dampenOpinionDelta } from '../utils/pacing';
import { ConsequenceEngine } from './consequenceEngine';
import { saveAutosaveScenario } from '../utils/persistence';

export const TICK_INTERVALS: Record<"day" | "week" | "month", number> = {
  day: 2000,
  week: 3500,
  month: 6000
};

let tickIntervalId: any = null;

export function restartTickTimer() {
  if (tickIntervalId) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }

  const speed = usePlayerStore.getState().tickSpeed;
  if (speed === 'PAUSED') return;

  const rawDuration = useClockStore.getState().tickDuration ?? "WEEK";
  const tickDuration = rawDuration.toLowerCase() as "day" | "week" | "month";
  const interval = TICK_INTERVALS[tickDuration] ?? 2000;

  let delay = interval;
  if (speed === 'FAST') delay = Math.round(interval / 2.5);
  if (speed === 'ULTRA') delay = Math.round(interval / 5.5);

  tickIntervalId = setInterval(() => {
    executeSimulationStep();
  }, delay);
}


export function stopTickTimer() {
  if (tickIntervalId) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }
}

export function executeSimulationStep() {
  const world = useWorldStore.getState();
  const player = usePlayerStore.getState();

  if (player.gameOver || player.victoryAchieved || player.aftermathActive) {
    stopTickTimer();
    return;
  }

  // Execute all calculation engines in precise order within a single atomic update.
  world.applyTickDelta((draft) => {
    draft.currentTick++;

    // 1. Process scenarios win/loss
    pollScenarioStatus(draft, player);

    // 2. Process internal faction mechanics, Coups and Civil Wars
    processFactions(draft);

    // 3. Process taxes, corporate spending, debt service, cash printed, GDP
    processFiscal(draft);

    // 4. Process commodity markets spot price drift & resource shocks
    processMarkets(draft);

    // 5. Advance ballistic strikes in flight & defensive shield interceptions
    advanceStrikes(draft);

    // 6. Process relationship drifts, alliance changes, trade partners, and tariffs
    processRelations(draft);

    // 7. Process propaganda, mass-media metrics, and state approval ratings
    processSentiment(draft);

    // 8. Process non-player autonomous decisions & hostile retorts
    processAllAI(draft, player.countryId);

    // 9. Process signals covert actions & satellite reconnaissance sweeps
    advanceCovertIntelligenceOps(draft, player.countryId);

    // 10. Process Phase 2 evolved Geopolitical, Population, Cabinet, Sectors, and Provinces systems
    processComplexPhase2Geopolitics(draft, player.countryId);

    // T3.5 Consequence core engine tick integration
    ConsequenceEngine.tick(draft.currentTick, draft);
  });

  // Advance deployable tactical units position state
  useUnitStore.getState().updateUnitPositions(useWorldStore.getState().currentTick);

  // T3.3 Black Market ticker integration
  useBlackMarketStore.getState().tickMarket(useWorldStore.getState().currentTick);

  // Keep clock store in lock-step with simulation ticks
  useClockStore.getState().advanceTick();

  // 10. Sync player's cash levels with their nation's real treasury reserves
  usePlayerStore.getState().syncCashFromCountry();
  usePlayerStore.setState((state) => ({ totalTicks: state.totalTicks + 1 }));

  // Dynamic live briefing update for Arachne
  useArachneStore.getState().tickArachne(useWorldStore.getState().currentTick);

  // Synchronize Gotham Relationship Graph states and capture snapshot history
  useGothamStore.getState().tickGotham(useWorldStore.getState().currentTick);

  // Synchronize Foundry supply chain intelligence systems
  useFoundryStore.getState().tickFoundry(useWorldStore.getState().currentTick);

  // Synchronize financial-intelligence and capital networks
  useFinintStore.getState().tickFinint(useWorldStore.getState().currentTick);

  // Synchronize Trade Matrix and Route Systems
  useTradeStore.getState().tickTradeSystem(useWorldStore.getState().currentTick);

  // Synchronize Energy Security and Supply Models
  useEnergyStore.getState().tickEnergySystem(useWorldStore.getState().currentTick);

  // Synchronize Sanctions, Coalitions, and Evasion Models
  useSanctionsStore.getState().tickSanctionsSystem(useWorldStore.getState().currentTick);

  // Synchronize UN Security Council and Legal Systems
  useUNStore.getState().tickUNSystem(useWorldStore.getState().currentTick);

  // Synchronize Regional Blocs and Institutions System
  useBlocStore.getState().tickBlocSystem(useWorldStore.getState().currentTick);

  // Synchronize Soft Power and Symbolic Influence System
  useSoftPowerStore.getState().tickSoftPowerSystem(useWorldStore.getState().currentTick);

  // Regularly save a checkpoint if there is no ongoing nuclear exchange or active aftermath
  const currentWorld = useWorldStore.getState();
  const currentPlayer = usePlayerStore.getState();
  if (!currentWorld.nuclearExchangeOccurred && !currentPlayer.aftermathActive) {
    currentPlayer.saveCheckpoint();
    saveAutosaveScenario().catch(console.error);
  }
}

function advanceCovertIntelligenceOps(draft: WorldState, playerCountryId: string) {
  Object.keys(draft.countries).forEach((id) => {
    const c = draft.countries[id];
    const intel = c.intelligence;

    intel.activeCovertOps.forEach((op: CovertOp) => {
      if (op.status !== 'ACTIVE') return;

      op.remainingTicks--;

      if (op.remainingTicks <= 0) {
        // Resolve mission
        const successRoll = Math.random() * 100;

        if (successRoll < op.successProbability) {
          op.status = 'SUCCESS';

          const target = draft.countries[op.targetCountryId];
          if (target) {
            // Apply targeted damage based on covert op type
            switch (op.type) {
              case 'HACK_GRID':
                target.political.popularUnrest = Math.min(100, target.political.popularUnrest + 22);
                target.political.stabilityIndex = Math.max(0, target.political.stabilityIndex - 18);
                break;
              case 'FINANCIAL_ATTACK':
                target.economic.treasuryCashB = Math.max(0, target.economic.treasuryCashB - 50.0);
                break;
              case 'ELECTION_RIG':
                target.political.leaderApprovalRating = Math.max(1, target.political.leaderApprovalRating - 25);
                target.political.popularUnrest = Math.min(100, target.political.popularUnrest + 15);
                break;
              case 'SABOTAGE_OIL':
                target.economic.gdpGrowthRate *= 0.90;
                break;
              case 'ASSASSINATE_LEADER':
                target.political.stabilityIndex = Math.max(5, target.political.stabilityIndex - 35);
                target.political.leaderName = `Interim Caretaker Council`;
                break;
              case 'PLANT_PROPAGANDA':
                target.political.leaderApprovalRating = Math.max(1, target.political.leaderApprovalRating - 15);
                break;
              case 'FUND_REBELS':
                const faction = target.political.factions.find(f => f.type === 'MILITARY_HARDLINERS' || f.type === 'REFORMERS');
                if (faction) faction.strengthIndex = Math.min(100, faction.strengthIndex + 25);
                break;
            }
            target.lastEventLog.unshift(`Intelligence Breach: Covert agent operations of type ${op.type} succeeded! Code damage recorded.`);
          }

          if (id === playerCountryId) {
            draft.globalEventLog.unshift({
              tick: draft.currentTick,
              text: `SUCCESS DIRECTIVE: Sovereign covert task ${op.type} on target ${op.targetCountryId} reports full mission success.`,
              severity: 'INFO',
            });
          }
        } else {
          // Failed operation
          op.status = 'FAILED';

          // Roll for blowback risk
          const blowbackRoll = Math.random() * 100;
          if (blowbackRoll < op.blowbackRisk) {
            op.status = 'BLOWN';

            const target = draft.countries[op.targetCountryId];
            if (target) {
              const drop = dampenOpinionDelta(-40, draft.pacingPreset);
              target.opinions[id] = Math.max(-100, (target.opinions[id] ?? 0) + drop);
              target.lastEventLog.unshift(`Counter-Espionage: Exposed and captured clandestine assets linked to ${id}!`);
            }

            draft.globalEventLog.unshift({
              tick: draft.currentTick,
              text: `TACTICAL FAILURE: Blown Covert op! target country ${op.targetCountryId} exposed our assets in operation ${op.type}. Bilateral opinions drop -40.`,
              severity: 'CRITICAL',
            });
          } else {
            if (id === playerCountryId) {
              draft.globalEventLog.unshift({
                tick: draft.currentTick,
                text: `DIRECTIVE REPORT: Covert operation ${op.type} on target ${op.targetCountryId} failed, but assets retreated untraced.`,
                severity: 'WARNING',
              });
            }
          }
        }
      }
    });

    // Clean completed ops
    intel.activeCovertOps = intel.activeCovertOps.filter((op) => op.status === 'ACTIVE' || op.status === 'BLOWN');
  });
}
