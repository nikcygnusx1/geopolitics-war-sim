import React, { useState, useEffect, useMemo } from 'react';
import { SCENARIOS } from '../../data/scenarios';
import { useClockStore } from '../../store/clockStore';
import { useDefconStore } from '../../store/defconStore';
import { useFogOfWarStore } from '../../store/fogOfWarStore';
import { useConsequenceStore } from '../../store/consequenceStore';
import { ScenarioId, LeaderPersonality } from '../../types';
import { useLeaderStore } from '../../store/leaderStore';
import { audio } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { DurationSelector } from '../lobby/DurationSelector';
import {
  Globe,
  Sliders,
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  Search,
  Activity,
  CheckCircle2,
  XCircle,
  Cpu,
  Zap,
  Radio,
  FileText,
  Compass,
  AlertOctagon,
  Eye,
  TrendingUp,
  FileSpreadsheet,
  Skull,
  User,
  Heart,
  ExternalLink,
  Lock,
  Workflow
} from 'lucide-react';

const LOBBY_NATIONS = [
  { id: 'US', name: 'United States', flag: '🇺🇸', ideology: 'DEMOCRACY', alliance: 'NATO', gdp: 28000, power: 95, diff: 'NOVICE', alignment: 'WESTERN', cx: 160, cy: 110 },
  { id: 'CN', name: 'China', flag: '🇨🇳', ideology: 'AUTOCRACY', alliance: 'SCO', gdp: 19000, power: 88, diff: 'OPERATIVE', alignment: 'EASTERN', cx: 400, cy: 120 },
  { id: 'RU', name: 'Russia', flag: '🇷🇺', ideology: 'AUTOCRACY', alliance: 'SCO', gdp: 2100, power: 90, diff: 'ELITE', alignment: 'EASTERN', cx: 360, cy: 80 },
  { id: 'IN', name: 'India', flag: '🇮🇳', ideology: 'DEMOCRACY', alliance: 'QUAD', gdp: 3900, power: 72, diff: 'OPERATIVE', alignment: 'NON_ALIGNED', cx: 370, cy: 140 },
  { id: 'PK', name: 'Pakistan', flag: '🇵🇰', ideology: 'MILITARY_JUNTA', alliance: 'NEUTRAL', gdp: 350, power: 55, diff: 'ELITE', alignment: 'EASTERN', cx: 350, cy: 135 },
  { id: 'IL', name: 'Israel', flag: '🇮🇱', ideology: 'DEMOCRACY', alliance: 'NEUTRAL', gdp: 520, power: 78, diff: 'OPERATIVE', alignment: 'WESTERN', cx: 320, cy: 125 },
  { id: 'IR', name: 'Iran', flag: '🇮🇷', ideology: 'THEOCRACY', alliance: 'SCO', gdp: 400, power: 60, diff: 'ELITE', alignment: 'EASTERN', cx: 338, cy: 124 },
  { id: 'GB', name: 'United Kingdom', flag: '🇬🇧', ideology: 'DEMOCRACY', alliance: 'NATO', gdp: 3100, power: 70, diff: 'NOVICE', alignment: 'WESTERN', cx: 280, cy: 85 },
  { id: 'FR', name: 'France', flag: '🇫🇷', ideology: 'DEMOCRACY', alliance: 'NATO', gdp: 3000, power: 68, diff: 'NOVICE', alignment: 'WESTERN', cx: 285, cy: 95 },
  { id: 'DE', name: 'Germany', flag: '🇩🇪', ideology: 'DEMOCRACY', alliance: 'NATO', gdp: 4500, power: 62, diff: 'NOVICE', alignment: 'WESTERN', cx: 298, cy: 92 },
  { id: 'JP', name: 'Japan', flag: '🇯🇵', ideology: 'DEMOCRACY', alliance: 'QUAD', gdp: 4200, power: 58, diff: 'NOVICE', alignment: 'WESTERN', cx: 435, cy: 115 },
  { id: 'KR', name: 'South Korea', flag: '🇰🇷', ideology: 'DEMOCRACY', alliance: 'QUAD', gdp: 1800, power: 60, diff: 'OPERATIVE', alignment: 'WESTERN', cx: 422, cy: 116 },
  { id: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', ideology: 'THEOCRACY', alliance: 'GCC', gdp: 1100, power: 65, diff: 'OPERATIVE', alignment: 'NON_ALIGNED', cx: 326, cy: 140 },
  { id: 'BR', name: 'Brazil', flag: '🇧🇷', ideology: 'DEMOCRACY', alliance: 'NEUTRAL', gdp: 2100, power: 48, diff: 'NOVICE', alignment: 'NON_ALIGNED', cx: 210, cy: 195 },
  { id: 'ZA', name: 'South Africa', flag: '🇿🇦', ideology: 'DEMOCRACY', alliance: 'BRICS', gdp: 400, power: 35, diff: 'ELITE', alignment: 'NON_ALIGNED', cx: 305, cy: 215 },
  { id: 'AU', name: 'Australia', flag: '🇦🇺', ideology: 'DEMOCRACY', alliance: 'QUAD', gdp: 1700, power: 55, diff: 'NOVICE', alignment: 'WESTERN', cx: 445, cy: 205 },
  { id: 'TR', name: 'Turkey', flag: '🇹🇷', ideology: 'AUTOCRACY', alliance: 'NATO', gdp: 1100, power: 62, diff: 'ELITE', alignment: 'NON_ALIGNED', cx: 310, cy: 115 },
  { id: 'EG', name: 'Egypt', flag: '🇪🇬', ideology: 'MILITARY_JUNTA', alliance: 'NEUTRAL', gdp: 470, power: 50, diff: 'OPERATIVE', alignment: 'NON_ALIGNED', cx: 312, cy: 135 },
  { id: 'TW', name: 'Taiwan', flag: '🇹🇼', ideology: 'DEMOCRACY', alliance: 'NEUTRAL', gdp: 790, power: 64, diff: 'LEGENDARY', alignment: 'WESTERN', cx: 418, cy: 132 }
];

interface GameLobbyProps {
  onStartScenario: (id: ScenarioId, countryId: string, customOptions?: any) => void;
  onOpenWorldBuilder: () => void;
}

type PresetKey = 'ANALYST_MODE' | 'NATO_STAFF' | 'DOOMSDAY' | 'CUSTOM';

export default function GameLobby({ onStartScenario, onOpenWorldBuilder }: GameLobbyProps) {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('MENA_SPARK');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mission params
  const [durationMode, setDurationMode] = useState<'SCENARIO' | 'TIMED' | 'ENDLESS'>('SCENARIO');
  const [timedTicks, setTimedTicks] = useState(100);
  const [tickScale, setTickScale] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
  const [startDate, setStartDate] = useState('2027-01-15');
  const [initialSpeed, setInitialSpeed] = useState<'PAUSED' | 'NORMAL' | 'FAST' | 'ULTRA'>('PAUSED');

  // Advanced configurations
  const [aiAggression, setAiAggression] = useState(2); // 1-5 slider
  const [nuclearDoctrine, setNuclearDoctrine] = useState<'NO_FIRST_USE' | 'FLEXIBLE' | 'LAUNCH_ON_WARNING'>('FLEXIBLE');
  const [startingIntel, setStartingIntel] = useState<'BLIND' | 'PARTIAL' | 'FULL'>('PARTIAL');
  const [consequencesEnabled, setConsequencesEnabled] = useState(true);
  const [economicVolatility, setEconomicVolatility] = useState(2); // 1-5 slider
  const [substateActivity, setSubstateActivity] = useState(3); // 1-5 slider

  // Preset Selection state
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('CUSTOM');

  // Pre-game leader overrides and tabs
  const [activeTab, setActiveTab] = useState<'HOTSPOTS' | 'LEADERS'>('LEADERS');
  const [leaderOverrides, setLeaderOverrides] = useState<Record<string, LeaderPersonality>>({});

  const getDefaultLeaderPersonality = (countryId: string): LeaderPersonality => {
    const initialMap: Record<string, LeaderPersonality> = {
      US: LeaderPersonality.PRAGMATIST,
      CN: LeaderPersonality.HAWK,
      RU: LeaderPersonality.HAWK,
      IL: LeaderPersonality.IDEOLOGUE,
      IR: LeaderPersonality.IDEOLOGUE,
      GB: LeaderPersonality.DOVE,
      DE: LeaderPersonality.DOVE,
      JP: LeaderPersonality.PRAGMATIST,
      KP: LeaderPersonality.HAWK,
      TW: LeaderPersonality.DOVE,
      PK: LeaderPersonality.UNPREDICTABLE,
      IN: LeaderPersonality.PRAGMATIST,
    };
    return initialMap[countryId] || LeaderPersonality.PRAGMATIST;
  };

  const getDeterministicLeaderPreview = (countryId: string, personality: LeaderPersonality) => {
    return useLeaderStore.getState().generateNewLeader(countryId, 'INITIAL', 0, personality);
  };

  const handleOverrideLeader = (countryId: string, personality: LeaderPersonality) => {
    setLeaderOverrides(prev => ({
      ...prev,
      [countryId]: personality
    }));
  };

  const handleResetLeader = (countryId: string) => {
    setLeaderOverrides(prev => {
      const copy = { ...prev };
      delete copy[countryId];
      return copy;
    });
  };

  const applyLeaderPreset = (preset: 'DEFAULT' | 'COLD_WAR_HOT' | 'DIPLOMATIC' | 'CHAOTIC') => {
    if (preset === 'DEFAULT') {
      setLeaderOverrides({});
      return;
    }

    const overrides: Record<string, LeaderPersonality> = {};
    const nations = ['US', 'CN', 'IN', 'PK', 'IL', 'PS', 'IR', 'RU', 'GB', 'FR', 'DE', 'JP', 'KR', 'SA', 'BR', 'ZA', 'AU', 'TR', 'EG', 'TW'];
    
    nations.forEach(cId => {
      if (preset === 'COLD_WAR_HOT') {
        const hawks = ['US', 'CN', 'RU', 'GB', 'FR', 'IL', 'IR', 'KP'];
        overrides[cId] = hawks.includes(cId) ? LeaderPersonality.HAWK : LeaderPersonality.IDEOLOGUE;
      } else if (preset === 'DIPLOMATIC') {
        const doves = ['US', 'RU', 'CN', 'GB', 'FR', 'DE', 'JP', 'TW'];
        overrides[cId] = doves.includes(cId) ? LeaderPersonality.DOVE : LeaderPersonality.PRAGMATIST;
      } else if (preset === 'CHAOTIC') {
        overrides[cId] = Math.random() < 0.5 ? LeaderPersonality.UNPREDICTABLE : LeaderPersonality.IDEOLOGUE;
      }
    });

    setLeaderOverrides(overrides);
  };

  const getEscalationLabel = (pers: LeaderPersonality) => {
    switch (pers) {
      case LeaderPersonality.HAWK: return '1.4x (HIGH)';
      case LeaderPersonality.DOVE: return '0.7x (LOW)';
      case LeaderPersonality.IDEOLOGUE: return '1.1x (MOD)';
      case LeaderPersonality.UNPREDICTABLE: return 'ERRATIC';
      default: return '1.0x (NOM)';
    }
  };

  const getRiskLabel = (pers: LeaderPersonality) => {
    switch (pers) {
      case LeaderPersonality.HAWK: return '+25% BIAS';
      case LeaderPersonality.DOVE: return '-25% BIAS';
      case LeaderPersonality.IDEOLOGUE: return 'BALANCED';
      case LeaderPersonality.UNPREDICTABLE: return 'VOLATILE';
      default: return 'NOMINAL';
    }
  };

  // Dynamic system clock purely for visual tactical ambiance
  const [systemTime, setSystemTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredNations = LOBBY_NATIONS.filter(n =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeScenarioObj = SCENARIOS[selectedScenario];
  const isSelectedCountryPlayable = activeScenarioObj?.playableCountryIds.includes(selectedCountry);

  // Elite presets application logic
  const handleApplyPreset = (preset: PresetKey) => {
    setSelectedPreset(preset);
    audio.sfxKlaxon();
    
    switch (preset) {
      case 'ANALYST_MODE':
        setAiAggression(1);
        setEconomicVolatility(1);
        setSubstateActivity(1);
        setNuclearDoctrine('NO_FIRST_USE');
        setStartingIntel('FULL');
        setConsequencesEnabled(false);
        break;
      case 'NATO_STAFF':
        setAiAggression(3);
        setEconomicVolatility(2);
        setSubstateActivity(3);
        setNuclearDoctrine('FLEXIBLE');
        setStartingIntel('PARTIAL');
        setConsequencesEnabled(true);
        break;
      case 'DOOMSDAY':
        setAiAggression(5);
        setEconomicVolatility(5);
        setSubstateActivity(5);
        setNuclearDoctrine('LAUNCH_ON_WARNING');
        setStartingIntel('BLIND');
        setConsequencesEnabled(true);
        break;
      default:
        break;
    }
  };

  // Custom detector to see if custom edits break current preset settings
  useEffect(() => {
    if (selectedPreset === 'CUSTOM') return;
    
    let matches = false;
    if (selectedPreset === 'ANALYST_MODE') {
      matches = aiAggression === 1 && economicVolatility === 1 && substateActivity === 1 && nuclearDoctrine === 'NO_FIRST_USE' && startingIntel === 'FULL' && !consequencesEnabled;
    } else if (selectedPreset === 'NATO_STAFF') {
      matches = aiAggression === 3 && economicVolatility === 2 && substateActivity === 3 && nuclearDoctrine === 'FLEXIBLE' && startingIntel === 'PARTIAL' && consequencesEnabled;
    } else if (selectedPreset === 'DOOMSDAY') {
      matches = aiAggression === 5 && economicVolatility === 5 && substateActivity === 5 && nuclearDoctrine === 'LAUNCH_ON_WARNING' && startingIntel === 'BLIND' && consequencesEnabled;
    }

    if (!matches) {
      setSelectedPreset('CUSTOM');
    }
  }, [aiAggression, economicVolatility, substateActivity, nuclearDoctrine, startingIntel, consequencesEnabled, selectedPreset]);

  // Dynamic Global Risk Posture computations based on scenario threats + slider options
  const riskPosture = useMemo(() => {
    const baseThreatWeights = {
      RED: 70,
      ORANGE: 50,
      YELLOW: 30,
      GREEN: 10
    };
    
    const baseVal = baseThreatWeights[activeScenarioObj?.threatLevel || 'YELLOW'];

    // 1. Conflict Escalation Index
    const conflictIndex = Math.min(99, Math.max(10, baseVal + (aiAggression * 4) + (substateActivity * 2)));

    // 2. Nuclear Brinkmanship Index
    const doctMult = nuclearDoctrine === 'LAUNCH_ON_WARNING' ? 30 : nuclearDoctrine === 'FLEXIBLE' ? 15 : 0;
    const nuclearIndex = Math.min(99, Math.max(5, (activeScenarioObj?.id === 'MENA_SPARK' || activeScenarioObj?.id === 'KASHMIR_FLASHPOINT' ? baseVal + 15 : baseVal - 5) + doctMult));

    // 3. Economic Fragility Index
    const econBase = (activeScenarioObj?.id === 'SOVEREIGN_DEFAULT' || activeScenarioObj?.id === 'STRAIT_CLOSURE') ? 50 : 15;
    const economicIndex = Math.min(95, Math.max(10, econBase + (economicVolatility * 12)));

    // 4. Civil Instability Index
    const civilIndex = Math.min(98, Math.max(8, (activeScenarioObj?.id === 'KASHMIR_FLASHPOINT' || activeScenarioObj?.id === 'SOVEREIGN_DEFAULT' ? 45 : 15) + (substateActivity * 10)));

    // 5. Intelligence Fog / Information Uncertainty
    const fogMap = {
      BLIND: 92,
      PARTIAL: 48,
      FULL: 8
    };
    const fogIndex = fogMap[startingIntel];

    // Total danger average
    const averageThreat = Math.round((conflictIndex + nuclearIndex + economicIndex + civilIndex + fogIndex) / 5);

    return {
      conflictIndex,
      nuclearIndex,
      economicIndex,
      civilIndex,
      fogIndex,
      averageThreat
    };
  }, [activeScenarioObj, aiAggression, substateActivity, nuclearDoctrine, economicVolatility, startingIntel]);

  // Recommended narrative insights based on current risk postures
  const recommendedArchetype = useMemo(() => {
    if (riskPosture.averageThreat >= 75) {
      return {
        label: "DOOMSDAY MITIGATION ARCHETYPE",
        style: "text-red-400 border-red-500/30 bg-red-950/20",
        description: "Strict containment of escalation is paramount. Highly volatile parameters demand proactive deterrence over slow diplomacy."
      };
    } else if (riskPosture.averageThreat >= 45) {
      return {
        label: "BALANCED Crisis Management POSTURE",
        style: "text-amber-400 border-amber-500/30 bg-amber-950/20",
        description: "Recommended for analytical commanders focusing on localized military shields combined with targetive financial bails."
      };
    } else {
      return {
        label: "NOMINAL NEGOTIATOR INCLINATION",
        style: "text-green-400 border-green-500/30 bg-green-950/20",
        description: "Optimal environment for diplomatic expansion, standard global development, and preemptive economic stability alliances."
      };
    }
  }, [riskPosture]);

  // Mini-map Hotspots coordinates inside SVG
  const scenarioHotspots = useMemo(() => {
    switch (selectedScenario) {
      case 'MENA_SPARK':
        return [
          { cx: 320, cy: 125, id: 'IL', label: 'Israel (Direct Combat)' },
          { cx: 338, cy: 124, id: 'IR', label: 'Iran (Escalatory Node)' },
          { cx: 326, cy: 140, id: 'SA', label: 'Saudi Arabia (Crisis Actor)' }
        ];
      case 'KASHMIR_FLASHPOINT':
        return [
          { cx: 370, cy: 140, id: 'IN', label: 'India (LOC Mobilization)' },
          { cx: 350, cy: 135, id: 'PK', label: 'Pakistan (Nuclear Alert)' },
          { cx: 400, cy: 120, id: 'CN', label: 'China (Border Influence)' }
        ];
      case 'STRAIT_CLOSURE':
        return [
          { cx: 338, cy: 124, id: 'IR', label: 'Strait of Hormuz Blockage' },
          { cx: 326, cy: 140, id: 'SA', label: 'OPEC Stability Target' },
          { cx: 160, cy: 110, id: 'US', label: 'US Fifth Fleet Patrol' }
        ];
      case 'SOVEREIGN_DEFAULT':
        return [
          { cx: 285, cy: 95, id: 'FR', label: 'France (Eurobond Collapse)' },
          { cx: 298, cy: 92, id: 'DE', label: 'Germany (Bailout Strain)' },
          { cx: 280, cy: 85, id: 'GB', label: 'United Kingdom (Debt Strain)' }
        ];
      case 'TECH_WAR':
        return [
          { cx: 418, cy: 132, id: 'TW', label: 'Taiwan (Silicon Supply Apex)' },
          { cx: 400, cy: 120, id: 'CN', label: 'China (Market Restriction)' },
          { cx: 160, cy: 110, id: 'US', label: 'US (Quantum Leap Priority)' }
        ];
      case 'ARCTIC_CLAIM':
        return [
          { cx: 360, cy: 80, id: 'RU', label: 'Russia (Drilling Encroachment)' },
          { cx: 160, cy: 110, id: 'US', label: 'US (Northern Sector Sentry)' },
          { cx: 280, cy: 85, id: 'GB', label: 'UK (Maritime Partnership)' }
        ];
      default:
        return [];
    }
  }, [selectedScenario]);

  const handleLaunchGame = () => {
    audio.sfxKlaxon();
    
    // 1. Setup clock parameters
    useClockStore.getState().initClock(
      startDate,
      durationMode,
      tickScale,
      durationMode === 'TIMED' ? timedTicks : 100
    );

    // 2. Setup Fog Of War
    const targetAllies = selectedCountry === 'US' ? ['GB', 'FR', 'DE', 'JP', 'KR', 'AU'] : [];
    useFogOfWarStore.getState().initFog(selectedCountry, targetAllies, startingIntel);

    // 3. Setup DEFCON & Consequences State
    useDefconStore.getState().resetDefcon();
    if (!consequencesEnabled) {
      useConsequenceStore.getState().resetScars();
    }

    // 4. Trigger initiation
    onStartScenario(selectedScenario, selectedCountry, {
      aiAggression,
      nuclearDoctrine,
      economicVolatility,
      substateActivity,
      leaderOverrides
    });
  };

  return (
    <div id="lobby-briefing-chamber" className="absolute inset-0 bg-[#020503] flex items-center justify-center p-3 overflow-hidden z-50 select-none font-mono text-green-400">
      {/* Dynamic Cyber Ambient Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 z-0" 
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, #0c2613 0%, transparent 85%),
            linear-gradient(rgba(0, 255, 68, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 68, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 30px 30px'
        }}
      />
      <div className="scanlines absolute inset-0 pointer-events-none z-10 opacity-25" />

      {/* Main Terminal Shell Container */}
      <div className="w-full max-w-[1550px] h-[97vh] bg-[#030704]/98 border-2 border-green-500/30 rounded-lg flex flex-col p-4 relative z-20 shadow-[0_0_60px_rgba(0,255,68,0.06)] overflow-hidden">
        
        {/* CORNER TECH DESIGN FLAPS */}
        <div className="absolute top-0 left-0 w-8 h-1 bg-green-500 shadow-[0_0_8px_rgba(0,255,68,0.5)] z-20" />
        <div className="absolute top-0 left-0 w-1 h-8 bg-green-500 shadow-[0_0_8px_rgba(0,255,68,0.5)] z-20" />
        <div className="absolute top-0 right-0 w-8 h-1 bg-green-500 shadow-[0_0_8px_rgba(0,255,68,0.5)] z-20" />
        <div className="absolute top-0 right-0 w-1 h-8 bg-green-500 shadow-[0_0_8px_rgba(0,255,68,0.5)] z-20" />
        <div className="absolute bottom-0 left-0 w-8 h-1 bg-green-500 shadow-[0_0_8px_rgba(0,255,68,0.5)] z-20" />
        <div className="absolute bottom-0 left-0 w-1 h-8 bg-green-500 shadow-[0_0_8px_rgba(0,255,68,0.5)] z-20" />
        <div className="absolute bottom-0 right-0 w-8 h-1 bg-green-500 shadow-[0_0_8px_rgba(0,255,68,0.5)] z-20" />
        <div className="absolute bottom-0 right-0 w-1 h-8 bg-green-500 shadow-[0_0_8px_rgba(0,255,68,0.5)] z-20" />

        {/* TOP STATUS CONTROL HUB */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#184918]/60 pb-3 mb-3 flex-shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center p-2 bg-[#0a1e0b] border border-green-500/40 rounded shadow-[0_0_10px_rgba(0,255,68,0.1)]">
              <Compass className="w-5 h-5 text-green-300 animate-spin" style={{ animationDuration: '30s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
                <h1 className="text-lg font-display font-medium text-white tracking-widest uppercase leading-none">
                  SOVEREIGN COMMAND SIMULATOR <span className="text-[#00ff44] font-bold">V4.2</span>
                </h1>
              </div>
              <p className="text-[9px] text-[#00e5ff] uppercase tracking-[0.25em] mt-1 font-mono flex items-center gap-2">
                <span>WAR ROOM MODE</span>
                <span className="text-green-800">|</span>
                <span>COMMS CRYPTO-ALIGN</span>
                <span className="text-green-800">|</span>
                <span className="text-[#ffb300] font-bold flex items-center gap-1">
                  <Radio className="w-3 h-3 inline animate-pulse text-amber-500" /> STRATEGIC BRIEFING CHAMBER
                </span>
              </p>
            </div>
          </div>

          {/* SATELLITE METRICS & UTC TIMESTAMP */}
          <div className="flex items-center gap-4 bg-green-950/20 border border-[#1b3d1f] rounded px-3 py-1.5 text-[9px] font-bold text-gray-400">
            <div className="text-right">
              <div>DOWNLINK BROADCAST: <span className="text-[#00ff44]">SAT_METRIC_SIT_49</span></div>
              <div className="text-[8px] text-[rgba(0,229,255,0.8)] mt-0.5 font-mono">{systemTime}</div>
            </div>
            <div className="w-[1px] h-6 bg-[#1a5c1a]/40" />
            <div className="text-right">
              <div>CRYPTOGRAPHY: <span className="text-[#ffb300]">AES_256_COSMIC</span></div>
              <div className="text-gray-500 text-[8px] mt-0.5">DIRECTOR AUTHORIZATION ENABLED</div>
            </div>
            <div className="w-[1px] h-6 bg-[#1a5c1a]/40" />
            <div className="font-mono text-center flex flex-col justify-center items-center px-1">
              <span className="text-[9px] text-[#ff3b4e] font-bold tracking-wider animate-pulse">TS/SCI</span>
              <span className="text-[7px] text-gray-500 font-semibold">EYES ONLY</span>
            </div>
          </div>
        </div>

        {/* SECTION 3 — DYNAMIC GLOBAL RISK STRIP */}
        <div id="dynamic-global-risk-posture-strip" className="mb-4 bg-gradient-to-r from-[#070e0a] via-[#102414] to-[#070e0a] border border-green-500/20 rounded p-3 text-white shadow-md relative overflow-hidden flex-shrink-0 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#00ff44] opacity-50" />
          
          <div className="flex items-center gap-3">
            <div className="text-center bg-[#ff3b4e]/10 border border-[#ff3b4e]/30 px-3 py-1.5 rounded relative shrink-0">
              <span className="text-[8px] text-red-400 font-bold block uppercase tracking-widest leading-none mb-1">AGGREGATE DANGER</span>
              <span className="text-xl font-display font-extrabold text-red-500 leading-none">
                {riskPosture.averageThreat}%
              </span>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#00ff44]">LIVE CRISIS ASSESSMENT INDEX</h2>
              <p className="text-[9.5px] text-gray-400 leading-tight uppercase mt-0.5 max-w-sm">
                Computed assessment indices of the global simulation posture before initiating timeline. Adjust settings to recalculate threat matrix weights.
              </p>
            </div>
          </div>

          {/* High-value dynamic indicator score bars */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl w-full">
            
            {/* 1. Conflict Escalation */}
            <div className="bg-black/40 border border-green-950 p-2 rounded">
              <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase mb-1">
                <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-[#ff3b4e]" /> ESCALATION</span>
                <span className="text-[#ff3b4e]">{riskPosture.conflictIndex}%</span>
              </div>
              <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-[#ff3b4e]" style={{ width: `${riskPosture.conflictIndex}%` }} />
              </div>
            </div>

            {/* 2. Nuclear Brinkmanship */}
            <div className="bg-black/40 border border-green-950 p-2 rounded">
              <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase mb-1">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-red-400 animate-pulse" /> BRINKMANSHIP</span>
                <span className="text-red-400">{riskPosture.nuclearIndex}%</span>
              </div>
              <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${riskPosture.nuclearIndex}%` }} />
              </div>
            </div>

            {/* 3. Economic Fragility */}
            <div className="bg-black/40 border border-green-950 p-2 rounded">
              <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase mb-1">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-[#ff7700]" /> FRAGILITY</span>
                <span className="text-[#ff7700]">{riskPosture.economicIndex}%</span>
              </div>
              <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-[#ff7700]" style={{ width: `${riskPosture.economicIndex}%` }} />
              </div>
            </div>

            {/* 4. Civil Instability */}
            <div className="bg-black/40 border border-green-950 p-2 rounded">
              <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase mb-1">
                <span className="flex items-center gap-1"><Skull className="w-3 h-3 text-amber-400" /> INSTABILITY</span>
                <span className="text-amber-400">{riskPosture.civilIndex}%</span>
              </div>
              <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: `${riskPosture.civilIndex}%` }} />
              </div>
            </div>

            {/* 5. Intelligence Fog */}
            <div className="bg-black/40 border border-green-950 p-2 rounded col-span-2 md:col-span-1">
              <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase mb-1">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-[#00e5ff]" /> INTEL FOG</span>
                <span className="text-[#00e5ff]">{riskPosture.fogIndex}%</span>
              </div>
              <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-[#00e5ff]" style={{ width: `${riskPosture.fogIndex}%` }} />
              </div>
            </div>

          </div>
        </div>

        {/* GUIDED DECISION FLOW / THREE-PANEL DIRECTORY GRID */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-4 min-h-0 overflow-hidden mb-3">
          
          {/* STEP 1: CHOOSE SOVEREIGN IDENTITY & COMMAND ACTOR */}
          <div className="border border-[#1a5c1a]/40 bg-[#040805]/95 p-3 flex flex-col min-h-0 rounded-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-2 border-tl border-l border-t border-green-500/20" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-tr border-r border-b border-green-500/20" />
            
            <div className="flex items-center justify-between border-b border-[#1a5c1a]/50 pb-2 mb-2">
              <h3 className="text-xs uppercase font-bold text-[#00e5ff] tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00e5ff]" /> 01 // COGNATE ROSTER
              </h3>
              <span className="text-[8px] px-1.5 py-0.5 bg-green-950 text-green-400 font-bold border border-green-500/30 rounded">
                {filteredNations.length} NATIVES
              </span>
            </div>

            {/* Search Filter */}
            <div className="relative mb-2 flex-shrink-0">
              <input
                type="text"
                placeholder="Search sovereign index..."
                value={searchQuery}
                onChange={(e) => { audio.sfxKeyClick(); setSearchQuery(e.target.value); }}
                className="w-full bg-[#030603] border border-[#1a5c1a]/50 text-[11px] pl-8 pr-2 py-2 rounded text-white placeholder-green-850 outline-none focus:border-[#00ff44] transition-all font-mono uppercase"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-green-700" />
            </div>

            {/* Nation List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {filteredNations.map((n) => {
                const isSelected = n.id === selectedCountry;
                const isPlayable = activeScenarioObj?.playableCountryIds.includes(n.id);
                
                return (
                  <div
                    key={n.id}
                    id={`nation-card-${n.id}`}
                    onClick={() => { audio.sfxKeyClick(); setSelectedCountry(n.id); }}
                    className={`group border rounded p-2 cursor-pointer transition-all relative overflow-hidden ${
                      isSelected 
                        ? 'border-[#00ff44] bg-[#091a0a]/90 shadow-[0_0_10px_rgba(0,255,68,0.12)]' 
                        : 'border-[#143217]/40 bg-black/50 hover:border-green-600/60 hover:bg-green-950/5'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-y-0 left-0 w-[2.5px] bg-green-500" />
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{n.flag}</span>
                        <span className="font-bold text-xs uppercase text-white group-hover:text-green-300 transition-colors">
                          {n.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isPlayable ? (
                          <span className="text-[7px] text-[#00ff44] border border-[#00ff44]/30 px-1 py-px rounded font-semibold bg-[#00ff44]/5 block tracking-wide">
                            ACTOR
                          </span>
                        ) : (
                          <span className="text-[7.5px] text-gray-600 border border-gray-800/40 px-1 py-px rounded">
                            NON-THEATER
                          </span>
                        )}
                        <span className="text-[8px] font-mono px-1 bg-[#102a14] text-green-400 border border-green-500/20 rounded font-bold">
                          {n.id}
                        </span>
                      </div>
                    </div>

                    <div className="text-[9px] text-gray-500 mt-1 uppercase flex justify-between tracking-wider">
                      <span>GDP value: ${(n.gdp / 1000).toFixed(1)}T</span>
                      <span>Alliance: <span className="text-gray-400 font-bold">{n.alliance}</span></span>
                    </div>

                    {/* Meta progress bar visualizing tactical power index */}
                    <div className="mt-1.5 h-[2px] bg-[#0c1a0f] rounded-full overflow-hidden w-full relative">
                      <div 
                        className={`h-full transition-all duration-300 ${isSelected ? 'bg-green-400' : 'bg-green-800/40'}`}
                        style={{ width: `${n.power}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[7.5px] text-gray-600 mt-1 uppercase font-semibold">
                      <span>TACTICAL POWER LIMITS</span>
                      <span className={isSelected ? 'text-green-400' : 'text-gray-500'}>{n.power}%</span>
                    </div>
                  </div>
                );
              })}

              {filteredNations.length === 0 && (
                <div className="py-8 text-center text-gray-600 text-[10px] uppercase font-bold flex flex-col items-center gap-2">
                  <AlertOctagon className="w-8 h-8 text-gray-800" />
                  No database entries matched directory filters.
                </div>
              )}
            </div>
          </div>

          {/* STEP 2-3: THEATER INTEL DOSSIER & THEATER HOTSPOT PANEL (2 Columns) */}
          <div className="xl:col-span-2 flex flex-col min-h-0 gap-3 overflow-hidden">
            
            {/* RICH BRIEFING & DOSSIER FILE (dossier folders layout) */}
            <div id="dossier-story-briefing-panel" className="border border-amber-500/30 bg-[#0a0d0a]/98 p-3 rounded-md flex flex-col relative overflow-hidden flex-shrink-0 shadow-[0_0_20px_rgba(240,150,0,0.02)] border-b-2 border-b-amber-500/40">
              <div className="absolute top-0 right-0 w-3 h-3 border-tr border-r border-t border-amber-500/45" />
              <div className="classification-banner absolute top-2 right-2 text-[#ffb300] flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[8px] font-bold font-mono tracking-widest">
                <FileText className="w-3 h-3 text-amber-500 inline" /> OPERATIONAL SITREP // CLASSIFIED
              </div>

              <h3 className="text-xs uppercase font-bold text-[#ffb300] tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ffb300]" /> 02 // DIRECTIVE SITUATION INTELLIGENCE (SITREP)
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                
                {/* Scenario details dossier */}
                <div className="lg:col-span-8 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="text-sm font-display font-extrabold text-white tracking-widest uppercase flex items-center gap-2">
                      <span className="text-[#ffb300] font-bold">THEATER DIRECTIVE:</span> {activeScenarioObj?.name}
                    </h4>
                    
                    <p className="text-[10px] text-gray-300 leading-normal mt-1 border-l-2 border-amber-500/40 pl-2 py-1 bg-amber-500/5 rounded-r italic">
                      "{activeScenarioObj?.description}"
                    </p>
                  </div>

                  {/* recommended/framing objectives */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px]">
                    <div className="bg-[#121914] border border-green-500/20 p-2 rounded relative">
                      <span className="text-[7.5px] text-green-400 font-bold block mb-0.5 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-400 inline" /> CORE MISSION OBJECTIVE
                      </span>
                      <p className="text-gray-300 uppercase leading-snug">
                        {activeScenarioObj?.winDescription}
                      </p>
                    </div>

                    <div className="bg-[#1b1011] border border-red-500/20 p-2 rounded relative">
                      <span className="text-[7.5px] text-red-400 font-bold block mb-0.5 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400 inline" /> THREAT CRISIS CRITICALS
                      </span>
                      <p className="text-gray-300 uppercase leading-snug">
                        {activeScenarioObj?.lossDescription}
                      </p>
                    </div>
                  </div>

                  {/* recommended user line */}
                  <div className={`p-2 border rounded text-[9px] ${recommendedArchetype.style} transition-all duration-350`}>
                    <span className="font-extrabold uppercase tracking-wide block mb-0.5 text-center">
                      ★ COMMISSION SUGGESTION: {recommendedArchetype.label}
                    </span>
                    <p className="text-gray-300 uppercase text-[8px] text-center max-w-lg mx-auto leading-normal">
                      {recommendedArchetype.description}
                    </p>
                  </div>
                </div>

                {/* Micro Metadata sidebar column inside Briefing dossier */}
                <div className="lg:col-span-4 bg-[#061008] border border-[#1d4221] rounded p-2 text-[9.5px] flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[7px] text-gray-500 font-bold uppercase tracking-wider block">INTELLIGENCE CHECKS:</span>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 uppercase text-[8px]">DIFFICULTY:</span>
                      <span className={`font-bold ${
                        activeScenarioObj?.difficulty === 'EXPERT' ? 'text-red-500' :
                        activeScenarioObj?.difficulty === 'HARD' ? 'text-amber-500' : 'text-green-400'
                      }`}>{activeScenarioObj?.difficulty}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 uppercase text-[8px]">THREAT STATUS:</span>
                      <span className={`font-bold uppercase ${
                        activeScenarioObj?.threatLevel === 'RED' ? 'text-red-500' :
                        activeScenarioObj?.threatLevel === 'ORANGE' ? 'text-[#ffb300]' : 'text-[#00e5ff]'
                      }`}>{activeScenarioObj?.threatLevel} ALERT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 uppercase text-[8px]">ROSTER COOPERATIVES:</span>
                      <span className="text-gray-300 font-bold font-mono">
                        {activeScenarioObj?.playableCountryIds.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#1d4221]/40 pt-1.5 space-y-1">
                    <span className="text-[7px] text-gray-500 font-bold uppercase block tracking-wider">COMMAND ELIGIBILITY:</span>
                    {isSelectedCountryPlayable ? (
                      <span className="text-green-400 font-bold flex items-center justify-center gap-1 text-[8.5px] border border-green-500/20 bg-green-950/15 p-1 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 inline shrink-0" /> PLAYABLE IDENTITY COGNATE
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center justify-center gap-1 text-[8.5px] border border-red-500/30 bg-red-950/20 p-1 rounded animate-pulse">
                        <XCircle className="w-3.5 h-3.5 text-red-400 inline shrink-0" /> INELIGIBLE COSIGN ACTOR
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* THEATER CONFIGURATION TABS (Interactive SVG Map / Leader Override Suite) */}
            <div className="border border-[#1a5c1a]/40 bg-[#030604]/95 p-3 rounded-md flex-1 flex flex-col min-h-0 relative">
              <div className="absolute top-0 right-0 w-2 h-2 border-[#1a5c1a] border-t border-r" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-[#1a5c1a] border-b border-l" />

              {/* TABS HEADER */}
              <div className="flex justify-between items-center mb-2 px-1 flex-shrink-0 border-b border-[#1a5c1a]/30 pb-2">
                <div id="leadership-tab-header" className="flex gap-2">
                  <button
                    onClick={() => { audio.sfxKeyClick(); setActiveTab('LEADERS'); }}
                    className={`px-3 py-1 text-[9px] font-mono font-bold tracking-widest rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'LEADERS'
                        ? 'bg-[#00ff4d]/15 text-[#00ff4d] border border-[#00ff4d]/40 shadow-[0_0_10px_rgba(0,255,77,0.2)]'
                        : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> STRATEGIC LEADERSHIP CONFIG
                  </button>
                  <button
                    onClick={() => { audio.sfxKeyClick(); setActiveTab('HOTSPOTS'); }}
                    className={`px-3 py-1 text-[9px] font-mono font-bold tracking-widest rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'HOTSPOTS'
                        ? 'bg-[#00ff4d]/15 text-[#00ff4d] border border-[#00ff4d]/40 shadow-[0_0_10px_rgba(0,255,77,0.2)]'
                        : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" /> THEATER HOTSPOT MAP
                  </button>
                </div>
                <span className="text-[7.5px] text-gray-500 font-bold font-mono">VECTOR SEC-COORD-993</span>
              </div>

              {activeTab === 'HOTSPOTS' ? (
                /* Simplified geographic SVG Map containing coordinates of countries and pulsars */
                <div className="flex-1 bg-black/60 rounded border border-[#122e17] overflow-hidden relative flex items-center justify-center">
                  <svg viewBox="0 0 500 240" className="w-full h-full max-h-[220px] text-gray-405 select-none" xmlns="http://www.w3.org/2000/svg">
                    {/* Stylized geometric grid background lines inside SVG */}
                    <defs>
                      <pattern id="mapGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0, 255, 68, 0.025)" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#mapGrid)"/>

                    {/* Draw global meridian lines */}
                    <line x1="250" y1="0" x2="250" y2="240" stroke="rgba(0, 255, 68, 0.05)" strokeDasharray="2,3" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(0, 255, 68, 0.05)" strokeDasharray="2,3" />

                    {/* Abstract continent guides for tactical feel */}
                    {/* America */}
                    <path d="M 50 40 Q 120 40 140 100 T 170 150 T 210 220 Q 180 230 160 180 T 100 130 T 40 60 Z" fill="rgba(0,255,100,0.015)" stroke="rgba(20,50,30,0.2)" strokeWidth="1" />
                    {/* Africa & Eurasia */}
                    <path d="M 260 65 Q 350 40 450 50 T 480 120 T 360 210 T 290 190 T 255 130 Z" fill="rgba(0,255,100,0.015)" stroke="rgba(20,50,30,0.2)" strokeWidth="1" />
                    {/* Australia */}
                    <path d="M 430 180 Q 470 170 480 200 T 440 220 Z" fill="rgba(0,255,100,0.015)" stroke="rgba(20,50,30,0.2)" strokeWidth="1" />

                    {/* Lines mapping lines of communication / hotspots between locations */}
                    {scenarioHotspots.length > 1 && scenarioHotspots.map((pt, index) => {
                      if (index === 0) return null;
                      const prev = scenarioHotspots[index - 1];
                      return (
                        <g key={`corr-${index}`}>
                          <path 
                            d={`M ${prev.cx} ${prev.cy} Q ${(prev.cx + pt.cx)/2} ${(prev.cy + pt.cy)/2 - 30} ${pt.cx} ${pt.cy}`} 
                            fill="none" 
                            stroke="rgba(245, 158, 11, 0.4)" 
                            strokeWidth="1" 
                            strokeDasharray="3,3" 
                          />
                          <circle cx={(prev.cx + pt.cx)/2} cy={(prev.cy + pt.cy)/2 - 15} r="2" fill="#ffb300" className="animate-ping" />
                        </g>
                      );
                    })}

                    {/* Map coordinates indicators */}
                    {LOBBY_NATIONS.map((n) => {
                      const isHotspot = scenarioHotspots.some(h => h.id === n.id);
                      const isSelected = n.id === selectedCountry;
                      
                      return (
                        <g key={`dot-${n.id}`}>
                          <circle 
                            cx={n.cx} 
                            cy={n.cy} 
                            r={isSelected ? "4" : isHotspot ? "3" : "1.5"} 
                            fill={isHotspot ? "#ff7700" : isSelected ? "#00ff77" : "rgba(0,255,100,0.15)"} 
                            className={isHotspot || isSelected ? 'animate-pulse' : ''}
                          />
                          {(isHotspot || isSelected) && (
                            <circle 
                              cx={n.cx} 
                              cy={n.cy} 
                              r={isSelected ? "12" : "8"} 
                              fill="none" 
                              stroke={isHotspot ? "#ffb300" : "#00ff77"} 
                              strokeWidth="0.5" 
                              className="animate-ping" 
                              style={{ animationDuration: isSelected ? '2.5s' : '4s' }}
                            />
                          )}
                          {/* Compact coordinate pointer label */}
                          {(isHotspot || isSelected) && (
                            <text 
                              x={n.cx + 6} 
                              y={n.cy + 3} 
                              fill={isHotspot ? "#ffb300" : "#00ff77"} 
                              fontSize="6" 
                              fontWeight="bold" 
                              fontFamily="monospace"
                            >
                              {n.id}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Legend list Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2 justify-center bg-black/80 backdrop-blur-sm border border-[#1b3d1f] p-1.5 rounded">
                    <div className="text-[7.5px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#00ff77] rounded-full inline-block" /> SELECTED IDENTITY
                    </div>
                    <div className="text-[7.5px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#ff7700] rounded-full inline-block" /> THEATER FOCUS ACTOR
                    </div>
                    <div className="text-[7.5px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <span className="w-3.5 h-px bg-yellow-500 border-t border-dashed inline-block" /> COGNATE LINK VECTOR
                    </div>
                  </div>

                  {/* Scenario details focus metadata */}
                  {scenarioHotspots.length > 0 && (
                    <div className="absolute top-2 right-2 bg-black/90 p-2 rounded border border-amber-500/20 text-left max-w-[160px]">
                      <span className="text-[7px] text-amber-500 font-bold block uppercase border-b border-[#112d16] pb-0.5 mb-1">THEATER FOCUS SEC:</span>
                      <ul className="text-[7.5px] space-y-1 text-gray-300 uppercase">
                        {scenarioHotspots.map((h, idx) => (
                          <li key={idx} className="truncate">🎯 {h.label}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                /* LEADER PERSONALITY CONTROLS */
                <div className="flex-1 flex flex-col min-h-0 space-y-2 text-xs">
                  {/* Presets Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between bg-black/40 border border-[#1a5c1a]/25 p-1.5 rounded gap-2 flex-shrink-0 text-[10px]">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Workflow className="w-3.5 h-3.5 text-amber-500" />
                      PRE-GAME LEADERSHIP PRESETS:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { key: 'DEFAULT', label: 'ALL DEFAULT', style: 'border-gray-800 text-gray-400 hover:bg-gray-850 hover:text-white' },
                        { key: 'COLD_WAR_HOT', label: 'COLD WAR HOT', style: 'border-red-900/40 text-red-400 hover:bg-red-950/20 hover:border-red-500' },
                        { key: 'DIPLOMATIC', label: 'DIPLOMATIC', style: 'border-blue-900/40 text-[#4da6ff] hover:bg-blue-950/20 hover:border-blue-500' },
                        { key: 'CHAOTIC', label: 'CHAOTIC', style: 'border-purple-900/40 text-purple-400 hover:bg-purple-950/20 hover:border-purple-500' },
                      ].map((p) => (
                        <button
                          key={p.key}
                          onClick={() => { audio.playPhaseReveal(); applyLeaderPreset(p.key as any); }}
                          className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border rounded cursor-pointer transition-all ${p.style}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split Layout Section */}
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0 overflow-hidden">
                    
                    {/* PRIMARY MAJOR POWERS */}
                    <div className="flex flex-col min-h-0 space-y-1.5 pr-1 border-r border-[#1a5c1a]/20">
                      <span className="text-[8.5px] font-bold text-amber-400 tracking-wider uppercase border-b border-[#1a5c1a]/15 pb-1 flex justify-between items-center">
                        <span>★ PRIMARY THEATER POWERS (EXECUTIVE COGNATES)</span>
                        <span className="text-[7px] text-gray-500 font-normal">PERSISTENT FROM TICK 0</span>
                      </span>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {(() => {
                          const mainPowers = Array.from(new Set(['US', 'RU', 'CN', selectedCountry]));
                          return mainPowers.map((cId) => {
                            const cObj = LOBBY_NATIONS.find(n => n.id === cId);
                            if (!cObj) return null;
                            const currentPers = leaderOverrides[cId] || getDefaultLeaderPersonality(cId);
                            const leaderDataRef = getDeterministicLeaderPreview(cId, currentPers);
                            
                            return (
                              <div key={cId} className="bg-black/70 border border-[#16381b] p-1.5 rounded flex gap-2 relative">
                                <div className="absolute top-1 right-2 text-[7px] font-bold">
                                  {cId === selectedCountry ? (
                                    <span className="text-green-400">(PLAYER BASE)</span>
                                  ) : (
                                    <span className="text-gray-500">NPC COGNATE</span>
                                  )}
                                </div>

                                {/* Portrait Preview */}
                                <div className="w-10 h-10 border border-[#1a5c1a]/30 bg-black overflow-hidden rounded relative flex-shrink-0">
                                  <img 
                                    src={leaderDataRef.portraitDataUrl} 
                                    alt={leaderDataRef.name} 
                                    className="w-full h-full object-cover scale-105" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>

                                <div className="flex-1 flex flex-col min-h-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px]">{cObj.flag}</span>
                                    <span className="text-[9px] font-bold text-white uppercase truncate">{cObj.name}</span>
                                  </div>
                                  <div className="text-[8px] text-[#00ff51] font-mono truncate">
                                    {leaderDataRef.name}
                                  </div>

                                  {/* Selection Row */}
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {Object.values(LeaderPersonality).map((pers) => {
                                      const isSel = currentPers === pers;
                                      return (
                                        <button
                                          key={pers}
                                          onClick={() => { audio.sfxKeyClick(); handleOverrideLeader(cId, pers); }}
                                          className={`text-[6.5px] font-mono font-extrabold px-1 py-0.5 border rounded cursor-pointer transition-all ${
                                            isSel
                                              ? 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-[0_0_6px_rgba(240,150,0,0.15)]'
                                              : 'border-gray-850 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                                          }`}
                                        >
                                          {pers}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Multipliers Indicator */}
                                  <div className="mt-1 flex items-center justify-between text-[7px] border-t border-gray-900 pt-0.5 text-gray-500">
                                    <span>ESCALATION: <span className="text-gray-300 font-bold">{getEscalationLabel(currentPers)}</span></span>
                                    <span>RISK PROPENS: <span className="text-gray-300 font-bold">{getRiskLabel(currentPers)}</span></span>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* REGIONAL MIDDLE POWERS */}
                    <div className="flex flex-col min-h-0 space-y-1.5 pl-1">
                      <span className="text-[8.5px] font-bold text-gray-400 tracking-wider uppercase border-b border-[#1a5c1a]/15 pb-1 flex justify-between items-center">
                        <span>☒ REGIONAL NATIONS</span>
                        <span className="text-[7px] text-gray-505 font-mono">MIDDLE POWERS</span>
                      </span>

                      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {(() => {
                          const mainPowers = Array.from(new Set(['US', 'RU', 'CN', selectedCountry]));
                          const secondaryCountries = LOBBY_NATIONS.filter(n => !mainPowers.includes(n.id));
                          
                          return secondaryCountries.map((cObj) => {
                            const cId = cObj.id;
                            const currentPers = leaderOverrides[cId] || getDefaultLeaderPersonality(cId);
                            const leaderDataRef = getDeterministicLeaderPreview(cId, currentPers);
                            
                            return (
                              <div key={cId} className="bg-black/40 border border-gray-905 p-1 rounded flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-[100px] truncate">
                                  <span className="text-[10px] shrink-0">{cObj.flag}</span>
                                  <div className="flex flex-col truncate">
                                    <span className="text-[8.5px] font-bold text-gray-300 uppercase truncate">{cObj.name}</span>
                                    <span className="text-[7px] text-gray-505 truncate font-mono">{leaderDataRef.name}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <select
                                    value={currentPers}
                                    onChange={(e) => { audio.sfxKeyClick(); handleOverrideLeader(cId, e.target.value as LeaderPersonality); }}
                                    className="bg-gray-950 border border-[#1b3c1d]/50 text-amber-500 font-extrabold text-[7.5px] font-mono py-0.5 px-1 rounded cursor-pointer focus:outline-none focus:border-amber-400 text-right uppercase"
                                  >
                                    {Object.values(LeaderPersonality).map((pers) => (
                                      <option key={pers} value={pers}>{pers}</option>
                                    ))}
                                  </select>
                                  {leaderOverrides[cId] && (
                                    <button
                                      onClick={() => { audio.sfxKeyClick(); handleResetLeader(cId); }}
                                      className="text-red-500 hover:text-red-400 text-[8px] px-1 font-mono hover:bg-red-950/20 rounded cursor-pointer"
                                      title="Reset user override"
                                    >
                                      ⟲
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

          </div>

          {/* STEP 4-5: ELITE PRESET SELECTOR & CUSTOM HARDENERS (1 Column) */}
          <div className="border border-[#1a5c1a]/45 bg-[#040805]/95 p-3 flex flex-col min-h-0 rounded-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-2 border-tr border-r border-t border-green-500/20" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-bl border-l border-b border-green-500/20" />

            <div className="flex items-center justify-between border-b border-[#1a5c1a]/40 pb-2 mb-2 flex-shrink-0">
              <h3 className="text-xs uppercase font-bold text-[#00e5ff] tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00e5ff]" /> 03 // STRATEGIC INDEX presets
              </h3>
              <span className="text-[8px] text-[#ffb300] font-bold">GRID SYNCED</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar text-[11px]">
              
              {/* SECTION 5 — STRATEGIC PRESET DESK */}
              <div id="strategic-presets-desk" className="bg-[#0c180f] p-2 rounded border border-green-500/25 space-y-2">
                <span className="text-[8.5px] text-[#00ff44] font-bold uppercase tracking-widest block border-b border-green-850 pb-1">
                  ★ ELITE STRATEGY POSTURES
                </span>
                
                <div className="grid grid-cols-1 gap-1.5">
                  {/* Preset 1: Analyst peacekeeper */}
                  <button
                    onClick={() => handleApplyPreset('ANALYST_MODE')}
                    className={`text-left p-1.5 rounded border transition-all text-[9px] ${
                      selectedPreset === 'ANALYST_MODE' 
                        ? 'border-green-400 bg-green-950/40 text-white' 
                        : 'border-[#1a5c1a]/20 bg-black/40 text-gray-400 hover:border-green-800'
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-green-400">📊 ANALYST (PEACEKEEPER)</span>
                      <span className="text-[7.5px] text-green-500 font-semibold mb-0.5">NOMINAL ESC</span>
                    </div>
                    <p className="text-[7.5px] text-gray-500 leading-normal uppercase mt-0.5">
                      Low volatility, NFU nuclear stance, starting with maximum global intelligence.
                    </p>
                  </button>

                  {/* Preset 2: NATO Operational standard */}
                  <button
                    onClick={() => handleApplyPreset('NATO_STAFF')}
                    className={`text-left p-1.5 rounded border transition-all text-[9px] ${
                      selectedPreset === 'NATO_STAFF' 
                        ? 'border-amber-400 bg-amber-950/20 text-white' 
                        : 'border-[#1a5c1a]/20 bg-black/40 text-gray-400 hover:border-green-800'
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-amber-400">🛡️ NATO TACTICAL DEFAULT</span>
                      <span className="text-[7.5px] text-[#ffb300] font-semibold">TENSE LEVEL</span>
                    </div>
                    <p className="text-[7.5px] text-gray-500 leading-normal uppercase mt-0.5">
                      Standardized deterrence, partial starting intel fog, flexible doctrine.
                    </p>
                  </button>

                  {/* Preset 3: Doomsday */}
                  <button
                    onClick={() => handleApplyPreset('DOOMSDAY')}
                    className={`text-left p-1.5 rounded border transition-all text-[9px] ${
                      selectedPreset === 'DOOMSDAY' 
                        ? 'border-red-400 bg-red-950/30 text-white animate-pulse' 
                        : 'border-[#1a5c1a]/20 bg-black/40 text-gray-400 hover:border-green-800'
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-red-400">💀 DOOMSDAY STRATEGIST</span>
                      <span className="text-[7.5px] text-red-500 font-extrabold pb-0.5">CRITICAL ALRT</span>
                    </div>
                    <p className="text-[7.5px] text-gray-500 leading-normal uppercase mt-0.5">
                      Maximum substate activity, launch-on-warning atomic posture, total intel blackout.
                    </p>
                  </button>
                </div>
              </div>

              {/* CLOCK METRIC CONFIGURATION */}
              <DurationSelector
                durationMode={durationMode}
                setDurationMode={setDurationMode}
                timedTicks={timedTicks}
                setTimedTicks={setTimedTicks}
                tickScale={tickScale}
                setTickScale={setTickScale}
                audio={audio}
              />

              <div className="space-y-2 bg-black/40 p-2 rounded border border-green-500/10">
                <div className="grid grid-cols-1 gap-2 mt-1">
                  <div className="space-y-1">
                    <label className="text-[8px] text-gray-400 uppercase block font-bold">DOCKET START:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#030603] border border-[#1a5c1a]/50 text-[9px] px-1.5 py-1 rounded text-white outline-none focus:border-[#00ff44] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* MILITARY SYSTEM PROTOCOLS */}
              <div className="space-y-2.5 bg-black/40 p-2 rounded border border-green-500/10">
                <span className="text-[9px] text-[#00e5ff] font-bold uppercase tracking-widest block border-b border-[#1a5c1a]/15 pb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#00e5ff]" /> II. TACTICAL PARAMETERS
                </span>

                {/* Slider: AI Aggression */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[8.5px]">
                    <span className="text-gray-500 font-bold uppercase">AI AGGRESSION STRAP:</span>
                    <span className="text-[#00ff44] font-bold font-mono">{aiAggression} // LEV</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={aiAggression}
                    onChange={(e) => { audio.sfxKeyClick(); setAiAggression(parseInt(e.target.value)); }}
                    className="w-full sovereign-slider accent-[#00ff44]"
                    style={{ '--pct': `${(aiAggression - 1) / 4 * 100}%` } as React.CSSProperties}
                  />
                </div>

                {/* Dropdown: Nuclear Esc Doctrine */}
                <div className="space-y-1">
                  <label className="text-[8.5px] text-gray-500 uppercase block font-bold">NUCLEAR ESC DOCTRINE:</label>
                  <select
                    value={nuclearDoctrine}
                    onChange={(e) => { audio.sfxKeyClick(); setNuclearDoctrine(e.target.value as any); }}
                    className="w-full bg-[#030603] border border-[#1a5c1a]/50 text-[9px] px-2 py-1.5 rounded text-white outline-none focus:border-[#00ff44] font-mono cursor-pointer uppercase"
                  >
                    <option value="NO_FIRST_USE">NO FIRST USE (DEFENSIVE LIMITS)</option>
                    <option value="FLEXIBLE">FLEXIBLE RESPONSE (TENSE ESC)</option>
                    <option value="LAUNCH_ON_WARNING">LAUNCH ON WARNING DETECTOR</option>
                  </select>
                </div>

                {/* Buttons: Intelligence coverage */}
                <div className="space-y-1">
                  <label className="text-[8.5px] text-gray-500 uppercase block font-bold">START INTEL RESOLUTION:</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['BLIND', 'PARTIAL', 'FULL'] as const).map(intel => (
                      <button
                        key={intel}
                        onClick={() => { audio.sfxKeyClick(); setStartingIntel(intel); }}
                        className={`text-[8px] font-bold py-1 border rounded cursor-pointer transition-all ${
                          startingIntel === intel 
                            ? 'border-[#00ff44] bg-[#071708] text-[#00ff44] font-extrabold' 
                            : 'border-[#1a5c1a]/20 bg-black/30 text-gray-500 hover:text-white'
                        }`}
                      >
                        {intel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle: Consequence permanence */}
                <div 
                  onClick={() => { audio.sfxKeyClick(); setConsequencesEnabled(!consequencesEnabled); }}
                  className={`flex justify-between items-center p-1.5 border rounded cursor-pointer transition-all text-[8.5px] ${
                    consequencesEnabled ? 'border-[#00ff44]/50 bg-green-950/10' : 'border-[#1a5c1a]/15 bg-black/10'
                  }`}
                >
                  <span className="text-gray-500 uppercase font-bold">PERMANENT CONSEQUENCE SCARS:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] font-bold ${consequencesEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                      {consequencesEnabled ? 'PERMANENT' : 'TRANSIENT'}
                    </span>
                    <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                      consequencesEnabled ? 'border-green-400 bg-green-950' : 'border-gray-700 bg-black'
                    }`}>
                      {consequencesEnabled && <div className="w-1.5 h-1.5 bg-green-400 rounded-sm" />}
                    </div>
                  </div>
                </div>

                {/* Sliders: Economic Volatility & Substate Activity */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1a5c1a]/10">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[7.5px] font-bold text-gray-500">
                      <span>ECON VOLATILITY</span>
                      <span className="text-[#00ff44]">{economicVolatility}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={economicVolatility}
                      onChange={(e) => { audio.sfxKeyClick(); setEconomicVolatility(parseInt(e.target.value)); }}
                      className="w-full sovereign-slider accent-[#00ff44]"
                      style={{ '--pct': `${(economicVolatility - 1) / 4 * 100}%` } as React.CSSProperties}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[7.5px] font-bold text-gray-500">
                      <span>SUBSTATE ACTIVITY</span>
                      <span className="text-[#00ff44]">{substateActivity}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={substateActivity}
                      onChange={(e) => { audio.sfxKeyClick(); setSubstateActivity(parseInt(e.target.value)); }}
                      className="w-full sovereign-slider accent-[#00ff44]"
                      style={{ '--pct': `${(substateActivity - 1) / 4 * 100}%` } as React.CSSProperties}
                    />
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* STEP 6: DECISION LAUNCH - SCENARIO CARD SELECTORS PANEL (Expanded Row) */}
        <div className="border border-[#1a5c1a]/40 bg-[#040805]/95 p-2 px-3 rounded-md flex-shrink-0 mb-3 select-none relative">
          <div className="flex items-center justify-between border-b border-[#1a5c1a]/40 pb-1.5 mb-2 flex-shrink-0">
            <h4 className="text-[9.5px] font-bold text-[#00ff44] uppercase tracking-widest flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-[#00ff44]" /> 04 // SELECT CRISIS ESCALATION PROTOCOL MATRIX
            </h4>
            <span className="text-[7.5px] text-gray-505 font-mono text-gray-500 uppercase">SIX SECURE SCENARIO FILES</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {Object.values(SCENARIOS).map((sc) => {
              const isSelected = sc.id === selectedScenario;
              const alertColor = 
                sc.threatLevel === 'RED' ? 'border-red-500/20' :
                sc.threatLevel === 'ORANGE' ? 'border-amber-500/20' : 'border-[#00e5ff]/20';
              const alertBg = 
                sc.threatLevel === 'RED' ? 'bg-red-950/5' :
                sc.threatLevel === 'ORANGE' ? 'bg-amber-950/5' : 'bg-cyan-950/5';
              const textHighlight = 
                sc.threatLevel === 'RED' ? 'text-red-400' :
                sc.threatLevel === 'ORANGE' ? 'text-[#ffb300]' : 'text-[#00e5ff]';

              return (
                <div
                  key={sc.id}
                  id={`scenario-card-${sc.id}`}
                  onClick={() => { audio.sfxKeyClick(); setSelectedScenario(sc.id); }}
                  className={`group border rounded p-1.5 cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                    isSelected 
                      ? 'border-amber-500 bg-amber-950/20 shadow-[0_0_10px_rgba(255,179,0,0.1)]' 
                      : `${alertColor} ${alertBg} hover:border-[#ffb300]/50 hover:bg-[#ffb300]/5`
                  }`}
                >
                  <div className="flex justify-between items-start border-b border-[#1a5c1a]/15 pb-1 mb-1">
                    <span className={`font-bold text-[9.5px] uppercase tracking-wide group-hover:text-amber-400 transition-colors ${isSelected ? 'text-amber-400' : 'text-white'} truncate`}>
                      {sc.name}
                    </span>
                  </div>
                  
                  <p className="text-[8px] text-gray-500 leading-tight uppercase line-clamp-1">
                    {sc.description}
                  </p>

                  <div className="text-[7.5px] text-gray-500 mt-1.5 pt-1 border-t border-[#1a5c1a]/10 flex justify-between items-center font-mono">
                    <span className={`font-bold uppercase ${textHighlight}`}>{sc.threatLevel}</span>
                    <span className="text-[7px] text-gray-500">DF: {sc.difficulty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM COMMAND INITIATION DECK (Ingress Control Bar) */}
        <div className="border-t border-[#184918]/60 pt-3 flex flex-col md:flex-row gap-3 items-center justify-between flex-shrink-0 relative z-20">
          
          <div className="flex items-center gap-4 text-left w-full md:w-auto">
            {/* Custom blinking terminal indicator */}
            <div className="hidden sm:flex items-center justify-center p-2.5 bg-green-500/5 border border-green-500/25 rounded">
              <Radio className="w-5 h-5 text-[#00ff44] animate-pulse" />
            </div>
            <div>
              <span className="text-[#ffb300] text-[10px] font-bold font-mono block uppercase tracking-widest leading-none">
                AUTHORIZE MISSION DEPLOYMENT COGNATE: {selectedCountry} // THEATER: {activeScenarioObj?.name.toUpperCase()}
              </span>
              <span className="text-[9.5px] text-gray-550 uppercase tracking-wide block mt-1 leading-snug max-w-2xl text-gray-400">
                Lobby verified cryptographically inside command deck. Direct sovereign overrides and custom operational guidelines are pre-aligned to target directives. Launch whenever fully prepared.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
            
            {/* Trigger World Builder custom matrix overwrite */}
            <button
              onClick={() => { audio.sfxKeyClick(); onOpenWorldBuilder(); }}
              className="px-4 py-3 bg-black/40 hover:bg-[#112411]/40 border border-green-500/30 hover:border-green-400 text-green-300 text-[9.5px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              WORLD MATRIX BUILDER
            </button>

            <button
              onClick={handleLaunchGame}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-black text-xs font-bold font-display uppercase tracking-widest cursor-pointer rounded shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] hover:from-green-400 hover:to-emerald-500 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-black font-extrabold animate-pulse" />
              LAUNCH SIMULATION COGNATE
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
