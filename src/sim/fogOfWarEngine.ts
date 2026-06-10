import { useFogOfWarStore } from '../store/fogOfWarStore';

export function processFogOfWar(currentTick: number) {
  // Advance tick-based decay
  useFogOfWarStore.getState().decayIntel(currentTick);
}
