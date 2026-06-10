import { WorldState } from '../types';
import { DefconLevel } from '../store/defconStore';

function countDirectThreats(world: WorldState, playerId: string): number {
  let count = 0;
  Object.keys(world.countries).forEach((id) => {
    if (id !== playerId) {
      const country = world.countries[id];
      // A direct threat is a country with hostile opinions towards player or at war
      if (country.atWarWith.includes(playerId) || (country.opinions && country.opinions[playerId] < -75)) {
        count++;
      }
    }
  });
  return count;
}

export function computeDefcon(world: WorldState, playerId: string): DefconLevel {
  const threats = countDirectThreats(world, playerId);
  const nuclearInFlight = world.activeStrikes && world.activeStrikes.some(s =>
    s.status === 'IN_FLIGHT' && (s.weaponType === 'ICBM' || s.weaponType === 'SLBM')
  );
  
  const playerCountry = world.countries[playerId];
  const playerAtWar = playerCountry ? playerCountry.atWarWith.length > 0 : false;
  
  const globalConflicts = Object.values(world.countries)
    .filter(c => c.atWarWith && c.atWarWith.length > 0).length;

  if (nuclearInFlight) return 1;
  if (playerAtWar && threats >= 2) return 2;
  if (playerAtWar || globalConflicts >= 4) return 3;
  if (threats >= 1 || globalConflicts >= 2) return 4;
  return 5;
}
