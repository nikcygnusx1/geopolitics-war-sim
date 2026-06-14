import { WorldState, Country, WeaponType } from '../types';
import { getTickIncrement } from './militaryEngine';
import { GEO_COORDS } from '../data/geoCoords';
import { useLeaderStore } from '../store/leaderStore';
import { ConsequenceEngine } from './consequenceEngine';

export function processAllAI(draft: WorldState, playerCountryId: string) {
  Object.keys(draft.countries).forEach((id) => {
    if (id === playerCountryId) return; // Skip human player

    const c = draft.countries[id];
    if (!c) return;

    assessAndExecuteAIDecisions(draft, c, playerCountryId);
  });
}

function assessAndExecuteAIDecisions(draft: WorldState, c: Country, playerCountryId: string) {
  const econ = c.economic;
  const pol = c.political;
  const ids = Object.keys(draft.countries);

  // Pacing Preset integration
  const preset = draft.pacingPreset;
  const earlyGameProtection = preset ? preset.earlyGameProtection : 20;
  const warDeclarationCooldown = preset ? preset.warDeclarationCooldown : 25;

  const isProtected = draft.currentTick < earlyGameProtection;
  const isCooldownActive = draft.lastWarDeclarationTick !== undefined && 
                           (draft.currentTick - draft.lastWarDeclarationTick < warDeclarationCooldown);
  
  const canDeclareWar = !isProtected && !isCooldownActive;

  // 1. Identify perceived threats (low opinion < -70)
  const perceivedThreats = ids.filter((oId) => {
    if (oId === c.id) return false;
    const op = c.opinions[oId] ?? 0;
    return op < -70; // We changed -45 to -70 to be completely compliant!
  });

  const highestThreatId = perceivedThreats.sort((x, y) => {
    const opX = c.opinions[x] ?? 0;
    const opY = c.opinions[y] ?? 0;
    return opX - opY; // lowest opinion first
  })[0] || 'US';

  // Retrieve authoritative leader indicators & modifiers
  const leaderStore = useLeaderStore.getState();
  const leader = leaderStore.getLeader(c.id);
  const leaderMods = leaderStore.getLeaderModifiers(c.id, highestThreatId, draft.currentTick);

  // 2. Score candidate actions
  const milFaction = pol.factions.find((f) => f.type === 'MILITARY_HARDLINERS');
  const reformerFaction = pol.factions.find((f) => f.type === 'REFORMERS');

  const milMultiplier = milFaction ? (1.0 + milFaction.strengthIndex / 100) : 1.0;
  const reformerMultiplier = reformerFaction ? (1.0 - reformerFaction.strengthIndex / 100) : 1.0;

  // Custom variable war threshold from leader personality (-70 base +/- delta)
  const varWarThreshold = -70 - leaderMods.warThresholdDelta;

  const decisions = [
    {
      action: 'IMPROVE_DEFENSES',
      score: econ.debtStressIndex < 60 ? Math.round((35 + pol.coupRiskLevel * 0.4) * (2.0 - leaderMods.riskToleranceMultiplier)) : 5,
    },
    {
      action: 'NEGOTIATE_ALLIANCE',
      score: perceivedThreats.length > 0 ? Math.round((20 + perceivedThreats.length * 15) * leaderMods.diplomacyAcceptMultiplier) : 10,
    },
    {
      action: 'ISSUE_BONDS',
      score: (econ.treasuryCashB < 15 && econ.debtStressIndex < 70) ? 55 : 5,
    },
    {
      action: 'LAUNCH_COVERT_OP',
      score: (c.intelligence.blackBudgetB > 5 && perceivedThreats.length > 0) ? Math.round(45 * leaderMods.riskToleranceMultiplier) : 10,
    },
    {
      action: 'DECLARE_WAR',
      score: (canDeclareWar && c.opinions[highestThreatId] < varWarThreshold && c.arsenal.totalPowerRating > 500 && pol.popularUnrest < 50)
        ? Math.round(50 * milMultiplier * reformerMultiplier * leaderMods.escalationRate) : 0,
    },
    {
      action: 'FIRE_MISSILE',
      score: (c.atWarWith.includes(highestThreatId) && econ.treasuryCashB > 0 && Math.random() < (0.25 * leaderMods.riskToleranceMultiplier))
        ? Math.round(75 * milMultiplier * leaderMods.retaliationBias) : 0,
    },
    {
      action: 'SEEK_CEASEFIRE',
      score: (c.atWarWith.length > 0 && pol.stabilityIndex < 30) ? Math.round(80 * (2.0 - leaderMods.riskToleranceMultiplier)) : 5,
    },
    {
      action: 'SANCTION_TARGET',
      score: (c.opinions[highestThreatId] < -45 && !draft.countries[highestThreatId]?.economic.sanctionedBy.includes(c.id))
        ? Math.round(40 * leaderMods.sanctionsLikelihoodMultiplier * (milFaction ? (1.0 + milFaction.strengthIndex / 120) : 1.0)) : 0,
    },
    {
      action: 'PRINT_MONEY',
      score: (econ.treasuryCashB < 10 && econ.debtStressIndex < 85) ? 40 : 5,
    },
    {
      action: 'PURGE_FACTION',
      score: pol.coupRiskLevel > 65 ? (30 + pol.coupRiskLevel * 0.6) : 0,
    }
  ];

  // Pick highest-scoring action
  const best = decisions.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score <= 10) return;

  // 3. Execute chosen AI action
  switch (best.action) {
    case 'IMPROVE_DEFENSES':
      c.arsenal.abmShieldStrength = Math.min(95, c.arsenal.abmShieldStrength + 3);
      econ.treasuryCashB = Math.max(0, econ.treasuryCashB - 5);
      break;

    case 'NEGOTIATE_ALLIANCE':
      const candidates = ids.filter((oId) => oId !== c.id && c.opinions[oId] > 35);
      if (candidates.length > 0) {
        const ally = candidates[0];
        c.opinions[ally] = Math.min(100, (c.opinions[ally] || 0) + 15);
        if (draft.countries[ally]) {
          draft.countries[ally].opinions[c.id] = Math.min(100, (draft.countries[ally].opinions[c.id] || 0) + 15);
        }
        
        const allyNation = draft.countries[ally];
        if (allyNation) {
          if (!draft.aiOperationsLog) draft.aiOperationsLog = [];
          draft.aiOperationsLog.unshift({
            tick: draft.currentTick,
            countryId: c.id,
            countryName: c.name,
            action: 'Secret Coalition Treaty',
            targetCountryId: ally,
            targetCountryName: allyNation.name,
            description: `Drafted mutual military defense support pacts and strategic tech cooperative protocols.`,
            secrecyScore: 78,
            impactScore: 50,
          });
        }
      }
      break;

    case 'ISSUE_BONDS':
      econ.treasuryCashB += 40.0;
      econ.debtToGdpRatio += 15.0;
      econ.bonds.push({
        id: `bond_ai_${c.id}_${Math.random().toString().substring(2,6)}`,
        amount: 40.0,
        interestRate: econ.interestRate + 2.0,
        maturityTicks: 40,
        remainingTicks: 40,
        holder: 'MARKET',
      });
      break;

    case 'LAUNCH_COVERT_OP':
      if (c.intelligence.blackBudgetB >= 3) {
        c.intelligence.blackBudgetB -= 3;
        const targetNation = draft.countries[highestThreatId];
        if (targetNation) {
          targetNation.political.popularUnrest = Math.min(100, targetNation.political.popularUnrest + 10);
          targetNation.political.stabilityIndex = Math.max(0, targetNation.political.stabilityIndex - 5);
          targetNation.lastEventLog.unshift(`Covert signals breached! High popular unrest sparked by foreign influence.`);
          ConsequenceEngine.register('STAGE_COUP', { sourceCountryId: c.id, targetCountryId: highestThreatId }, draft);

          if (!draft.aiOperationsLog) draft.aiOperationsLog = [];
          draft.aiOperationsLog.unshift({
            tick: draft.currentTick,
            countryId: c.id,
            countryName: c.name,
            action: 'Subversive Signals Infiltration',
            targetCountryId: highestThreatId,
            targetCountryName: targetNation.name,
            description: `Breached media and signal channels to fuel internal popular unrest and destabilize civilian leadership.`,
            secrecyScore: 92,
            impactScore: 65,
          });
        }
      }
      break;

    case 'DECLARE_WAR':
      if (canDeclareWar && !c.atWarWith.includes(highestThreatId)) {
        c.atWarWith.push(highestThreatId);
        const target = draft.countries[highestThreatId];
        if (target && !target.atWarWith.includes(c.id)) {
          target.atWarWith.push(c.id);
        }
        draft.lastWarDeclarationTick = draft.currentTick;
        draft.globalEventLog.unshift({
          tick: draft.currentTick,
          text: `CONFIRMATION WAR: Hostilities formally declared by ${c.name} against hostile node ${highestThreatId}!`,
          severity: 'CRITICAL',
        });
        ConsequenceEngine.register('DECLARE_WAR', { sourceCountryId: c.id, targetCountryId: highestThreatId }, draft);

        if (target) {
          if (!draft.aiOperationsLog) draft.aiOperationsLog = [];
          draft.aiOperationsLog.unshift({
            tick: draft.currentTick,
            countryId: c.id,
            countryName: c.name,
            action: 'Full-Scale War Mobilization',
            targetCountryId: highestThreatId,
            targetCountryName: target.name,
            description: `Terminated bilateral dialogue and declared active martial deployment on theater borders.`,
            secrecyScore: 10,
            impactScore: 90,
          });
        }
      }
      break;

    case 'FIRE_MISSILE':
      const activeType = c.arsenal.units.find((u) => u.count > 0 && u.operational > 0);
      if (activeType && c.economic.treasuryCashB >= 5) {
        activeType.count--;
        activeType.operational--;
        c.economic.treasuryCashB -= 5;

        // Draw launch parameters
        const isNuke = activeType.type === 'ICBM' || activeType.type === 'SLBM' || activeType.type === 'HYPERSONIC';
        const nuclearYield = isNuke ? (Math.random() < 0.2 ? 1.0 : 0.5) : undefined;
        
        const sourceGeo = GEO_COORDS[c.id];
        const targetGeo = GEO_COORDS[highestThreatId];
        const sx = sourceGeo ? sourceGeo.cx : 500;
        const sy = sourceGeo ? sourceGeo.cy : 250;
        const tx = targetGeo ? targetGeo.cx : 400;
        const ty = targetGeo ? targetGeo.cy : 200;

        const strikeUrl: any = {
          id: `strike_ai_${Math.random().toString()}`,
          sourceCountryId: c.id,
          targetCountryId: highestThreatId,
          weaponType: activeType.type,
          warheadYieldMT: nuclearYield,
          progressPct: 0,
          status: 'IN_FLIGHT',
          bezier: {
            startX: sx,
            startY: sy,
            controlX: (sx + tx) / 2,
            controlY: Math.min(sy, ty) - 130,
            endX: tx,
            endY: ty,
          },
          launchTick: draft.currentTick,
          impactTick: draft.currentTick + Math.ceil(100 / getTickIncrement(activeType.type)),
          isRetaliatory: true,
          interceptAttempted: false,
        };

        draft.activeStrikes.push(strikeUrl);
        draft.globalEventLog.unshift({
          tick: draft.currentTick,
          text: `Tactical Warning: Radar confirmation of tactical ${activeType.type} active in airspace! Source: ${c.id} → Target: ${highestThreatId}. Target impacts projected.`,
          severity: 'CRITICAL',
        });

        const targetNation = draft.countries[highestThreatId];
        if (!draft.aiOperationsLog) draft.aiOperationsLog = [];
        draft.aiOperationsLog.unshift({
          tick: draft.currentTick,
          countryId: c.id,
          countryName: c.name,
          action: isNuke ? 'Strategic Nuclear Launch' : 'Tactical Ballistic Strike',
          targetCountryId: highestThreatId,
          targetCountryName: targetNation?.name || highestThreatId,
          description: isNuke 
            ? `Transmitted code-level release keys for high-yield ballistic nuclear warheads.`
            : `Deployed supersonic bombardment units against targeted capital defense installations.`,
          secrecyScore: 12,
          impactScore: 95,
        });
      }
      break;

    case 'SEEK_CEASEFIRE':
      c.atWarWith.forEach((warId) => {
        const opposing = draft.countries[warId];
        if (opposing) {
          const oppMods = useLeaderStore.getState().getLeaderModifiers(warId, c.id, draft.currentTick);
          const ceasefireThreshold = -50 * oppMods.diplomacyAcceptMultiplier;
          if (opposing.opinions[c.id] > ceasefireThreshold) {
            c.atWarWith = c.atWarWith.filter((x) => x !== warId);
            opposing.atWarWith = opposing.atWarWith.filter((x) => x !== c.id);
            draft.globalEventLog.unshift({
              tick: draft.currentTick,
              text: `Diplomacy: Ceasefire formal agreement signed between ${c.name} and ${opposing.name}. Escapes war matrix.`,
              severity: 'INFO',
            });
          }
        }
      });
      break;

    case 'SANCTION_TARGET':
      const targetCountry = draft.countries[highestThreatId];
      if (targetCountry && !targetCountry.economic.sanctionedBy.includes(c.id)) {
        targetCountry.economic.sanctionedBy.push(c.id);
        draft.globalEventLog.unshift({
          tick: draft.currentTick,
          text: `Diplomacy: ${c.name} (TEMPERAMENT: ${leader?.type || 'UNKNOWN'}) imposes dynamic unilateral trade sanctions on ${targetCountry.name}! Re-routing trade channels.`,
          severity: 'WARNING',
        });
        c.lastEventLog.unshift(`Imposed dynamic bilateral sanctions on hostile target ${highestThreatId}.`);

        if (!draft.aiOperationsLog) draft.aiOperationsLog = [];
        draft.aiOperationsLog.unshift({
          tick: draft.currentTick,
          countryId: c.id,
          countryName: c.name,
          action: 'Bilateral Trade Sanctions',
          targetCountryId: highestThreatId,
          targetCountryName: targetCountry.name,
          description: `Enacted asset locks and customs cargo search protocols to restrict industrial import capacity.`,
          secrecyScore: 35,
          impactScore: 55,
        });
      }
      break;

    case 'PRINT_MONEY':
      econ.treasuryCashB += 15.0;
      econ.inflationRate += 3.0;
      pol.popularUnrest = Math.min(100, pol.popularUnrest + 4.0);
      break;

    case 'PURGE_FACTION':
      const highFaction = pol.factions.sort((x, y) => y.strengthIndex - x.strengthIndex)[0];
      if (highFaction && highFaction.strengthIndex > 60) {
        highFaction.strengthIndex -= 30;
        pol.stabilityIndex = Math.max(5, pol.stabilityIndex - 15);
        c.lastEventLog.unshift(`Internal Purge: Dissident cells cleared from administrative offices.`);
      }
      break;
  }
}
