export type TickDuration = 'DAY' | 'WEEK' | 'MONTH';
export type GameDurationMode = 'SCENARIO' | 'TIMED' | 'ENDLESS';

export interface GameClock {
  tickDuration: TickDuration;
  calendarStartDate: string;
  currentCalendarDate: string;
  currentTick: number;
  sessionStartTimestamp: number;
  sessionElapsedSeconds: number;
  durationMode: GameDurationMode;
  timedDurationTicks?: number;
  scenarioDurationTicks?: number;
}

export function advanceCalendar(currentCalendarDate: string, tickDuration: TickDuration): string {
  const current = new Date(currentCalendarDate);
  if (isNaN(current.getTime())) return '2027-01-01';
  switch (tickDuration) {
    case 'DAY':
      current.setDate(current.getDate() + 1);
      break;
    case 'WEEK':
      current.setDate(current.getDate() + 7);
      break;
    case 'MONTH':
      current.setMonth(current.getMonth() + 1);
      break;
  }
  return current.toISOString().split('T')[0];
}
