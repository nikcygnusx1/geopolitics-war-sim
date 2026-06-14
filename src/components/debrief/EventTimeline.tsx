import React, { useMemo } from 'react';
import { 
  Swords, 
  Flame, 
  ShieldAlert, 
  Coins, 
  ShieldCheck, 
  AlertOctagon,
  FileSpreadsheet
} from 'lucide-react';

interface EventLogItem {
  tick: number;
  text: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SYSTEM';
}

interface EventTimelineProps {
  id: string;
  events: EventLogItem[];
}

interface CuratedEvent {
  tick: number;
  title: string;
  description: string;
  category: 'nuclear' | 'conflict' | 'diplomatic' | 'economic' | 'political';
  icon: React.ReactNode;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ id, events }) => {
  const curatedList = useMemo(() => {
    if (!events || events.length === 0) return [];

    const curated: CuratedEvent[] = [];
    const lowerTextsSeen = new Set<string>();

    // Process from oldest to newest for chronological flow
    const chronologicalEvents = [...events].reverse();

    for (const raw of chronologicalEvents) {
      const text = raw.text;
      const lower = text.toLowerCase();

      // 1. Filter out redundant radar flight scans to avoid spamming the logs
      if (lower.includes('radar confirmation of tactical') || lower.includes('projected. target impacts projected')) {
        continue;
      }

      // 2. Prevent duplicate entries
      let isDuplicate = false;
      for (const seen of lowerTextsSeen) {
        // Semantic likeness filter
        if (seen === lower || (seen.length > 15 && lower.includes(seen.substring(0, 15)))) {
          isDuplicate = true;
          break;
        }
      }
      if (isDuplicate) continue;
      lowerTextsSeen.add(lower);

      // Categorization and refinement mapping
      let category: CuratedEvent['category'] = 'diplomatic';
      let title = 'Strategic Directive';
      let icon = <FileSpreadsheet className="w-3.5 h-3.5" />;
      let description = text;

      if (lower.includes('critical impact') || lower.includes('strike hit') || lower.includes('exploded overhead')) {
        category = 'nuclear';
        title = 'Operational Impact';
        icon = <Flame className="w-3.5 h-3.5 text-rose-500" />;
      } else if (lower.includes('war') || lower.includes('hostilities') || lower.includes('declared combat')) {
        category = 'conflict';
        title = 'War Declaration';
        icon = <Swords className="w-3.5 h-3.5 text-red-500" />;
      } else if (lower.includes('ceasefire') || lower.includes('peace treaty')) {
        category = 'conflict';
        title = 'Ceasefire Resolved';
        icon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      } else if (lower.includes('sanction') || lower.includes('embargo') || lower.includes('market') || lower.includes('printing press')) {
        category = 'economic';
        title = 'Macroeconomic Sanctions';
        icon = <Coins className="w-3.5 h-3.5 text-amber-500" />;
      } else if (lower.includes('coup') || lower.includes('unrest') || lower.includes('dissidents') || lower.includes('unrest sparked')) {
        category = 'political';
        title = 'Sovereign Unrest';
        icon = <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />;
      } else if (lower.includes('alliance') || lower.includes('treaty signed')) {
        category = 'diplomatic';
        title = 'Coalition Formed';
        icon = <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />;
      } else if (raw.severity === 'SYSTEM') {
        category = 'diplomatic';
        title = 'Command Protocol';
        icon = <AlertOctagon className="w-3.5 h-3.5 text-indigo-400" />;
      }

      curated.push({
        tick: raw.tick,
        title,
        description,
        category,
        icon,
      });
    }

    // Limit to 8 critical events to preserve pristine legibility, especially on share screenshots
    return curated.slice(-8);
  }, [events]);

  if (curatedList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500" id={id}>
        <FileSpreadsheet className="w-8 h-8 opacity-25 mb-2" />
        <span className="font-mono text-xs uppercase tracking-tight">No significant tactical records registered</span>
      </div>
    );
  }

  return (
    <div id={id} className="relative pl-3.5 border-l border-slate-800/80 space-y-4">
      {/* Dynamic continuous connector line glow */}
      <div className="absolute top-2 bottom-2 left-0 -ml-[0.5px] w-[1px] bg-gradient-to-b from-cyan-500/25 via-slate-500/10 to-transparent pointer-events-none" />

      {curatedList.map((item, index) => (
        <div 
          key={index} 
          className="relative group transition-all duration-300"
          id={`timeline-item-${index}`}
        >
          {/* Node dot icon indicator */}
          <div className="absolute -left-[20.5px] top-1 flex items-center justify-center w-[13px] h-[13px] rounded-full bg-slate-950 border border-slate-700/85 text-[8px]">
            <div className="w-[5px] h-[5px] rounded-full bg-cyan-500/80 group-hover:bg-cyan-400 transition-colors" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wide">
              <span className="text-cyan-400 font-bold">Tick {item.tick}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 font-semibold text-slate-400">
                {item.icon}
                {item.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans mt-1 leading-relaxed antialiased">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
