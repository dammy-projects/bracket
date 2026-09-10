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
  adminPasscode: 'admin123',
};

// Preset colors for team builder
export const PRESET_AVATARS = [
  { id: 'red', label: 'Crimson Red', color: '#ef4444', icon: '' },
  { id: 'emerald', label: 'Emerald Green', color: '#10b981', icon: '' },
  { id: 'amber', label: 'Amber Orange', color: '#f59e0b', icon: '' },
  { id: 'indigo', label: 'Indigo Blue', color: '#6366f1', icon: '' },
  { id: 'purple', label: 'Royal Purple', color: '#8b5cf6', icon: '' },
  { id: 'yellow', label: 'Cyber Yellow', color: '#eab308', icon: '' },
  { id: 'violet', label: 'Deep Violet', color: '#a855f7', icon: '' },
  { id: 'slate', label: 'Slate Gray', color: '#64748b', icon: '' },
  { id: 'pink', label: 'Neon Pink', color: '#ec4899', icon: '' },
  { id: 'cyan', label: 'Electric Cyan', color: '#06b6d4', icon: '' },
  { id: 'orange', label: 'Blaze Orange', color: '#f97316', icon: '' },
  { id: 'blue', label: 'Sky Blue', color: '#3b82f6', icon: '' },
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'p1',
    name: 'Criminology Bulls',
    tag: 'BSCJ',
    seed: 1,
    avatarColor: '#ef4444',
  },
  {
    id: 'p2',
    name: 'Hospitality Titans',
    tag: 'BSHM',
    seed: 2,
    avatarColor: '#8b5cf6',
  },
  {
    id: 'p3',
    name: 'Purple Orca',
    tag: 'BECED',
    seed: 3,
    avatarColor: '#a855f7',
  },
  {
    id: 'p4',
    name: 'Blazing Phoenix',
    tag: 'BEED',
    seed: 4,
    avatarColor: '#f59e0b',
  },
  {
    id: 'p5',
    name: 'Strength Resurgence',
    tag: 'BAP',
    seed: 5,
    avatarColor: '#6366f1',
  },
  {
    id: 'p6',
    name: 'Silver Wolves',
    tag: 'BPA',
    seed: 6,
    avatarColor: '#64748b',
  },
  {
    id: 'p7',
    name: 'Apex Hornets',
    tag: 'BSEntrep',
    seed: 7,
    avatarColor: '#eab308',
  },
  {
    id: 'p8',
    name: 'Tech Python',
    tag: 'BSIT',
    seed: 8,
    avatarColor: '#10b981',
  },
];
