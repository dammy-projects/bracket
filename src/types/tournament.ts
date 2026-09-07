export interface Participant {
  id: string;
  name: string;
  tag?: string; // e.g. "BSCJ", "BSIT", "BEED"
  seed: number;
  logoUrl?: string; // base64 or image URL
  avatarColor?: string;
  avatarIcon?: string;
}

export interface Match {
  id: string;
  roundIndex: number;
  matchNumber: number;
  participant1: Participant | null;
  participant2: Participant | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: 'participant1' | 'participant2' | null;
  loserNextMatchId?: string | null;
  loserNextMatchSlot?: 'participant1' | 'participant2' | null;
  status: 'scheduled' | 'live' | 'completed' | 'bye';
  isThirdPlaceMatch?: boolean;
  bestOf: number; // 3, 5, 7
}

export interface Round {
  index: number;
  name: string;
}

export interface TournamentSettings {
  title: string;
  subtitle: string;
  logoUrl: string;
  bracketType: 'single_elimination';
  hasThirdPlaceMatch: boolean;
  quarterfinalsBestOf: number; // default 3
  semifinalsBestOf: number; // default 5
  finalsBestOf: number; // default 7
  thirdPlaceBestOf: number; // default 3
  statusBadge: 'LIVE' | 'UPCOMING' | 'COMPLETED';
}

export interface Tournament {
  id: string;
  settings: TournamentSettings;
  participants: Participant[];
  matches: Match[];
  activeRoundIndex: number | 'all';
  highlightedParticipantId: string | null;
}
