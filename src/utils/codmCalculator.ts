import {
  CodmTeam,
  CodmRound,
  CodmTeamStanding,
  CODM_PLACEMENT_POINTS,
  CodmMatchResult,
} from '../types/codm';

export function calculateMatchPoints(
  placement: number,
  kills: number,
  pointsPerKill: number = 1
): { placementPoints: number; killPoints: number; totalPoints: number } {
  const placementPoints = CODM_PLACEMENT_POINTS[placement] || 0;
  const killPoints = Math.max(0, kills) * pointsPerKill;
  const totalPoints = placementPoints + killPoints;
  return { placementPoints, killPoints, totalPoints };
}

export function computeOverallStandings(
  teams: CodmTeam[],
  rounds: CodmRound[]
): CodmTeamStanding[] {
  const standings: CodmTeamStanding[] = teams.map((team) => {
    let totalKills = 0;
    let totalPlacementPoints = 0;
    let totalPoints = 0;
    let bestPlacement = 999;
    let firstPlaceCount = 0;
    const matchBreakdown: { [roundNumber: number]: CodmMatchResult | undefined } = {};

    rounds.forEach((round) => {
      const res = round.results[team.id];
      if (res && res.placement > 0) {
        matchBreakdown[round.roundNumber] = res;
        totalKills += res.kills || 0;
        totalPlacementPoints += res.placementPoints || 0;
        totalPoints += res.totalPoints || 0;
        if (res.placement < bestPlacement) {
          bestPlacement = res.placement;
        }
        if (res.placement === 1) {
          firstPlaceCount += 1;
        }
      }
    });

    return {
      rank: 1, // calculated after sorting
      team,
      matchBreakdown,
      totalKills,
      totalPlacementPoints,
      totalPoints,
      bestPlacement: bestPlacement === 999 ? 0 : bestPlacement,
      firstPlaceCount,
    };
  });

  // Sort standings:
  // 1. Total Points (descending)
  // 2. Total Kills (descending)
  // 3. First Place Count (descending)
  // 4. Best Placement (ascending, 1 is better than 2)
  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.totalKills !== a.totalKills) {
      return b.totalKills - a.totalKills;
    }
    if (b.firstPlaceCount !== a.firstPlaceCount) {
      return b.firstPlaceCount - a.firstPlaceCount;
    }
    if (a.bestPlacement !== b.bestPlacement && a.bestPlacement > 0 && b.bestPlacement > 0) {
      return a.bestPlacement - b.bestPlacement;
    }
    return a.team.seed - b.team.seed;
  });

  // Assign ranks
  return standings.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
