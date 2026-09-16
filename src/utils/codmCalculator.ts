import {
  CodmTeam,
  CodmRound,
  CodmTeamStanding,
  CODM_PLACEMENT_POINTS,
  CodmMatchResult,
  CodmTournamentSettings,
} from '../types/codm';

export function calculateMatchPoints(
  placement: number,
  kills: number,
  pointsPerKill: number = 1,
  placementPointsMap: Record<number, number> = CODM_PLACEMENT_POINTS,
  adjustmentPoints: number = 0
): { placementPoints: number; killPoints: number; totalPoints: number } {
  const placementPoints = placementPointsMap[placement] || 0;
  const killPoints = Math.max(0, kills) * pointsPerKill;
  const totalPoints = placementPoints + killPoints + adjustmentPoints;
  return { placementPoints, killPoints, totalPoints };
}

export function computeOverallStandings(
  teams: CodmTeam[],
  rounds: CodmRound[],
  settings?: Partial<CodmTournamentSettings>
): CodmTeamStanding[] {
  const pointsPerKill = settings?.pointsPerKill ?? 1;
  const placementPointsMap = settings?.placementPoints ?? CODM_PLACEMENT_POINTS;

  const standings: CodmTeamStanding[] = teams.map((team) => {
    let totalKills = 0;
    let totalPlacementPoints = 0;
    let totalKillPoints = 0;
    let totalPoints = 0;
    let bestPlacement = 999;
    let firstPlaceCount = 0;
    const matchBreakdown: { [roundNumber: number]: CodmMatchResult | undefined } = {};

    rounds.forEach((round) => {
      const res = round.results ? round.results[team.id] : undefined;
      const hasMatchData =
        res &&
        (res.placement > 0 ||
          (res.kills || 0) > 0 ||
          (res.adjustmentPoints || 0) !== 0 ||
          (res.totalPoints || 0) > 0);

      if (hasMatchData) {
        const { placementPoints, killPoints, totalPoints: matchTotal } = calculateMatchPoints(
          res.placement || 0,
          res.kills || 0,
          pointsPerKill,
          placementPointsMap,
          res.adjustmentPoints || 0
        );

        const calculatedResult: CodmMatchResult = {
          ...res,
          placementPoints,
          killPoints,
          totalPoints: matchTotal,
        };

        matchBreakdown[round.roundNumber] = calculatedResult;
        totalKills += res.kills || 0;
        totalPlacementPoints += placementPoints;
        totalKillPoints += killPoints;
        totalPoints += matchTotal;
        if (res.placement > 0 && res.placement < bestPlacement) {
          bestPlacement = res.placement;
        }
        if (res.placement === 1) {
          firstPlaceCount += 1;
        }
      }
    });

    const pointAdjustment = team.pointAdjustment || 0;
    totalPoints += pointAdjustment;

    return {
      rank: 1, // calculated after sorting
      team,
      matchBreakdown,
      totalKills,
      totalPlacementPoints,
      totalKillPoints,
      pointAdjustment,
      adjustmentReason: team.adjustmentReason,
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
