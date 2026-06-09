import { WorldState, PlayerState, ScenarioId } from '../types';
import { SCENARIOS } from '../data/scenarios';
import { usePlayerStore } from '../store/playerStore';
import { useWorldStore } from '../store/worldStore';

export function pollScenarioStatus(world: WorldState, player: PlayerState) {
  const scId = player.activeScenario;
  const config = SCENARIOS[scId];
  if (!config || player.gameOver || player.victoryAchieved) return;

  const currentScenarioTick = world.currentTick - player.scenarioStartTick;

  // Let's copy state elements for polling
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

export function initScenario(scenarioId: ScenarioId, countryId: string) {
  // 1. Reset world state
  useWorldStore.getState().resetWorld();

  // 2. Setup player state
  usePlayerStore.getState().initPlayerScenario(scenarioId, countryId);

  // 3. Apply scenario-specific starting mutations inside world draft
  useWorldStore.getState().applyTickDelta((draft) => {
    // Sync currentTick start
    draft.currentTick = 0;
    
    const config = SCENARIOS[scenarioId];
    if (config && config.initialMutations) {
      config.initialMutations(draft, countryId);
    }

    draft.globalEventLog.unshift({
      tick: 0,
      text: `Sovereign Directive Activated: [${config.name}]. Sovereign state: ${countryId}. Clear theater parameters immediately.`,
      severity: 'SYSTEM',
    });
  });

  // 4. Final sync of player state cash B
  usePlayerStore.getState().syncCashFromCountry();
}
