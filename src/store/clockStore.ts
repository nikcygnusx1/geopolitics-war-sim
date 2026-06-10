import { create } from 'zustand';
import { produce } from 'immer';
import { GameClock, TickDuration, GameDurationMode, advanceCalendar } from '../utils/clock';

interface ClockActions {
  initClock: (startDate: string, durationMode: GameDurationMode, tickDuration: TickDuration, maxTicks?: number) => void;
  advanceTick: () => void;
  incrementSessionSecond: () => void;
  setTickDuration: (duration: TickDuration) => void;
  resetClock: () => void;
}

export const useClockStore = create<GameClock & ClockActions>((set, get) => ({
  tickDuration: 'WEEK',
  calendarStartDate: '2027-01-01',
  currentCalendarDate: '2027-01-01',
  currentTick: 0,
  sessionStartTimestamp: Date.now(),
  sessionElapsedSeconds: 0,
  durationMode: 'SCENARIO',
  timedDurationTicks: 100,
  scenarioDurationTicks: 0,

  initClock: (startDate, durationMode, tickDuration, maxTicks = 100) => set({
    calendarStartDate: startDate,
    currentCalendarDate: startDate,
    currentTick: 0,
    sessionStartTimestamp: Date.now(),
    sessionElapsedSeconds: 0,
    durationMode,
    tickDuration,
    timedDurationTicks: maxTicks,
  }),

  advanceTick: () => set(produce((draft: GameClock) => {
    draft.currentTick += 1;
    draft.currentCalendarDate = advanceCalendar(draft.currentCalendarDate, draft.tickDuration);
  })),

  incrementSessionSecond: () => set((state) => ({
    sessionElapsedSeconds: state.sessionElapsedSeconds + 1,
  })),

  setTickDuration: (duration) => set({ tickDuration: duration }),

  resetClock: () => set({
    tickDuration: 'WEEK',
    calendarStartDate: '2027-01-01',
    currentCalendarDate: '2027-01-01',
    currentTick: 0,
    sessionStartTimestamp: Date.now(),
    sessionElapsedSeconds: 0,
    durationMode: 'SCENARIO',
    timedDurationTicks: 100,
  }),
}));
export default useClockStore;
