export type CinematicEventType =
  | 'WAR_DECLARATION'
  | 'NUCLEAR_LAUNCH'
  | 'COUP'
  | 'ECONOMIC_COLLAPSE'
  | 'PEACE_AGREEMENT';

export interface CinematicEvent {
  id: string; // Unique GUID/string to identify particular trigger
  type: CinematicEventType;
  duration: number; // in milliseconds
  data: {
    sourceCountry?: {
      id: string;
      name: string;
      flagEmoji: string;
    };
    targetCountry?: {
      id: string;
      name: string;
      flagEmoji: string;
    };
    leaderName?: string;
    oldLeaderName?: string;
    details?: string;
    countdown?: number;
  };
}
