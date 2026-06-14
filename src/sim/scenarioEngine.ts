import { WorldState, PlayerState, ScenarioId, LeaderPersonality } from '../types';
import { SCENARIOS } from '../data/scenarios';
import { usePlayerStore } from '../store/playerStore';
import { useWorldStore } from '../store/worldStore';
import { useClockStore } from '../store/clockStore';
import { useUnitStore } from '../store/unitStore';

export function pollScenarioStatus(world: WorldState, player: PlayerState) {
  const durationMode = useClockStore.getState().durationMode;
  if (durationMode === 'ENDLESS') return;

  const scId = player.activeScenario;
  const config = SCENARIOS[scId];
  if (!config || player.gameOver || player.victoryAchieved) return;

  if (durationMode === 'TIMED') {
    const budget = useClockStore.getState().timedDurationTicks ?? 100;
    if (world.currentTick < budget) {
      return; // Do not check win/loss until budget is hit
    }
    // At budget, evaluate outcome
    const won = config.winCondition(world, player);
    if (won) {
      usePlayerStore.getState().setVictory(config.winMessage);
      useWorldStore.getState().addGlobalEvent(`TIMED OUTCOME: SUCCESS - ${config.winMessage}`, 'SYSTEM');
    } else {
      usePlayerStore.getState().setGameOver("TIMED RESOLUTION COMPLETE: Target objectives were not met within the tick budget.");
      useWorldStore.getState().addGlobalEvent(`TIMED OUTCOME: FAIL - Objectives not completed.`, 'CRITICAL');
    }
    return;
  }

  // Classic SCENARIO mode
  const won = config.winCondition(world, player);
  const lost = config.lossCondition(world, player);

  if (won) {
    usePlayerStore.getState().setVictory(config.winMessage);
    useWorldStore.getState().addGlobalEvent(`SCENARIO ACCOMPLISHED: ${config.winMessage}`, 'SYSTEM');
  } else if (lost) {
    usePlayerStore.getState().setGameOver(config.lossMessage);
    useWorldStore.getState().addGlobalEvent(`SCENARIO FIASCO: ${config.lossMessage}`, 'CRITICAL');
  }
}

export function initScenario(scenarioId: ScenarioId, countryId: string, leaderOverrides?: Record<string, LeaderPersonality>) {
  // 1. Reset world state
  useWorldStore.getState().resetWorld(leaderOverrides);

  // Reset and initialize tactical units state
  useUnitStore.getState().resetUnits();
  useUnitStore.getState().initializeUnits();

  // 2. Setup player state
  usePlayerStore.getState().initPlayerScenario(scenarioId, countryId);

  // 3. Apply scenario-specific starting mutations inside world draft
  useWorldStore.getState().applyTickDelta((draft) => {
    // Sync currentTick start
    draft.currentTick = 0;
    
    const config = SCENARIOS[scenarioId];
    if (config) {
      draft.pacingPreset = config.pacingPreset;
      if (config.initialMutations) {
        config.initialMutations(draft, countryId);
      }
    }

    draft.globalEventLog.unshift({
      tick: 0,
      text: `Sovereign Directive Activated: [${config?.name}]. Sovereign state: ${countryId}. Clear theater parameters immediately.`,
      severity: 'SYSTEM',
    });
  });

  // 4. Final sync of player state cash B
  usePlayerStore.getState().syncCashFromCountry();
}

