import { useEffect, useRef } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { useDefconStore } from '../../store/defconStore';
import { usePlayerStore } from '../../store/playerStore';
import { useCinematicsStore } from '../../store/cinematicsStore';

export function CinematicsSyncController() {
  const currentTick = useWorldStore(s => s.currentTick);
  const activeStrikes = useWorldStore(s => s.activeStrikes);
  const defconLevel = useDefconStore(s => s.currentDefconLevel);
  const playerState = usePlayerStore(s => s);
  
  const { queueScene, activeScene, sceneQueue } = useCinematicsStore();
  
  const hasTriggeredNukeRef = useRef(false);
  const hasTriggeredGameOverRef = useRef(false);
  const lastPdbTick = useRef(-1);
  const hasTriggeredDefconRef = useRef<number | null>(null);

  useEffect(() => {
    // 1) DEFCON 1 TRIGGER
    if (defconLevel === 1 && hasTriggeredDefconRef.current !== 1) {
       hasTriggeredDefconRef.current = 1;
       queueScene({
         type: 'DEFCON_1_LOCKDOWN',
         totalPhases: 1, // Standard DEFCON scene phases
         isSkippable: false,
         blocksInput: true,
         phaseDurationMs: 4000,
         payload: {},
         autoAdvance: true
       });
    } else if (defconLevel !== 1) {
       hasTriggeredDefconRef.current = defconLevel;
    }

    // 2) PERIODIC PDB (every 10 ticks, skipping 0)
    if (currentTick > 0 && currentTick % 10 === 0 && lastPdbTick.current !== currentTick) {
      lastPdbTick.current = currentTick;
      queueScene({
         type: 'PRESIDENTIAL_DAILY_BRIEF',
         totalPhases: 4,
         isSkippable: true,
         blocksInput: true,
         phaseDurationMs: 99999, // manual advance or internal effect driven
         payload: { tick: currentTick },
         autoAdvance: false
      });
    }

    // 3) FIRST NUCLEAR IMPACT
    const impactfulStrikes = activeStrikes.filter(s => s.status === 'IMPACT');
    if (!hasTriggeredNukeRef.current && impactfulStrikes.length > 0) {
      hasTriggeredNukeRef.current = true;
      const firstStrike = impactfulStrikes[0];
      queueScene({
         type: 'NUCLEAR_EXCHANGE',
         totalPhases: 7,
         isSkippable: true,
         blocksInput: true,
         phaseDurationMs: 99999,
         payload: {
           targetCountry: firstStrike.targetCountryId,
           originCountry: firstStrike.sourceCountryId,
           weaponYield: '1.2',
           weaponType: 'MIRV ICBM',
           secondaryLaunches: activeStrikes.length - 1
         },
         autoAdvance: false
      });
    }

    // 4) GAME OVER
    if (!hasTriggeredGameOverRef.current) {
      if (playerState.victoryAchieved || playerState.aftermathType === 'VICTORY') {
        hasTriggeredGameOverRef.current = true;
        queueScene({
           type: 'GAME_OVER_VICTORY',
           totalPhases: 6,
           isSkippable: true,
           blocksInput: true,
           phaseDurationMs: 99999,
           payload: {},
           autoAdvance: false
        });
      } else if (playerState.aftermathType === 'DEFEAT') {
        hasTriggeredGameOverRef.current = true;
        queueScene({
           type: 'GAME_OVER_DEFEAT',
           totalPhases: 6,
           isSkippable: true,
           blocksInput: true,
           phaseDurationMs: 99999,
           payload: { reason: playerState.aftermathType },
           autoAdvance: false
        });
      }
    }

  }, [currentTick, activeStrikes, defconLevel, playerState.aftermathType, playerState.victoryAchieved, queueScene]);

  return null;
}
