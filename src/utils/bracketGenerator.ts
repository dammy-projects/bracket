import { Participant, Match, Round, TournamentSettings } from '../types/tournament';

/**
 * Standard tournament seeding order calculation for single elimination brackets
 */
function getSeedingOrder(numTeams: number): number[] {
  let seeds = [1, 2];
  while (seeds.length < numTeams) {
    const nextSeeds: number[] = [];
    const targetSum = seeds.length * 2 + 1;
    for (const seed of seeds) {
      nextSeeds.push(seed);
      nextSeeds.push(targetSum - seed);
    }
    seeds = nextSeeds;
  }
  return seeds;
}

/**
 * Gets human readable round names based on total rounds count
 */
export function getRoundNames(totalRounds: number): Round[] {
  const rounds: Round[] = [];
  for (let i = 0; i < totalRounds; i++) {
    const roundFromEnd = totalRounds - 1 - i;
    let name = `Round ${i + 1}`;
    if (roundFromEnd === 0) {
      name = 'Finals';
    } else if (roundFromEnd === 1) {
      name = 'Semifinals';
    } else if (roundFromEnd === 2) {
      name = 'Quarterfinals';
    }
    rounds.push({ index: i, name });
  }
  return rounds;
}

/**
 * Generates all match tree structure and links nextMatchId / nextMatchSlot
 */
export function generateBracket(
  participants: Participant[],
  settings?: TournamentSettings
): Match[] {
  if (participants.length === 0) return [];

  // Determine standard bracket size (next power of 2, minimum 4)
  let bracketSize = 4;
  while (bracketSize < participants.length) {
    bracketSize *= 2;
  }

  // Map participants by seed
  const seededMap = new Map<number, Participant>();
  participants.forEach((p) => seededMap.set(p.seed, p));

  const totalRounds = Math.log2(bracketSize);
  const matches: Match[] = [];

  let matchCounter = 1;

  // We build rounds from Round 0 (First Round) up to Final Round
  const roundMatchCounts: number[] = [];
  for (let r = 0; r < totalRounds; r++) {
    roundMatchCounts.push(bracketSize / Math.pow(2, r + 1));
  }

  // Create empty match structures for all rounds first
  const roundMatchesMap = new Map<number, Match[]>();

  for (let r = 0; r < totalRounds; r++) {
    const count = roundMatchCounts[r];
    const roundFromEnd = totalRounds - 1 - r;

    // Determine Best-of rules per round
    let roundBestOf = 3; // Default Bo3
    if (roundFromEnd === 0) {
      roundBestOf = settings?.finalsBestOf || 7; // Finals: Bo7
    } else if (roundFromEnd === 1) {
      roundBestOf = settings?.semifinalsBestOf || 5; // Semifinals: Bo5
    } else if (roundFromEnd === 2) {
      roundBestOf = settings?.quarterfinalsBestOf || 3; // Quarterfinals: Bo3
    }

    const roundMatches: Match[] = [];
    for (let i = 0; i < count; i++) {
      const match: Match = {
        id: `m_${r}_${i}`,
        roundIndex: r,
        matchNumber: matchCounter++,
        participant1: null,
        participant2: null,
        score1: null,
        score2: null,
        winnerId: null,
        nextMatchId: null,
        nextMatchSlot: null,
        status: 'scheduled',
        bestOf: roundBestOf,
      };
      roundMatches.push(match);
      matches.push(match);
    }
    roundMatchesMap.set(r, roundMatches);
  }

  // Create 3rd Place Match ("Fighting for 3rd" - Best of 3)
  const hasThirdPlace = settings?.hasThirdPlaceMatch ?? true;
  let thirdPlaceMatch: Match | null = null;

  if (hasThirdPlace && totalRounds >= 2) {
    thirdPlaceMatch = {
      id: 'm_3rd_place',
      roundIndex: totalRounds - 1, // Same column level as Finals
      matchNumber: matchCounter++,
      participant1: null,
      participant2: null,
      score1: null,
      score2: null,
      winnerId: null,
      nextMatchId: null,
      nextMatchSlot: null,
      status: 'scheduled',
      isThirdPlaceMatch: true,
      bestOf: settings?.thirdPlaceBestOf || 3, // Fighting for 3rd: Bo3
    };
  }

  // Link nextMatchId and nextMatchSlot (and loserNextMatchId for Semifinals -> 3rd Place)
  for (let r = 0; r < totalRounds - 1; r++) {
    const currentRoundMatches = roundMatchesMap.get(r) || [];
    const nextRoundMatches = roundMatchesMap.get(r + 1) || [];
    const isSemifinals = totalRounds - 1 - r === 1;

    currentRoundMatches.forEach((m, idx) => {
      const nextMatchIdx = Math.floor(idx / 2);
      const slot = idx % 2 === 0 ? 'participant1' : 'participant2';
      m.nextMatchId = nextRoundMatches[nextMatchIdx].id;
      m.nextMatchSlot = slot;

      if (isSemifinals && thirdPlaceMatch) {
        m.loserNextMatchId = thirdPlaceMatch.id;
        m.loserNextMatchSlot = slot;
      }
    });
  }

  if (thirdPlaceMatch) {
    matches.push(thirdPlaceMatch);
  }

  // Populate Round 0 matches using standard seed ordering
  const seedOrder = getSeedingOrder(bracketSize);
  const r0Matches = roundMatchesMap.get(0) || [];

  for (let i = 0; i < r0Matches.length; i++) {
    const seed1 = seedOrder[i * 2];
    const seed2 = seedOrder[i * 2 + 1];

    const p1 = seededMap.get(seed1) || null;
    const p2 = seededMap.get(seed2) || null;

    const match = r0Matches[i];
    match.participant1 = p1;
    match.participant2 = p2;

    // Handle BYE automatically if one participant is missing
    if (p1 && !p2) {
      match.winnerId = p1.id;
      match.status = 'bye';
    } else if (!p1 && p2) {
      match.winnerId = p2.id;
      match.status = 'bye';
    }
  }

  // Propagate BYEs downstream initially
  propagateWinners(matches);

  return matches;
}

