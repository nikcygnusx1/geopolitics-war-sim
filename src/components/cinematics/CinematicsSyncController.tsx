import { useEffect, useRef } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useCinematicQueue } from './useCinematicQueue';
import { Country, BallisticStrike } from '../../types';
import { audio } from '../../utils/audio';

export default function CinematicsSyncController() {
  const enqueueCinematic = useCinematicQueue((s) => s.enqueueCinematic);
  const playerCountryId = usePlayerStore((s) => s.countryId);

  const prevCountriesRef = useRef<Record<string, Country> | null>(null);
  const prevStrikesRef = useRef<BallisticStrike[]>([]);

  useEffect(() => {
    // Pre-populate refs with the starting state immediately on mount
    const state = useWorldStore.getState();
    prevCountriesRef.current = JSON.parse(JSON.stringify(state.countries));
    prevStrikesRef.current = JSON.parse(JSON.stringify(state.activeStrikes));

    // Subscribe to state transactions safely
    const unsubscribe = useWorldStore.subscribe((state) => {
      const prevCountries = prevCountriesRef.current;
      const prevStrikes = prevStrikesRef.current;

      if (!prevCountries) {
        prevCountriesRef.current = JSON.parse(JSON.stringify(state.countries));
        prevStrikesRef.current = JSON.parse(JSON.stringify(state.activeStrikes));
        return;
      }

      // 1. DETECT WAR DECLARATIONS AND CEASEFIRES (PEACE)
      Object.keys(state.countries).forEach((cId) => {
        const prevC = prevCountries[cId];
        const nextC = state.countries[cId];
        if (!prevC || !nextC) return;

        const prevWar = prevC.atWarWith || [];
        const nextWar = nextC.atWarWith || [];

        // WAR DECLARATION
        nextWar.forEach((enemyId) => {
          if (!prevWar.includes(enemyId)) {
            // Unify mutual triggers (only process if lexicographically cId < enemyId to prevent double trigger)
            if (cId < enemyId) {
              const srcC = state.countries[cId];
              const tgtC = state.countries[enemyId];
              enqueueCinematic('WAR_DECLARATION', {
                sourceCountry: srcC ? { id: cId, name: srcC.name, flagEmoji: srcC.flagEmoji } : undefined,
                targetCountry: tgtC ? { id: enemyId, name: tgtC.name, flagEmoji: tgtC.flagEmoji } : undefined,
              });
              audio.sfxWarKlaxon();
            }
          }
        });

        // PEACE AGREEMENT
        prevWar.forEach((enemyId) => {
          if (!nextWar.includes(enemyId)) {
            if (cId < enemyId) {
              const srcC = state.countries[cId];
              const tgtC = state.countries[enemyId];
              enqueueCinematic('PEACE_AGREEMENT', {
                sourceCountry: srcC ? { id: cId, name: srcC.name, flagEmoji: srcC.flagEmoji } : undefined,
                targetCountry: tgtC ? { id: enemyId, name: tgtC.name, flagEmoji: tgtC.flagEmoji } : undefined,
              });
              audio.sfxPeaceResolution();
            }
          }
        });
      });

      // 2. DETECT COUPS
      Object.keys(state.countries).forEach((cId) => {
        const prevC = prevCountries[cId];
        const nextC = state.countries[cId];
        if (!prevC || !nextC) return;

        const prevLeader = prevC.political?.leaderName;
        const nextLeader = nextC.political?.leaderName;

        if (prevLeader && nextLeader && prevLeader !== nextLeader) {
          enqueueCinematic('COUP', {
            targetCountry: { id: cId, name: nextC.name, flagEmoji: nextC.flagEmoji },
            leaderName: nextLeader,
            oldLeaderName: prevLeader,
          });
          audio.sfxCoupStaticBurst();
        }
      });

      // 3. DETECT ECONOMIC DEFAULTS (TREASURY < 1.0)
      if (playerCountryId) {
        const prevPlayerC = prevCountries[playerCountryId];
        const nextPlayerC = state.countries[playerCountryId];
        if (prevPlayerC && nextPlayerC) {
          const prevCash = prevPlayerC.economic?.treasuryCashB ?? 10;
          const nextCash = nextPlayerC.economic?.treasuryCashB ?? 10;

          if (prevCash >= 1.0 && nextCash < 1.0) {
            enqueueCinematic('ECONOMIC_COLLAPSE', {
              targetCountry: { id: playerCountryId, name: nextPlayerC.name, flagEmoji: nextPlayerC.flagEmoji },
              details: 'Treasury funds depleted below emergency stability baseline.',
            });
          }
        }
      }

      // 4. DETECT NUCLEAR MISSILE LAUNCHES
      state.activeStrikes.forEach((strike) => {
        const isNew = !prevStrikes.some((ps) => ps.id === strike.id);
        if (isNew) {
          const isNuclear =
            (strike.warheadYieldMT && strike.warheadYieldMT > 0) ||
            strike.weaponType?.includes('ICBM') ||
            strike.weaponType?.includes('SLBM');

          if (isNuclear) {
            const srcC = state.countries[strike.sourceCountryId];
            const tgtC = state.countries[strike.targetCountryId];
            enqueueCinematic('NUCLEAR_LAUNCH', {
              sourceCountry: srcC ? { id: strike.sourceCountryId, name: srcC.name, flagEmoji: srcC.flagEmoji } : undefined,
              targetCountry: tgtC ? { id: strike.targetCountryId, name: tgtC.name, flagEmoji: tgtC.flagEmoji } : undefined,
            });
          }
        }
      });

      // update standard checkpoint variables
      prevCountriesRef.current = JSON.parse(JSON.stringify(state.countries));
      prevStrikesRef.current = JSON.parse(JSON.stringify(state.activeStrikes));
    });

    return () => {
      unsubscribe();
    };
  }, [playerCountryId, enqueueCinematic]);

  return null;
}
