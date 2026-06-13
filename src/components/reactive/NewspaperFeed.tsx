import React, { useEffect, useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { useLinkedAnalysisStore } from '../../store/linkedAnalysisStore';
import { audio } from '../../utils/audio';

export default function NewspaperFeed() {
  const currentTick = useWorldStore((s) => s.currentTick);
  const countries = useWorldStore((s) => s.countries);

  // Subscribe to shared analytical investigation selection state
  const selectedCountryId = useLinkedAnalysisStore((s) => s.selectedCountryId);
  const selectedEdge = useLinkedAnalysisStore((s) => s.selectedEdge);
  
  const [headline, setHeadline] = useState('COLD WAR POSTURE ENFORCED BY SUPERPOWERS');
  const [leadStory, setLeadStory] = useState('Superpower cabinets claim that secure missile grids and mutual interception shields are functioning fully, despite regional localized tensions.');

  // Automatically update newspaper story based on shared intelligence query context
  useEffect(() => {
    // Stage A: Investigate selected edge關係 if active
    if (selectedEdge) {
      const srcId = selectedEdge.source;
      const tgtId = selectedEdge.target;
      const nameA = countries[srcId]?.name || srcId;
      const nameB = countries[tgtId]?.name || tgtId;
      const rType = selectedEdge.type;

      if (rType === 'WAR') {
        setHeadline(`🔥 THEATER CLASH: DISSECTING THE KINETIC FRONT BETWEEN ${nameA.toUpperCase()} & ${nameB.toUpperCase()}`);
        setLeadStory(`Classified intelligence reports detail escalating border operations within the ${nameA} - ${nameB} corridor. Strategic rocket forces are fueled and command networks are placed on extreme standby levels.`);
      } else if (rType === 'SANCTIONS') {
        setHeadline(`🚫 TRADE FREEZE: ECONOMIC EMBARGO STRANGULATES COMMERCE ALONG ${nameA.toUpperCase()} ↔ ${nameB.toUpperCase()}`);
        setLeadStory(`Aggressive economic tariffs and complete asset freezes have severed the commercial ties linking ${nameA} and ${nameB}. Analysts predict localized supply shocks and rapid market corrections.`);
      } else if (rType === 'ALLIANCE') {
        setHeadline(`🤝 SECURITY PACT: MUTUAL PROTECTORATE DECREED BY KEY JOINT MINISTERIES OF ${nameA.toUpperCase()} & ${nameB.toUpperCase()}`);
        setLeadStory(`The joint executive chambers of ${nameA} and ${nameB} have ratified mutual defensive parameters. Secure rocket assets and intelligence channels are now synchronized against hostile bloc expansion.`);
      } else {
        setHeadline(`📡 INTEL INTERCEPT: UNPRECEDENTED EXCHANGES OBSERVED ON ${nameA.toUpperCase()} ↔ ${nameB.toUpperCase()}`);
        setLeadStory(`Signal analysis has isolated diplomatic and cyber intelligence transfers between the nodes of ${nameA} and ${nameB}. The exact alignment index remains highly classified but is being actively monitored.`);
      }
      audio.sfxNewspaper();
      return;
    }

    // Stage B: Investigate selected country node status if active
    if (selectedCountryId) {
      const targetCountry = countries[selectedCountryId];
      if (targetCountry) {
        const cName = targetCountry.name;
        
        // Match specific state factors of the inspected country
        if (targetCountry.atWarWith && targetCountry.atWarWith.length > 0) {
          const hostileId = targetCountry.atWarWith[0];
          const hostileName = countries[hostileId]?.name || hostileId;
          setHeadline(`⚔️ CLIMAX DESTRUCTION: ${cName.toUpperCase()} DEPLOYS MASS CONFLICT TELEMETRY AGAINST ${hostileName.toUpperCase()}`);
          setLeadStory(`Sovereign military commands in ${cName} have initiated full deployment protocols in response to direct war fronts with ${hostileName}. Combat units report heavy ordinance fire across disputed border territories.`);
        } else if (targetCountry.political.popularUnrest > 45) {
          setHeadline(`⚠️ SOCIAL OUTBREAK: UNREST INDICES SPIKE TO EXTREME RATIO WITHIN ${cName.toUpperCase()}`);
          setLeadStory(`Mass metropolitan assembly lines and popular demonstrations are reported in the streets of ${cName}. The current stability index has retrogressed, causing emergency ministries to evaluate urgent political suppression.`);
        } else if (targetCountry.economic.printingPressActive) {
          setHeadline(`💸 CASH DEVELUATION: FINANCIAL ANALYSTS DETECT RAPID MONETARY PRINTING IN ${cName.toUpperCase()}`);
          setLeadStory(`The Central monetary board of ${cName} is actively utilizing unlimited liquidity release valves. While treasury balances gain temporary relief, external trade partners warn of a serious inflation crisis.`);
        } else if (targetCountry.political.martialLawActive) {
          setHeadline(`🚨 SPECIAL ORDER: MILITARY EXECUTIVE ENFORCES STRICT CODES IN ${cName.toUpperCase()}`);
          setLeadStory(`Citizens of ${cName} are placed under federal martial restrictions of movement. Democratic regulatory systems have been completely suspended to counter immediate domestic and geopolitical fallout risks.`);
        } else {
          setHeadline(`📋 SECTOR SCAN: ASSESSING INTERNAL DEVELOPMENT INTEGRITY OF ${cName.toUpperCase()}`);
          setLeadStory(`Strategic monitors report a nominal equilibrium state inside ${cName} for the current cycle. Trade partnerships are active, military silos remain fully stocked, and civilian indicators are stable.`);
        }
        audio.sfxNewspaper();
        return;
      }
    }

    // Stage C: Fallback to global overview
    // Audit active wars
    const warsList: [string, string][] = [];
    Object.keys(countries).forEach((cId) => {
      countries[cId].atWarWith.forEach((enemyId) => {
        // Dedup
        if (!warsList.some(([a, b]) => (a === cId && b === enemyId) || (a === enemyId && b === cId))) {
          warsList.push([cId, enemyId]);
        }
      });
    });

    if (warsList.length > 0) {
      const [a, b] = warsList[0];
      const nameA = countries[a]?.name || a;
      const nameB = countries[b]?.name || b;
      setHeadline(`🔥 SHOOTING WAR BURSTS OUT BETWEEN ${nameA.toUpperCase()} & ${nameB.toUpperCase()}`);
      setLeadStory(`Unprecedented geopolitical stress is shaking borders as forces initiate full-theater operations. Citizens are urged to secure fallout bunkers as DEFCON alert indexes spike.`);
      audio.sfxNewspaper();
    } else {
      setHeadline('COLD WAR POSTURE ENFORCED BY SUPERPOWERS');
      setLeadStory('Superpower cabinets claim that secure missile grids and mutual interception shields are functioning fully, despite regional localized tensions.');
    }
  }, [currentTick, countries, selectedCountryId, selectedEdge]);

  return (
    <div className="gotham-panel gotham-panel--secondary p-4 flex flex-col font-mono text-green-400 font-bold justify-between h-full select-none" data-classification="CONFIDENTIAL">
      <div className="border-b border-[#1a5c1a]/55 pb-2 mb-3 text-center">
        <span className="text-[11px] font-display text-shadow tracking-widest text-[#00ff44] uppercase block">
          🗞 The World Herald
        </span>
        <span className="text-[8px] text-gray-500 uppercase tracking-wider block">
          CENTRAL STRATEGIC DAILY DISPATCH — TICK T+{String(currentTick).padStart(4, '0')}
        </span>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-center">
        <h3 className="text-xs uppercase font-extrabold text-white text-center leading-tight tracking-wide border-b border-dashed border-[#0d2e0d] pb-2 text-shadow-sm">
          {headline}
        </h3>
        <p className="text-[10px] text-gray-400 lowercase first-letter:uppercase leading-relaxed text-center font-normal px-2">
          {leadStory}
        </p>
      </div>

      <div className="border-t border-[#0d2e0d] pt-2 mt-3 flex justify-between items-center text-[8px] text-gray-500 uppercase">
        <span>clearance: LEVEL 2</span>
        <span>auth: SECURED CONSOLE</span>
      </div>
    </div>
  );
}