/**
 * Propagate existing match winners & losers to their target next matches
 */
export function propagateWinners(matches: Match[]): Match[] {
  const matchMap = new Map<string, Match>();
  matches.forEach((m) => matchMap.set(m.id, { ...m }));

  let updated = true;
  while (updated) {
    updated = false;
    for (const match of matchMap.values()) {
      if (match.winnerId) {
        const winner =
          match.participant1?.id === match.winnerId
            ? match.participant1
            : match.participant2?.id === match.winnerId
            ? match.participant2
            : null;

        const loser =
          match.participant1?.id === match.winnerId
            ? match.participant2
            : match.participant2?.id === match.winnerId
            ? match.participant1
            : null;

        // Advance Winner to next match
        if (match.nextMatchId && match.nextMatchSlot && winner) {
          const nextMatch = matchMap.get(match.nextMatchId);
          if (nextMatch) {
            const currentSlotParticipant = nextMatch[match.nextMatchSlot];
            if (currentSlotParticipant?.id !== winner.id) {
              nextMatch[match.nextMatchSlot] = winner;
              if (nextMatch.winnerId && nextMatch.winnerId !== winner.id) {
                nextMatch.winnerId = null;
                nextMatch.score1 = null;
                nextMatch.score2 = null;
                nextMatch.status = 'scheduled';
              }
              updated = true;
            }
          }
        }

        // Advance Loser to 3rd Place match
        if (match.loserNextMatchId && match.loserNextMatchSlot && loser) {
          const loserMatch = matchMap.get(match.loserNextMatchId);
          if (loserMatch) {
            const currentSlotParticipant = loserMatch[match.loserNextMatchSlot];
            if (currentSlotParticipant?.id !== loser.id) {
              loserMatch[match.loserNextMatchSlot] = loser;
              if (loserMatch.winnerId && loserMatch.winnerId !== loser.id) {
                loserMatch.winnerId = null;
                loserMatch.score1 = null;
                loserMatch.score2 = null;
                loserMatch.status = 'scheduled';
              }
              updated = true;
            }
          }
        }
      }
    }
  }

  return Array.from(matchMap.values());
}

/**
 * Update match winner and recalculate bracket progression
 */
export function setMatchWinner(
  matches: Match[],
  matchId: string,
  winnerId: string | null,
  score1: number | null = null,
  score2: number | null = null
): Match[] {
  const updatedMatches = matches.map((m) => {
    if (m.id === matchId) {
      return {
        ...m,
        winnerId,
        score1,
        score2,
        status: winnerId ? ('completed' as const) : ('scheduled' as const),
      };
    }
    return m;
  });

  return propagateWinners(updatedMatches);
}

/**
 * Get all match IDs along the path of a given participant
 */
export function getParticipantPath(matches: Match[], participantId: string): Set<string> {
  const path = new Set<string>();
  if (!participantId) return path;

  for (const match of matches) {
    if (
      match.participant1?.id === participantId ||
      match.participant2?.id === participantId
    ) {
      path.add(match.id);
    }
  }

  return path;
}
