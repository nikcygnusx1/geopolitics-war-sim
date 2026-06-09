import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { usePlayerStore } from '../../store/playerStore';
import { useWorldStore } from '../../store/worldStore';
import { useEconomyStore } from '../../store/economyStore';
import { useMilitaryStore } from '../../store/militaryStore';
import { restartTickTimer, executeSimulationStep } from '../../sim/tickEngine';
import { getTickIncrement } from '../../sim/militaryEngine';
import { ResearchNode, WeaponType, CovertOpType, HUDMode } from '../../types';

export default function TerminalShell() {
  const terminalLines = useUIStore((s) => s.terminalLines);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);
  const clearTerminal = useUIStore((s) => s.clearTerminal);
  const setCountryInspector = useUIStore((s) => s.setCountryInspector);

  const countryId = usePlayerStore((s) => s.countryId);
  const setHUDMode = usePlayerStore((s) => s.setHUDMode);
  const setTickSpeed = usePlayerStore((s) => s.setTickSpeed);

  const countries = useWorldStore((s) => s.countries);
  const updateCountry = useWorldStore((s) => s.updateCountry);
  const currentTick = useWorldStore((s) => s.currentTick);

  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const linesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    linesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  // Handle command submissions
  const handleCommandSubmit = (commandText: string) => {
    const trimmed = commandText.trim();
    if (!trimmed) return;

    // Log input line
    pushTerminalLine(`${countryId}> ${trimmed}`, 'SYSTEM');

    // Add to history
    const newHistory = [trimmed, ...history].slice(0, 50);
    setHistory(newHistory);
    setHistoryIndex(-1);

    // Split args
    const parts = trimmed.split(' ');
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (commandName) {
      case '/help':
        pushTerminalLine('AVAILABLE COMMAND CONSOLE INSTRUCTIONS:', 'INFO');
        pushTerminalLine('  /strike [countryId] [weaponType] [yieldMT?]  - Launch target strike', 'WARNING');
        pushTerminalLine('  /interest [rate]                             - Set Central Bank rates', 'INFO');
        pushTerminalLine('  /aid [countryId] [amountB] [type]            - Send sovereign foreign aid', 'INFO');
        pushTerminalLine('  /tariff [countryId] [rate]                   - Impose custom bilateral tariff', 'INFO');
        pushTerminalLine('  /sanction [countryId]                        - Place absolute economic blockade', 'WARNING');
        pushTerminalLine('  /research [nodeId]                           - Trigger technology research', 'INFO');
        pushTerminalLine('  /op [opType] [countryId]                     - Dispatch signals covert action', 'WARNING');
        pushTerminalLine('  /print [intensity 1-5 / off]                 - Toggle currency printing desk', 'INFO');
        pushTerminalLine('  /martial [on|off] [ticks]                    - Toggle federal Martial Law', 'WARNING');
        pushTerminalLine('  /mode [STATE|WAR_ROOM|ANALYST]               - Transition visual HUD view', 'INFO');
        pushTerminalLine('  /pause                                       - Halts simulation', 'INFO');
        pushTerminalLine('  /play                                        - Sim speed: NORMAL', 'INFO');
        pushTerminalLine('  /fast                                        - Sim speed: FAST', 'INFO');
        pushTerminalLine('  /ultra                                       - Sim speed: ULTRA', 'INFO');
        pushTerminalLine('  /inspect [countryId]                         - Pop out full country dashboard', 'INFO');
        pushTerminalLine('  /haarp [targetCountryId]                     - Activate climate wave targeter', 'WARNING');
        pushTerminalLine('  /emp [targetCountryId]                       - Discharge pulse matrix grid', 'CRITICAL');
        pushTerminalLine('  /bond [amountB] [rate] [ticks]               - Distribute national treasury bonds', 'INFO');
        pushTerminalLine('  /clear                                       - Clear terminal feed log', 'INFO');
        break;

      case '/clear':
        clearTerminal();
        break;

      case '/pause':
        setTickSpeed('PAUSED');
        restartTickTimer();
        pushTerminalLine('Tick orchestrator PAUSED.', 'SYSTEM');
        break;

      case '/play':
        setTickSpeed('NORMAL');
        restartTickTimer();
        pushTerminalLine('Tick speed declared: NORMAL (2.0s refresh).', 'SYSTEM');
        break;

      case '/fast':
        setTickSpeed('FAST');
        restartTickTimer();
        pushTerminalLine('Tick speed declared: FAST (0.8s refresh).', 'SYSTEM');
        break;

      case '/ultra':
        setTickSpeed('ULTRA');
        restartTickTimer();
        pushTerminalLine('Tick speed declared: ULTRA (0.3s refresh).', 'SYSTEM');
        break;

      case '/inspect':
        if (!args[0]) {
          pushTerminalLine('Usage error: Provide ISO 2-letter Country ID (e.g., /inspect CN)', 'CRITICAL');
        } else {
          const tgtId = args[0].toUpperCase();
          if (countries[tgtId]) {
            setCountryInspector(tgtId);
            pushTerminalLine(`Aperture lock: Loading comprehensive signals dossier for ${tgtId}.`, 'INFO');
          } else {
            pushTerminalLine(`Target validation error: Country code ${tgtId} unrecognized.`, 'CRITICAL');
          }
        }
        break;

      case '/interest':
        if (!args[0]) {
          pushTerminalLine('Usage: /interest [rate%]', 'CRITICAL');
        } else {
          const rate = parseFloat(args[0]);
          if (isNaN(rate) || rate < 0 || rate > 25) {
            pushTerminalLine('Constraint error: Interest rate must reside within [0.0% - 25.0%].', 'CRITICAL');
          } else {
            updateCountry(countryId, (draft) => {
              draft.economic.interestRate = rate;
            });
            pushTerminalLine(`Interest rate threshold successfully altered to ${rate}%.`, 'INFO');
          }
        }
        break;

      case '/print':
        if (!args[0]) {
          pushTerminalLine('Usage: /print [1-5 | off]', 'CRITICAL');
        } else {
          const arg = args[0].toLowerCase();
          if (arg === 'off') {
            updateCountry(countryId, (draft) => {
              draft.economic.printingPressActive = false;
            });
            pushTerminalLine('Quantitative press de-activated. Reserves standard.', 'INFO');
          } else {
            const level = parseInt(arg);
            if (isNaN(level) || level < 1 || level > 5) {
              pushTerminalLine('Printing scale must reside within range [1 - 5].', 'CRITICAL');
            } else {
              updateCountry(countryId, (draft) => {
                draft.economic.printingPressActive = true;
                draft.economic.printingPressIntensity = level;
              });
              pushTerminalLine(`Cash injection enabled at tier ${level}x intensity. WARNING: High inflation imminent.`, 'WARNING');
            }
          }
        }
        break;

      case '/strike':
        if (args.length < 2) {
          pushTerminalLine('Usage: /strike [targetCountryId] [weaponType] [yieldMT?]', 'CRITICAL');
        } else {
          const targetIdArg = args[0].toUpperCase();
          const weaponTypeArg = args[1].toUpperCase() as WeaponType;
          const yieldMTArg = args[2] ? parseFloat(args[2]) : undefined;

          const targetCountry = countries[targetIdArg];
          const actorCountry = countries[countryId];

          if (!targetCountry) {
            pushTerminalLine(`Error: Target country code "${targetIdArg}" does not exist.`, 'CRITICAL');
            break;
          }

          if (targetIdArg === countryId) {
            pushTerminalLine(`Error: Clandestine self-destruction targeting is locked.`, 'CRITICAL');
            break;
          }

          // Inspect dynamic stockpiles
          const activeWeapon = actorCountry.arsenal.units.find(u => u.type === weaponTypeArg);
          if (!activeWeapon || activeWeapon.operational <= 0) {
            pushTerminalLine(`Arsenal validation error: No operational "${weaponTypeArg}" units available.`, 'CRITICAL');
            break;
          }

          // Fuel check
          if (activeWeapon.fuelLevel < 20) {
            pushTerminalLine(`Fuel locks failed: Unit type reporting depleted fuel levels (${activeWeapon.fuelLevel}%).`, 'CRITICAL');
            break;
          }

          // Launch confirmation
          updateCountry(countryId, (draft) => {
            const unit = draft.arsenal.units.find(u => u.type === weaponTypeArg);
            if (unit) {
              unit.count--;
              unit.operational = unit.count;
            }
          });

          const isNuclear = !!yieldMTArg || weaponTypeArg === 'ICBM' || weaponTypeArg === 'SLBM';
          const calculatedYield = yieldMTArg ?? (isNuclear ? 0.5 : undefined);

          useWorldStore.getState().applyTickDelta((draft) => {
            const scGeo = require('../../data/geoCoords').GEO_COORDS[countryId];
            const tgGeo = require('../../data/geoCoords').GEO_COORDS[targetIdArg];
            const sx = scGeo ? scGeo.cx : 500;
            const sy = scGeo ? scGeo.cy : 250;
            const tx = tgGeo ? tgGeo.cx : 400;
            const ty = tgGeo ? tgGeo.cy : 200;

            const newStrike = {
              id: `strike_usr_${Math.random().toString()}`,
              sourceCountryId: countryId,
              targetCountryId: targetIdArg,
              weaponType: weaponTypeArg,
              warheadYieldMT: calculatedYield,
              progressPct: 0,
              status: 'IN_FLIGHT' as const,
              bezier: {
                startX: sx,
                startY: sy,
                controlX: (sx + tx) / 2,
                controlY: Math.min(sy, ty) - 130,
                endX: tx,
                endY: ty,
              },
              launchTick: currentTick,
              impactTick: currentTick + Math.ceil(100 / getTickIncrement(weaponTypeArg)),
              isRetaliatory: false,
              interceptAttempted: false,
            };

            draft.activeStrikes.push(newStrike);
          });

          pushTerminalLine(`FIRING CODE AUTHORIZED: launched 1x ${weaponTypeArg} at ${targetIdArg}. Target lock static.`, 'CRITICAL');
        }
        break;

      case '/martial':
        if (args.length < 1) {
          pushTerminalLine('Usage: /martial [on|off] [ticks?]', 'CRITICAL');
        } else {
          const toggle = args[0].toLowerCase();
          if (toggle === 'off') {
            updateCountry(countryId, (draft) => {
              draft.political.martialLawActive = false;
              draft.political.martialLawTicksRemaining = 0;
            });
            pushTerminalLine('Martial enforcement canceled. Public transit re-opened.', 'INFO');
          } else if (toggle === 'on') {
            const ticks = args[1] ? parseInt(args[1]) : 20;
            updateCountry(countryId, (draft) => {
              draft.political.martialLawActive = true;
              draft.political.martialLawTicksRemaining = ticks;
            });
            pushTerminalLine(`MARTIAL DECREE active for next ${ticks} ticks. Public assemblies blocked. Security active.`, 'WARNING');
          } else {
            pushTerminalLine('Argument unrecognized. Use "on" or "off".', 'CRITICAL');
          }
        }
        break;

      case '/mode':
        if (!args[0]) {
          pushTerminalLine('Usage: /mode [STATE|WAR_ROOM|ANALYST]', 'CRITICAL');
        } else {
          const m = args[0].toUpperCase() as HUDMode;
          if (m === 'STATE' || m === 'WAR_ROOM' || m === 'ANALYST') {
            setHUDMode(m);
            pushTerminalLine(`Command mode restructured to: ${m}. Re-imaging panels.`, 'INFO');
          } else {
            pushTerminalLine('Mode unrecognized. Choose between: STATE, WAR_ROOM, ANALYST', 'CRITICAL');
          }
        }
        break;

      case '/aid':
        if (args.length < 3) {
          pushTerminalLine('Usage: /aid [countryId] [amountB] [HUMANITARIAN | MILITARY | ECONOMIC]', 'CRITICAL');
        } else {
          const targetId = args[0].toUpperCase();
          const amount = parseFloat(args[1]);
          const aidType = args[2].toUpperCase();

          const currentCash = usePlayerStore.getState().cashB;

          if (currentCash < amount) {
            pushTerminalLine(`Sovereign debit warning: treasury cash reserves insufficient ($${amount}B requested).`, 'CRITICAL');
          } else if (!countries[targetId]) {
            pushTerminalLine(`Target country "${targetId}" unrecognized.`, 'CRITICAL');
          } else {
            usePlayerStore.setState((state) => ({ cashB: state.cashB - amount }));
            usePlayerStore.getState().syncCashToCountry();

            // Mutate target
            updateCountry(targetId, (draft) => {
              draft.economic.treasuryCashB += amount;
              draft.opinions[countryId] = Math.min(100, (draft.opinions[countryId] ?? 0) + (amount * 4));
            });

            pushTerminalLine(`Dispatched $${amount}B in ${aidType} foreign aid to ${targetId}. Opinions increased.`, 'INFO');
          }
        }
        break;

      case '/tariff':
        if (args.length < 2) {
          pushTerminalLine('Usage: /tariff [countryId] [rate%]', 'CRITICAL');
        } else {
          const tgtId = args[0].toUpperCase();
          const rate = parseInt(args[1]);

          if (isNaN(rate) || rate < 0 || rate > 50) {
            pushTerminalLine('Tariff rate boundary exceeded. Value must reside within [0% - 50%].', 'CRITICAL');
          } else if (!countries[tgtId]) {
            pushTerminalLine(`Exotic target node code "${tgtId}" unrecognized.`, 'CRITICAL');
          } else {
            updateCountry(countryId, (draft) => {
              if (!draft.tariffs) draft.tariffs = {};
              draft.tariffs[tgtId] = rate;
            });
            pushTerminalLine(`Bilateral import tariff rate imposed on ${tgtId} adjusted to ${rate}%.`, 'INFO');
          }
        }
        break;

      case '/sanction':
        if (!args[0]) {
          pushTerminalLine('Usage: /sanction [countryId]', 'CRITICAL');
        } else {
          const tgtId = args[0].toUpperCase();
          if (!countries[tgtId]) {
            pushTerminalLine(`Country "${tgtId}" does not exist.`, 'CRITICAL');
          } else {
            useEconomyStore.getState().imposeSanction(countryId, tgtId);
            pushTerminalLine(`Placed total economic isolation blockade on ${tgtId}. Trade partners notified.`, 'WARNING');
          }
        }
        break;

      case '/research':
        if (!args[0]) {
          pushTerminalLine('Usage: /research [nodeId] (e.g. /research HAARP_V1)', 'CRITICAL');
        } else {
          const node = args[0].toUpperCase() as ResearchNode;
          const actor = countries[countryId];
          const hasCost = 10; // Simple constant cost deduction

          if (actor.researchUnlocked.includes(node)) {
            pushTerminalLine(`Validation error: Technology ${node} already researched and active.`, 'WARNING');
          } else if (usePlayerStore.getState().cashB < hasCost) {
            pushTerminalLine('Financial barrier: Insufficient research slush reserves.', 'CRITICAL');
          } else {
            // Unlocking technology node
            usePlayerStore.setState((state) => ({ cashB: state.cashB - hasCost }));
            usePlayerStore.getState().syncCashToCountry();

            updateCountry(countryId, (draft) => {
              draft.researchUnlocked.push(node);
            });
            pushTerminalLine(`Research success: Technology node "${node}" unlocked and integrated into networks.`, 'INFO');
          }
        }
        break;

      case '/haarp':
        if (!args[0]) {
          pushTerminalLine('Usage: /haarp [targetCountryId]', 'CRITICAL');
        } else {
          const targetId = args[0].toUpperCase();
          const actor = countries[countryId];
          if (!actor.researchUnlocked.includes('HAARP_V1')) {
            pushTerminalLine('Tech verification error: Project HAARP climate arrays not unlocked.', 'CRITICAL');
          } else if (!countries[targetId]) {
            pushTerminalLine(`Target country "${targetId}" unrecognized.`, 'CRITICAL');
          } else {
            updateCountry(countryId, (draft) => {
              draft.haarpActive = true;
              draft.haarpTargetCountryId = targetId;
            });

            updateCountry(targetId, (draft) => {
              draft.political.popularUnrest = Math.min(100, draft.political.popularUnrest + 12);
              draft.political.stabilityIndex = Math.max(0, draft.political.stabilityIndex - 8);
            });

            pushTerminalLine(`PROJECT HAARP ACTIVATED! Targeting high-density agricultural zones of ${targetId} with climate waves.`, 'CRITICAL');
          }
        }
        break;

      case '/emp':
        if (!args[0]) {
          pushTerminalLine('Usage: /emp [targetCountryId]', 'CRITICAL');
        } else {
          const targetId = args[0].toUpperCase();
          const target = countries[targetId];
          if (!target) {
            pushTerminalLine(`Country "${targetId}" unrecognized.`, 'CRITICAL');
          } else {
            updateCountry(targetId, (draft) => {
              draft.political.popularUnrest = Math.min(100, draft.political.popularUnrest + 30);
              draft.political.stabilityIndex = Math.max(0, draft.political.stabilityIndex - 25);
              draft.economic.gdpB *= 0.85; // 15% drop
              draft.lastEventLog.unshift(`EMP blackouts! Grid failed and telemetry arrays dead.`);
            });

            pushTerminalLine(`ELECTROMAGNETIC PULSE DETONATED over ${targetId}. Infrastructure networks shattered.`, 'CRITICAL');
          }
        }
        break;

      default:
        pushTerminalLine(`Operational error: Command "${commandName}" unrecognized. For options, execute "/help"`, 'CRITICAL');
        break;
    }

    setInputVal('');
  };

  // Keyboard navigation inside console
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommandSubmit(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple autocompletion
      const listCommands = ['/strike', '/interest', '/aid', '/tariff', '/sanction', '/research', '/op', '/print', '/martial', '/mode', '/pause', '/play', '/fast', '/ultra', '/inspect', '/haarp', '/emp', '/bond', '/help', '/clear'];
      const matching = listCommands.find(c => c.startsWith(inputVal.toLowerCase()));
      if (matching) {
        setInputVal(matching + ' ');
      }
    }
  };

  return (
    <div className="w-full bg-[#030603] border-t border-[#1a3a1a] h-[140px] flex flex-col p-2 relative shrink-0">
      {/* Scrollable outputs */}
      <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-0.5 leading-snug mb-1">
        {terminalLines.map((line) => {
          let lineClass = 'text-[#00ff44]'; // Default info green
          if (line.type === 'SYSTEM') lineClass = 'text-[#00e5ff]';
          if (line.type === 'WARNING') lineClass = 'text-[#ffb300]';
          if (line.type === 'CRITICAL') lineClass = 'text-[#ff2244] font-semibold';

          return (
            <div key={line.id} className={`${lineClass} tracking-wide text-shadow-sm`}>
              {line.text}
            </div>
          );
        })}
        <div ref={linesEndRef} />
      </div>

      {/* Input row */}
      <div className="flex items-center text-xs border-t border-[#0f240f] pt-1">
        <span className="text-[#00ff44] mr-2 font-mono shrink-0 select-none">
          {countryId}&gt;
        </span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none font-mono text-[#00ff44] caret-[#00ff44] tracking-wide placeholder-green-900 placeholder-opacity-50 text-xs"
          placeholder="Enter sovereign directive... /help for lists..."
          autoFocus
        />
      </div>
    </div>
  );
}
