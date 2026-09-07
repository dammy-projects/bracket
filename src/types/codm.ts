export type PlayerRole = 'main' | 'reserve';

export interface CodmPlayer {
  id: string;
  name: string;
  ign?: string; // In-Game Name / UID
  role: PlayerRole; // Exactly 4 Main, 1 Reserve per team
}

export interface CodmTeam {
  id: string;
  name: string;
  tag?: string; // e.g. "BSCJ", "BSIT"
  seed: number;
  logoUrl?: string;
  avatarColor?: string;
  avatarIcon?: string;
  players: CodmPlayer[]; // 5 players: 4 Main, 1 Reserve
}

export interface CodmMatchResult {
  teamId: string;
  placement: number; // 1 to 7/8
  kills: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
}

export interface CodmRound {
  roundNumber: number; // 1, 2, 3, 4
  name: string; // "Match 1", "Match 2", "Match 3", "Match 4"
  lobbyType: string; // "Online Custom Lobby"
  map: string; // "Isolated", "Blackout", "Krai", etc.
  status: 'scheduled' | 'live' | 'completed';
  results: Record<string, CodmMatchResult>; // key = teamId
}

export const CODM_PLACEMENT_POINTS: Record<number, number> = {
  1: 20,
  2: 15,
  3: 12,
  4: 10,
  5: 8,
  6: 6,
  7: 4,
  8: 2,
};

export interface CodmTournamentSettings {
  title: string;
  subtitle: string;
  gameMode: string;
  totalMatches: number;
  totalTeams: number;
  statusBadge: 'LIVE' | 'UPCOMING' | 'COMPLETED';
  logoUrl?: string;
  dateText: string;
  pointsPerKill: number;
  adminPasscode?: string;
}

export interface CodmTeamStanding {
  rank: number;
  team: CodmTeam;
  matchBreakdown: {
    [roundNumber: number]: CodmMatchResult | undefined;
  };
  totalKills: number;
  totalPlacementPoints: number;
  totalPoints: number;
  bestPlacement: number;
  firstPlaceCount: number;
}

export interface CodmTournamentData {
  settings: CodmTournamentSettings;
  teams: CodmTeam[];
  rounds: CodmRound[];
  activeRoundFilter: number | 'all';
}
