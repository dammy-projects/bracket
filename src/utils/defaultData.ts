import { Participant, TournamentSettings } from '../types/tournament';

export const INITIAL_SETTINGS: TournamentSettings = {
  title: 'INTER-DEPARTMENT CHAMPIONSHIP',
  subtitle: 'Official Bracket & Live Results',
  logoUrl: '',
  bracketType: 'single_elimination',
  hasThirdPlaceMatch: true,
  quarterfinalsBestOf: 3,
  semifinalsBestOf: 5,
  finalsBestOf: 7,
  thirdPlaceBestOf: 3,
  statusBadge: 'LIVE',
};

// Preset logo icons and colors for team builder
export const PRESET_AVATARS = [
  { id: 'bull', label: 'Bulls', color: '#ef4444', icon: '🐂' },
  { id: 'python', label: 'Python', color: '#10b981', icon: '🐍' },
  { id: 'phoenix', label: 'Phoenix', color: '#f59e0b', icon: '🔥' },
  { id: 'shield', label: 'Shield', color: '#6366f1', icon: '🛡️' },
  { id: 'crown', label: 'Titans', color: '#8b5cf6', icon: '👑' },
  { id: 'hornet', label: 'Hornets', color: '#eab308', icon: '🐝' },
  { id: 'orca', label: 'Orca', color: '#a855f7', icon: '🐋' },
  { id: 'wolf', label: 'Wolves', color: '#64748b', icon: '🐺' },
  { id: 'dragon', label: 'Dragon', color: '#ec4899', icon: '🐉' },
  { id: 'eagle', label: 'Eagle', color: '#06b6d4', icon: '🦅' },
  { id: 'tiger', label: 'Tiger', color: '#f97316', icon: '🐅' },
  { id: 'lightning', label: 'Thunder', color: '#3b82f6', icon: '⚡' },
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'p1',
    name: 'Criminology Bulls',
    tag: 'BSCJ',
    seed: 1,
    avatarColor: '#ef4444',
    avatarIcon: '🐂',
  },
  {
    id: 'p2',
    name: 'Hospitality Titans',
    tag: 'BSHM',
    seed: 2,
    avatarColor: '#8b5cf6',
    avatarIcon: '👑',
  },
  {
    id: 'p3',
    name: 'Purple Orca',
    tag: 'BECED',
    seed: 3,
    avatarColor: '#a855f7',
    avatarIcon: '🐋',
  },
  {
    id: 'p4',
    name: 'Blazing Phoenix',
    tag: 'BEED',
    seed: 4,
    avatarColor: '#f59e0b',
    avatarIcon: '🔥',
  },
  {
    id: 'p5',
    name: 'Strength Resurgence',
    tag: 'BAP',
    seed: 5,
    avatarColor: '#6366f1',
    avatarIcon: '🛡️',
  },
  {
    id: 'p6',
    name: 'Silver Wolves',
    tag: 'BPA',
    seed: 6,
    avatarColor: '#64748b',
    avatarIcon: '🐺',
  },
  {
    id: 'p7',
    name: 'Apex Hornets',
    tag: 'BSEntrep',
    seed: 7,
    avatarColor: '#eab308',
    avatarIcon: '🐝',
  },
  {
    id: 'p8',
    name: 'Tech Python',
    tag: 'BSIT',
    seed: 8,
    avatarColor: '#10b981',
    avatarIcon: '🐍',
  },
];
