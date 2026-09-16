import React, { useState, useEffect, useMemo } from 'react';
import {
  CodmTeam,
  CodmRound,
  CodmTournamentSettings,
  CodmMatchResult,
  CODM_PLACEMENT_POINTS,
} from '../../types/codm';
import { calculateMatchPoints, computeOverallStandings } from '../../utils/codmCalculator';
import { TeamBadge } from '../common/TeamBadge';
import { CODM_MAPS } from '../../utils/codmDefaultData';
import {
  X,
  Save,
  Calculator,
  Sliders,
  Award,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Info,
  Flame,
  ShieldAlert,
  Sparkles,
  Dices,
  MapPin,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

interface CodmPointsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: CodmTeam[];
  rounds: CodmRound[];
  settings: CodmTournamentSettings;
  initialRoundNumber?: number | null;
  onSaveAll: (
    updatedTeams: CodmTeam[],
    updatedRounds: CodmRound[],
    updatedSettings: CodmTournamentSettings
  ) => void;
}

type TabType = 'matrix' | 'r1' | 'r2' | 'r3' | 'r4' | 'adjustments' | 'rules';

export const CodmPointsManagerModal: React.FC<CodmPointsManagerModalProps> = ({
  isOpen,
  onClose,
  teams,
  rounds,
  settings,
  initialRoundNumber,
  onSaveAll,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (initialRoundNumber === 1) return 'r1';
    if (initialRoundNumber === 2) return 'r2';
    if (initialRoundNumber === 3) return 'r3';
    if (initialRoundNumber === 4) return 'r4';
    return 'matrix';
  });

  // Local state for teams (including pointAdjustment & adjustmentReason)
  const [localTeams, setLocalTeams] = useState<CodmTeam[]>(teams);

  // Local state for rounds (guaranteeing 4 rounds)
  const [localRounds, setLocalRounds] = useState<CodmRound[]>(() => {
    if (rounds.length >= 4) return rounds.slice(0, 4);
    const guaranteed: CodmRound[] = [1, 2, 3, 4].map((rNum) => {
      const found = rounds.find((r) => r.roundNumber === rNum);
      if (found) return found;
      return {
        roundNumber: rNum,
        name: `Match ${rNum}`,
        lobbyType: 'Online Custom Lobby',
        map: rNum % 2 === 1 ? 'Isolated' : 'Blackout',
        status: 'scheduled',
        results: {},
      };
    });
    return guaranteed;
  });

  // Local state for scoring rules
  const [pointsPerKill, setPointsPerKill] = useState<number>(settings.pointsPerKill || 1);
  const [placementPoints, setPlacementPoints] = useState<Record<number, number>>(() => {
    return settings.placementPoints && Object.keys(settings.placementPoints).length > 0
      ? { ...settings.placementPoints }
      : { ...CODM_PLACEMENT_POINTS };
  });

  // Adjustments Form State
  const [adjTeamId, setAdjTeamId] = useState<string>(teams[0]?.id || '');
  const [adjType, setAdjType] = useState<'penalty' | 'bonus'>('penalty');
  const [adjValue, setAdjValue] = useState<number>(2);
  const [adjReason, setAdjReason] = useState<string>('');

  // Map rolling animation state
  const [isRollingMap, setIsRollingMap] = useState<number | null>(null);

  // Sync state whenever modal opens or props update
  useEffect(() => {
    setLocalTeams(teams);
    if (rounds.length >= 4) {
      setLocalRounds(rounds.slice(0, 4));
    } else {
      const guaranteed: CodmRound[] = [1, 2, 3, 4].map((rNum) => {
        const found = rounds.find((r) => r.roundNumber === rNum);
        return (
          found || {
            roundNumber: rNum,
            name: `Match ${rNum}`,
            lobbyType: 'Online Custom Lobby',
            map: rNum % 2 === 1 ? 'Isolated' : 'Blackout',
            status: 'scheduled',
            results: {},
          }
        );
      });
      setLocalRounds(guaranteed);
    }

    setPointsPerKill(settings.pointsPerKill || 1);
    setPlacementPoints(
      settings.placementPoints && Object.keys(settings.placementPoints).length > 0
        ? { ...settings.placementPoints }
        : { ...CODM_PLACEMENT_POINTS }
    );
    if (teams.length > 0 && !teams.some((t) => t.id === adjTeamId)) {
      setAdjTeamId(teams[0].id);
    }
    if (initialRoundNumber === 1) setActiveTab('r1');
    else if (initialRoundNumber === 2) setActiveTab('r2');
    else if (initialRoundNumber === 3) setActiveTab('r3');
    else if (initialRoundNumber === 4) setActiveTab('r4');
  }, [teams, rounds, settings, isOpen, initialRoundNumber]);

  // Recalculate standings dynamically using local data and current rules
  const calculatedStandings = useMemo(() => {
    const tempSettings: CodmTournamentSettings = {
      ...settings,
      pointsPerKill,
      placementPoints,
    };
    return computeOverallStandings(localTeams, localRounds, tempSettings);
  }, [localTeams, localRounds, pointsPerKill, placementPoints, settings]);

  // Active round if a single round tab is chosen
  const activeSingleRoundNum =
    activeTab === 'r1' ? 1 : activeTab === 'r2' ? 2 : activeTab === 'r3' ? 3 : activeTab === 'r4' ? 4 : null;

  const currentSingleRound = activeSingleRoundNum
    ? localRounds.find((r) => r.roundNumber === activeSingleRoundNum)
    : null;

  // Check duplicate placements in the active single round
  const currentRoundPlacementCounts: Record<number, number> = {};
  if (currentSingleRound?.results) {
    Object.values(currentSingleRound.results).forEach((r) => {
      if (r && r.placement > 0) {
        currentRoundPlacementCounts[r.placement] = (currentRoundPlacementCounts[r.placement] || 0) + 1;
      }
    });
  }
  const currentRoundHasDuplicatePlacements = Object.values(currentRoundPlacementCounts).some((c) => c > 1);

  // Computed sorted teams with live placement based on round points
  const activeRoundTeamsWithRank = useMemo(() => {
    if (!currentSingleRound) return [];
    return [...localTeams]
      .map((team) => {
        const res = currentSingleRound.results ? currentSingleRound.results[team.id] : undefined;
        const sPlacement = res?.placement || 0;
        const sKills = res?.kills || 0;
        const sAdj = res?.adjustmentPoints || 0;
        const { placementPoints: pPts, killPoints: kPts, totalPoints: tPts } =
          calculateMatchPoints(sPlacement, sKills, pointsPerKill, placementPoints, sAdj);
        return {
          team,
          res,
          sPlacement,
          sKills,
          sAdj,
          pPts,
          kPts,
          tPts,
        };
      })
      .sort((a, b) => {
        if (b.tPts !== a.tPts) return b.tPts - a.tPts;
        if (b.sKills !== a.sKills) return b.sKills - a.sKills;
        if (a.sPlacement > 0 && b.sPlacement > 0) return a.sPlacement - b.sPlacement;
        if (a.sPlacement > 0) return -1;
        if (b.sPlacement > 0) return 1;
        return a.team.seed - b.team.seed;
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }, [localTeams, currentSingleRound, pointsPerKill, placementPoints]);

  // --- Handlers for Round Editing ---
  const handleUpdateMatchScore = (
    roundNumber: number,
    teamId: string,
    field: 'placement' | 'kills',
    value: number
  ) => {
    setLocalRounds((prevRounds) =>
      prevRounds.map((r) => {
        if (r.roundNumber !== roundNumber) return r;

        const currentResult = (r.results && r.results[teamId]) || {
          teamId,
          placement: 0,
          kills: 0,
          placementPoints: 0,
          killPoints: 0,
          totalPoints: 0,
        };

        const newPlacement = field === 'placement' ? value : currentResult.placement;
        const newKills = field === 'kills' ? Math.max(0, value) : currentResult.kills;

        const { placementPoints: pPts, killPoints: kPts, totalPoints: tPts } = calculateMatchPoints(
          newPlacement,
          newKills,
          pointsPerKill,
          placementPoints,
          currentResult.adjustmentPoints || 0
        );

        return {
          ...r,
          results: {
            ...(r.results || {}),
            [teamId]: {
              ...currentResult,
              placement: newPlacement,
              kills: newKills,
              placementPoints: pPts,
              killPoints: kPts,
              totalPoints: tPts,
            },
          },
        };
      })
    );
  };

  const handleUpdateRoundMeta = (
    roundNumber: number,
    field: 'map' | 'status',
    value: string
  ) => {
    setLocalRounds((prev) =>
      prev.map((r) => (r.roundNumber === roundNumber ? { ...r, [field]: value } : r))
    );
  };

  const handleRandomizeMap = (roundNumber: number) => {
    setIsRollingMap(roundNumber);
    let counter = 0;
    const interval = setInterval(() => {
      const randomMap = CODM_MAPS[Math.floor(Math.random() * CODM_MAPS.length)];
      handleUpdateRoundMeta(roundNumber, 'map', randomMap);
      counter++;
      if (counter > 7) {
        clearInterval(interval);
        setIsRollingMap(null);
      }
    }, 80);
  };

  const handleAutoAssignPlacementsByPoints = (roundNumber: number) => {
    setLocalRounds((prev) =>
      prev.map((r) => {
        if (r.roundNumber !== roundNumber) return r;
        const updatedResults: Record<string, CodmMatchResult> = { ...(r.results || {}) };

        // Sort teams by kills descending, then seed
        const sortedTeams = [...localTeams].sort((a, b) => {
          const aRes = updatedResults[a.id];
          const bRes = updatedResults[b.id];
          const aKills = aRes?.kills || 0;
          const bKills = bRes?.kills || 0;
          if (bKills !== aKills) return bKills - aKills;
          return a.seed - b.seed;
        });

        sortedTeams.forEach((team, idx) => {
          const placement = idx + 1;
          const currentRes = updatedResults[team.id] || { teamId: team.id, placement: 0, kills: 0 };
          const { placementPoints: pPts, killPoints: kPts, totalPoints: tPts } = calculateMatchPoints(
            placement,
            currentRes.kills || 0,
            pointsPerKill,
            placementPoints,
            currentRes.adjustmentPoints || 0
          );
          updatedResults[team.id] = {
            ...currentRes,
            teamId: team.id,
            placement,
            kills: currentRes.kills || 0,
            placementPoints: pPts,
            killPoints: kPts,
            totalPoints: tPts,
          };
        });

        return {
          ...r,
          status: 'completed',
          results: updatedResults,
        };
      })
    );
  };

  const handleAutoAssignPlacements = (roundNumber: number) => {
    setLocalRounds((prev) =>
      prev.map((r) => {
        if (r.roundNumber !== roundNumber) return r;
        const updatedResults: Record<string, CodmMatchResult> = { ...r.results };
        localTeams.forEach((team, idx) => {
          const placement = idx + 1;
          const currentRes = updatedResults[team.id] || { placement: 0, kills: 0 };
          const { placementPoints: pPts, killPoints: kPts, totalPoints: tPts } = calculateMatchPoints(
            placement,
            currentRes.kills,
            pointsPerKill,
            placementPoints,
            currentRes.adjustmentPoints || 0
          );
          updatedResults[team.id] = {
            teamId: team.id,
            placement,
            kills: currentRes.kills,
            placementPoints: pPts,
            killPoints: kPts,
            totalPoints: tPts,
          };
        });
        return {
          ...r,
          status: 'completed',
          results: updatedResults,
        };
      })
    );
  };

  const handleClearRoundScores = (roundNumber: number) => {
    if (window.confirm(`Are you sure you want to reset all team scores for Round ${roundNumber}?`)) {
      setLocalRounds((prevRounds) =>
        prevRounds.map((r) => {
          if (r.roundNumber !== roundNumber) return r;
          const clearedResults: Record<string, CodmMatchResult> = {};
          localTeams.forEach((t) => {
            clearedResults[t.id] = {
              teamId: t.id,
              placement: 0,
              kills: 0,
              placementPoints: 0,
              killPoints: 0,
              totalPoints: 0,
            };
          });
          return {
            ...r,
            status: 'scheduled',
            results: clearedResults,
          };
        })
      );
    }
  };

  // --- Handlers for Adjustments Tab ---
  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjTeamId) return;

    const delta = adjType === 'penalty' ? -Math.abs(adjValue) : Math.abs(adjValue);
    const reasonText = adjReason.trim();

    setLocalTeams((prevTeams) =>
      prevTeams.map((t) => {
        if (t.id !== adjTeamId) return t;
        return {
          ...t,
          pointAdjustment: delta,
          adjustmentReason: reasonText || (adjType === 'penalty' ? 'Manual Penalty' : 'Manual Bonus'),
        };
      })
    );

    setAdjReason('');
  };

  const handleQuickAdjustPoints = (teamId: string, delta: number) => {
    setLocalTeams((prevTeams) =>
      prevTeams.map((t) => {
        if (t.id !== teamId) return t;
        const current = t.pointAdjustment || 0;
        const updated = current + delta;
        return {
          ...t,
          pointAdjustment: updated,
          adjustmentReason:
            updated === 0
              ? undefined
              : t.adjustmentReason || (updated < 0 ? 'Point Deduction' : 'Point Bonus'),
        };
      })
    );
  };

  const handleRemoveAdjustment = (teamId: string) => {
    setLocalTeams((prevTeams) =>
      prevTeams.map((t) =>
        t.id === teamId ? { ...t, pointAdjustment: 0, adjustmentReason: undefined } : t
      )
    );
  };

  // --- Handlers for Scoring Rules Tab ---
  const handleUpdatePlacementPoint = (rank: number, pts: number) => {
    setPlacementPoints((prev) => ({
      ...prev,
      [rank]: Math.max(0, pts),
    }));
  };

  const applyPreset = (presetName: 'official' | 'aggressive' | 'survival' | 'linear') => {
    if (presetName === 'official') {
      setPointsPerKill(1);
      setPlacementPoints({ 1: 20, 2: 15, 3: 12, 4: 10, 5: 8, 6: 6, 7: 4, 8: 2 });
    } else if (presetName === 'aggressive') {
      setPointsPerKill(2);
      setPlacementPoints({ 1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1 });
    } else if (presetName === 'survival') {
      setPointsPerKill(1);
      setPlacementPoints({ 1: 25, 2: 18, 3: 14, 4: 10, 5: 7, 6: 5, 7: 3, 8: 1 });
    } else if (presetName === 'linear') {
      setPointsPerKill(1);
      setPlacementPoints({ 1: 10, 2: 8, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 });
    }
  };

  // --- Save All Changes ---
  const handleSaveAllChanges = () => {
    const updatedRounds = localRounds.map((round) => {
      const updatedResults: Record<string, CodmMatchResult> = {};
      localTeams.forEach((team) => {
        const res = (round.results && round.results[team.id]) || {
          teamId: team.id,
          placement: 0,
          kills: 0,
          placementPoints: 0,
          killPoints: 0,
          totalPoints: 0,
        };
        const { placementPoints: pPts, killPoints: kPts, totalPoints: tPts } = calculateMatchPoints(
          res.placement,
          res.kills,
          pointsPerKill,
          placementPoints,
          res.adjustmentPoints || 0
        );
        updatedResults[team.id] = {
          ...res,
          placementPoints: pPts,
          killPoints: kPts,
          totalPoints: tPts,
        };
      });
      return {
        ...round,
        results: updatedResults,
      };
    });

    const updatedSettings: CodmTournamentSettings = {
      ...settings,
      pointsPerKill,
      placementPoints,
      totalMatches: 4,
    };

    onSaveAll(localTeams, updatedRounds, updatedSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card codm-points-manager-modal"
        style={{
          maxWidth: '1100px',
          width: '96vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
              }}
            >
              <Calculator size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  Manage Points: 4 Rounds Tournament
                </h3>
                <span
                  style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    letterSpacing: '0.5px',
                  }}
                >
                  4 ROUNDS
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                Manage team placements, kills, and points for each of the 4 matches, or update all 4 rounds simultaneously in the master matrix
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation: All 4 Rounds + Individual Rounds 1-4 + Penalties + Rules */}
        <div
          style={{
            padding: '12px 24px 0',
            background: 'rgba(15, 18, 25, 0.7)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className={`tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <Award size={15} />
            <span>4-Round Master Matrix</span>
          </button>

          {[1, 2, 3, 4].map((rNum) => {
            const tabKey = `r${rNum}` as TabType;
            const rData = localRounds.find((r) => r.roundNumber === rNum);
            const hasScores = rData && Object.values(rData.results || {}).some((res) => res && res.placement > 0);

            return (
              <button
                key={rNum}
                type="button"
                className={`tab-btn ${activeTab === tabKey ? 'active' : ''}`}
                onClick={() => setActiveTab(tabKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                }}
              >
                <Target size={14} />
                <span>Round {rNum}</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: hasScores ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: hasScores ? '#34d399' : '#9ca3af',
                  }}
                >
                  {hasScores ? 'Scored' : 'M' + rNum}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className={`tab-btn ${activeTab === 'adjustments' ? 'active' : ''}`}
            onClick={() => setActiveTab('adjustments')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <ShieldAlert size={15} />
            <span>Penalties & Bonuses</span>
            {localTeams.some((t) => (t.pointAdjustment || 0) !== 0) && (
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                {localTeams.filter((t) => (t.pointAdjustment || 0) !== 0).length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <Sliders size={15} />
            <span>Scoring Rules</span>
          </button>
        </div>

        {/* Modal Body with Tab Views */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {/* ========================================================
              TAB: 4-ROUND MASTER MATRIX VIEW (ALL 4 ROUNDS)
              ======================================================== */}
          {activeTab === 'matrix' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#93c5fd' }}>
                  <Info size={18} />
                  <span>
                    Master 4-Round Spreadsheet: Edit placement and kills for any match. Points and overall standings update in real-time.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4].map((rNum) => (
                    <button
                      key={rNum}
                      type="button"
                      className="icon-btn"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      title={`Go to detailed Round ${rNum} score editor`}
                      onClick={() => setActiveTab(`r${rNum}` as TabType)}
                    >
                      <Target size={12} />
                      <span>Edit Round {rNum}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Matrix Table */}
              <div className="codm-matrix-table-wrap" style={{ overflowX: 'auto' }}>
                <table className="codm-matrix-table">
                  <thead>
                    <tr>
                      <th style={{ width: '65px', textAlign: 'center' }}>Placement</th>
                      <th style={{ minWidth: '180px' }}>Team</th>
                      {[1, 2, 3, 4].map((rNum) => {
                        const r = localRounds.find((item) => item.roundNumber === rNum) || {
                          roundNumber: rNum,
                          name: `Match ${rNum}`,
                          map: 'Isolated',
                        };
                        return (
                          <th key={rNum} style={{ minWidth: '160px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, color: '#f3f4f6' }}>Round {rNum} ({r.name})</div>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 400 }}>
                              {r.map}
                            </div>
                          </th>
                        );
                      })}
                      <th style={{ width: '85px', textAlign: 'center' }}>Adj (±)</th>
                      <th style={{ width: '85px', textAlign: 'center' }}>Kills</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Total Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedStandings.map((standing) => {
                      const team = standing.team;
                      const hasAdj = (team.pointAdjustment || 0) !== 0;

                      return (
                        <tr key={team.id} className="matrix-row">
                          {/* Live Placement / Rank */}
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                color:
                                  standing.rank === 1
                                    ? '#f59e0b'
                                    : standing.rank === 2
                                    ? '#cbd5e1'
                                    : standing.rank === 3
                                    ? '#d97706'
                                    : '#9ca3af',
                              }}
                            >
                              {standing.rank === 1 ? '🥇 1st' : standing.rank === 2 ? '🥈 2nd' : standing.rank === 3 ? '🥉 3rd' : `${standing.rank}th`}
                            </span>
                          </td>

                          {/* Team Info */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TeamBadge
                                logoUrl={team.logoUrl}
                                name={team.name}
                                tag={team.tag}
                                color={team.avatarColor}
                                size={26}
                              />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f3f4f6' }}>
                                  {team.name}
                                </div>
                                {team.tag && (
                                  <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                                    {team.tag}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 4 Rounds Columns */}
                          {[1, 2, 3, 4].map((rNum) => {
                            const r = localRounds.find((item) => item.roundNumber === rNum);
                            const res = r?.results ? r.results[team.id] : undefined;
                            const mPlacement = res?.placement || 0;
                            const mKills = res?.kills || 0;
                            const mAdj = res?.adjustmentPoints || 0;
                            const { placementPoints: pPts, killPoints: kPts, totalPoints: mTotal } =
                              calculateMatchPoints(
                                mPlacement,
                                mKills,
                                pointsPerKill,
                                placementPoints,
                                mAdj
                              );

                            return (
                              <td key={rNum} style={{ padding: '6px 8px' }}>
                                <div className="matrix-cell-content">
                                  {/* Placement Selector */}
                                  <select
                                    className="matrix-select"
                                    value={mPlacement}
                                    onChange={(e) =>
                                      handleUpdateMatchScore(
                                        rNum,
                                        team.id,
                                        'placement',
                                        parseInt(e.target.value, 10)
                                      )
                                    }
                                  >
                                    <option value="0">-</option>
                                    <option value="1">1st ({placementPoints[1] || 20}p)</option>
                                    <option value="2">2nd ({placementPoints[2] || 15}p)</option>
                                    <option value="3">3rd ({placementPoints[3] || 12}p)</option>
                                    <option value="4">4th ({placementPoints[4] || 10}p)</option>
                                    <option value="5">5th ({placementPoints[5] || 8}p)</option>
                                    <option value="6">6th ({placementPoints[6] || 6}p)</option>
                                    <option value="7">7th ({placementPoints[7] || 4}p)</option>
                                    <option value="8">8th ({placementPoints[8] || 2}p)</option>
                                  </select>

                                  {/* Kills Input */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <input
                                      type="number"
                                      min="0"
                                      className="matrix-kills-input"
                                      placeholder="0"
                                      value={mKills === 0 && mPlacement === 0 ? '' : mKills}
                                      onChange={(e) =>
                                        handleUpdateMatchScore(
                                          rNum,
                                          team.id,
                                          'kills',
                                          parseInt(e.target.value, 10) || 0
                                        )
                                      }
                                      title="Kills"
                                    />
                                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>k</span>
                                  </div>

                                  {/* Calculated Match Subtotal Tag */}
                                  <span
                                    className="matrix-pts-badge"
                                    style={{
                                      background: mPlacement > 0 ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                      color: mPlacement > 0 ? '#93c5fd' : '#4b5563',
                                    }}
                                  >
                                    {mTotal}p
                                  </span>
                                </div>
                              </td>
                            );
                          })}

                          {/* Adjustment Column */}
                          <td style={{ textAlign: 'center' }}>
                            {hasAdj ? (
                              <span
                                className={`pts-tag ${
                                  (team.pointAdjustment || 0) > 0 ? 'bonus-tag' : 'penalty-tag'
                                }`}
                                title={team.adjustmentReason || 'Point adjustment'}
                              >
                                {(team.pointAdjustment || 0) > 0
                                  ? `+${team.pointAdjustment}`
                                  : team.pointAdjustment}
                              </span>
                            ) : (
                              <span style={{ color: '#4b5563', fontSize: '0.8rem' }}>0</span>
                            )}
                          </td>

                          {/* Total Kills */}
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fb923c' }}>
                              {standing.totalKills}
                            </span>
                          </td>

                          {/* Grand Total Points */}
                          <td style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                color: '#f59e0b',
                                background: 'rgba(245, 158, 11, 0.12)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                              }}
                            >
                              {standing.totalPoints} PTS
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TABS: INDIVIDUAL ROUND VIEW (ROUND 1, 2, 3, or 4)
              ======================================================== */}
          {activeSingleRoundNum && currentSingleRound && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Round Meta Bar */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Target size={18} color="#f59e0b" />
                      Round {activeSingleRoundNum}: {currentSingleRound.name} Points
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      Online Custom Lobby • {localTeams.length} Teams Battle Royale
                    </span>
                  </div>

                  {/* Map Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Map:</label>
                    <select
                      className="form-input"
                      style={{ width: '130px', padding: '4px 8px', fontSize: '0.82rem' }}
                      value={currentSingleRound.map}
                      onChange={(e) =>
                        handleUpdateRoundMeta(activeSingleRoundNum, 'map', e.target.value)
                      }
                    >
                      {CODM_MAPS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      title="Randomize Map per tournament rules"
                      disabled={isRollingMap === activeSingleRoundNum}
                      onClick={() => handleRandomizeMap(activeSingleRoundNum)}
                    >
                      <Dices
                        size={14}
                        className={isRollingMap === activeSingleRoundNum ? 'animate-spin' : ''}
                      />
                      <span>{isRollingMap === activeSingleRoundNum ? 'Rolling...' : 'Roll Map'}</span>
                    </button>
                  </div>

                  {/* Status Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Status:</label>
                    <select
                      className="form-input"
                      style={{ width: '130px', padding: '4px 8px', fontSize: '0.82rem' }}
                      value={currentSingleRound.status}
                      onChange={(e) =>
                        handleUpdateRoundMeta(activeSingleRoundNum, 'status', e.target.value)
                      }
                    >
                      <option value="scheduled">⏳ Scheduled</option>
                      <option value="live">🔴 Live in Progress</option>
                      <option value="completed">✓ Completed</option>
                    </select>
                  </div>
                </div>

                {/* Quick actions for this round */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="icon-btn primary"
                    style={{ fontSize: '0.78rem', padding: '5px 10px', gap: '4px' }}
                    onClick={() => handleAutoAssignPlacementsByPoints(activeSingleRoundNum)}
                    title="Automatically assign in-game placements (1st to 8th) based on kills & points"
                  >
                    <Zap size={13} color="#ffffff" />
                    <span>Auto-Rank Placements by Points</span>
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                    onClick={() => handleAutoAssignPlacements(activeSingleRoundNum)}
                    title="Quickly assign 1st through 8th place by current seed order"
                  >
                    <span>Auto 1st-8th Fill (Seed)</span>
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                    onClick={() => handleClearRoundScores(activeSingleRoundNum)}
                  >
                    <RefreshCw size={13} />
                    <span>Reset Round {activeSingleRoundNum}</span>
                  </button>
                </div>
              </div>

              {/* Warning for Duplicate Placements */}
              {currentRoundHasDuplicatePlacements && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#fca5a5',
                    fontSize: '0.85rem',
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>Notice: Two or more teams have the same in-game placement in Round {activeSingleRoundNum}!</span>
                </div>
              )}

              {/* Single Round Points Table */}
              <div className="codm-score-table-wrap">
                <table className="codm-score-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Placement</th>
                      <th style={{ width: '220px' }}>Team</th>
                      <th style={{ width: '180px' }}>In-Game Place</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Placement Pts</th>
                      <th style={{ width: '170px', textAlign: 'center' }}>Kills (+{pointsPerKill} pt/kill)</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Round {activeSingleRoundNum} Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRoundTeamsWithRank.map(({ team, sPlacement, sKills, pPts, kPts, tPts, rank }) => {
                      const isDupe =
                        sPlacement > 0 &&
                        (currentRoundPlacementCounts[sPlacement] || 0) > 1;

                      return (
                        <tr key={team.id} className={isDupe ? 'row-duplicate-placement' : ''}>
                          {/* Live Round Placement based on points */}
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                color:
                                  rank === 1
                                    ? '#f59e0b'
                                    : rank === 2
                                    ? '#cbd5e1'
                                    : rank === 3
                                    ? '#d97706'
                                    : '#9ca3af',
                              }}
                            >
                              {rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : rank === 3 ? '🥉 3rd' : `${rank}th`}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TeamBadge
                                logoUrl={team.logoUrl}
                                name={team.name}
                                tag={team.tag}
                                color={team.avatarColor}
                                size={28}
                              />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{team.name}</div>
                                {team.tag && (
                                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                    {team.tag}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* In-Game Placement Dropdown */}
                          <td>
                            <select
                              className={`form-input ${isDupe ? 'input-error' : ''}`}
                              value={sPlacement}
                              onChange={(e) =>
                                handleUpdateMatchScore(
                                  activeSingleRoundNum,
                                  team.id,
                                  'placement',
                                  parseInt(e.target.value, 10)
                                )
                              }
                            >
                              <option value="0">-- Not Placed --</option>
                              <option value="1">🥇 1st Place ({placementPoints[1] || 20} pts)</option>
                              <option value="2">🥈 2nd Place ({placementPoints[2] || 15} pts)</option>
                              <option value="3">🥉 3rd Place ({placementPoints[3] || 12} pts)</option>
                              <option value="4">4th Place ({placementPoints[4] || 10} pts)</option>
                              <option value="5">5th Place ({placementPoints[5] || 8} pts)</option>
                              <option value="6">6th Place ({placementPoints[6] || 6} pts)</option>
                              <option value="7">7th Place ({placementPoints[7] || 4} pts)</option>
                              <option value="8">8th Place ({placementPoints[8] || 2} pts)</option>
                            </select>
                          </td>

                          {/* Placement Points Preview */}
                          <td style={{ textAlign: 'center' }}>
                            <span className="pts-tag placement-tag">
                              +{pPts} pts
                            </span>
                          </td>

                          {/* Kills Input with Stepper */}
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() =>
                                  handleUpdateMatchScore(
                                    activeSingleRoundNum,
                                    team.id,
                                    'kills',
                                    Math.max(0, sKills - 1)
                                  )
                                }
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                className="form-input"
                                style={{ width: '56px', textAlign: 'center', fontWeight: 700 }}
                                value={sKills}
                                onChange={(e) =>
                                  handleUpdateMatchScore(
                                    activeSingleRoundNum,
                                    team.id,
                                    'kills',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                              />
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() =>
                                  handleUpdateMatchScore(
                                    activeSingleRoundNum,
                                    team.id,
                                    'kills',
                                    sKills + 1
                                  )
                                }
                              >
                                +
                              </button>
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '4px' }}>
                                = {kPts}p
                              </span>
                            </div>
                          </td>

                          {/* Round Total Points */}
                          <td style={{ textAlign: 'right' }}>
                            <span className="pts-tag total-tag">
                              {tPts} pts
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: TEAM PENALTIES & BONUS ADJUSTMENTS
              ======================================================== */}
          {activeTab === 'adjustments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Add Adjustment Form */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <ShieldAlert size={18} color="#f59e0b" />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
                    Assign Team Point Penalty or Bonus
                  </h4>
                </div>

                <form onSubmit={handleApplyAdjustment}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '14px',
                      alignItems: 'flex-end',
                    }}
                  >
                    <div>
                      <label className="form-label" style={{ marginBottom: '6px' }}>
                        Select Team
                      </label>
                      <select
                        className="form-input"
                        value={adjTeamId}
                        onChange={(e) => setAdjTeamId(e.target.value)}
                      >
                        {localTeams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} {t.tag ? `(${t.tag})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ marginBottom: '6px' }}>
                        Adjustment Type
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className={`mode-toggle-btn ${adjType === 'penalty' ? 'active' : ''}`}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: adjType === 'penalty' ? 'rgba(239, 68, 68, 0.25)' : undefined,
                            borderColor: adjType === 'penalty' ? '#ef4444' : undefined,
                            color: adjType === 'penalty' ? '#fca5a5' : undefined,
                          }}
                          onClick={() => setAdjType('penalty')}
                        >
                          <Minus size={14} /> Penalty (-)
                        </button>
                        <button
                          type="button"
                          className={`mode-toggle-btn ${adjType === 'bonus' ? 'active' : ''}`}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: adjType === 'bonus' ? 'rgba(16, 185, 129, 0.25)' : undefined,
                            borderColor: adjType === 'bonus' ? '#10b981' : undefined,
                            color: adjType === 'bonus' ? '#6ee7b7' : undefined,
                          }}
                          onClick={() => setAdjType('bonus')}
                        >
                          <Plus size={14} /> Bonus (+)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ marginBottom: '6px' }}>
                        Points Amount
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        className="form-input"
                        value={adjValue}
                        onChange={(e) => setAdjValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        required
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" style={{ marginBottom: '6px' }}>
                        Reason / Notes (Visible on Standings)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Rule 4.2 Late Lobby Check-in, Illegal Weapon Class, MVP Bonus"
                        value={adjReason}
                        onChange={(e) => setAdjReason(e.target.value)}
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="icon-btn primary"
                        style={{ width: '100%', height: '42px', justifyContent: 'center' }}
                      >
                        <Plus size={16} />
                        <span>Apply Adjustment</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Active Adjustments Status */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>
                  Current Team Point Adjustments Status
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {localTeams.map((team) => {
                    const adj = team.pointAdjustment || 0;
                    const hasAdjustment = adj !== 0;

                    return (
                      <div
                        key={team.id}
                        style={{
                          background: hasAdjustment
                            ? adj < 0
                              ? 'rgba(239, 68, 68, 0.08)'
                              : 'rgba(16, 185, 129, 0.08)'
                            : 'rgba(255, 255, 255, 0.02)',
                          border: hasAdjustment
                            ? adj < 0
                              ? '1px solid rgba(239, 68, 68, 0.25)'
                              : '1px solid rgba(16, 185, 129, 0.25)'
                            : '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TeamBadge
                              logoUrl={team.logoUrl}
                              name={team.name}
                              tag={team.tag}
                              color={team.avatarColor}
                              size={28}
                            />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{team.name}</div>
                              {team.tag && (
                                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{team.tag}</span>
                              )}
                            </div>
                          </div>

                          {/* Adjustment Badge */}
                          <div>
                            {hasAdjustment ? (
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: adj < 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                  color: adj < 0 ? '#f87171' : '#34d399',
                                  border: adj < 0 ? '1px solid #ef4444' : '1px solid #10b981',
                                }}
                              >
                                {adj > 0 ? `+${adj} BONUS` : `${adj} PENALTY`}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                Neutral (0 pts)
                              </span>
                            )}
                          </div>
                        </div>

                        {team.adjustmentReason && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: adj < 0 ? '#fca5a5' : '#a7f3d0',
                              fontStyle: 'italic',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: 'rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            Reason: {team.adjustmentReason}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            className="qty-btn"
                            title="Subtract 1 point"
                            onClick={() => handleQuickAdjustPoints(team.id, -1)}
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            className="qty-btn"
                            title="Add 1 point"
                            onClick={() => handleQuickAdjustPoints(team.id, 1)}
                          >
                            +1
                          </button>
                          {hasAdjustment && (
                            <button
                              type="button"
                              className="icon-btn danger"
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                              title="Clear adjustment"
                              onClick={() => handleRemoveAdjustment(team.id)}
                            >
                              <Trash2 size={12} />
                              <span>Clear</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: SCORING RULES & DISTRIBUTION
              ======================================================== */}
          {activeTab === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Presets Bar */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Sparkles size={18} color="#f59e0b" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                    Quick-Apply 4-Round Scoring Presets
                  </h4>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '10px',
                  }}
                >
                  <button
                    type="button"
                    className="mode-toggle-btn"
                    style={{ textAlign: 'left', padding: '10px 14px', height: 'auto', display: 'block' }}
                    onClick={() => applyPreset('official')}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f59e0b' }}>
                      👑 CODM Official Standard
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
                      20, 15, 12, 10, 8, 6, 4, 2 • 1 pt/kill
                    </div>
                  </button>

                  <button
                    type="button"
                    className="mode-toggle-btn"
                    style={{ textAlign: 'left', padding: '10px 14px', height: 'auto', display: 'block' }}
                    onClick={() => applyPreset('aggressive')}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ef4444' }}>
                      🔥 Aggressive / Kill-Heavy
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
                      15, 12, 10, 8, 6, 4, 2, 1 • 2 pts/kill
                    </div>
                  </button>

                  <button
                    type="button"
                    className="mode-toggle-btn"
                    style={{ textAlign: 'left', padding: '10px 14px', height: 'auto', display: 'block' }}
                    onClick={() => applyPreset('survival')}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10b981' }}>
                      🛡️ Survival Focus
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
                      25, 18, 14, 10, 7, 5, 3, 1 • 1 pt/kill
                    </div>
                  </button>

                  <button
                    type="button"
                    className="mode-toggle-btn"
                    style={{ textAlign: 'left', padding: '10px 14px', height: 'auto', display: 'block' }}
                    onClick={() => applyPreset('linear')}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#3b82f6' }}>
                      ⚖️ Linear / Flat
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
                      10, 8, 6, 5, 4, 3, 2, 1 • 1 pt/kill
                    </div>
                  </button>
                </div>
              </div>

              {/* Kill Points Config */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
                    <Flame size={18} color="#fb923c" />
                    <span>Points Awarded Per Kill (Applied Across All 4 Rounds)</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '2px' }}>
                    Each confirmed elimination adds this many points to the match total
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    className="form-input"
                    style={{ width: '80px', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}
                    value={pointsPerKill}
                    onChange={(e) => setPointsPerKill(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600 }}>
                    pt(s) / kill
                  </span>
                </div>
              </div>

              {/* Placement Points Table Config */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                }}
              >
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                  Placement Points Distribution (1st to 8th Place)
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: '16px' }}>
                  Specify the points awarded to squads based on their final match lobby placement
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((place) => (
                    <div
                      key={place}
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color:
                            place === 1
                              ? '#f59e0b'
                              : place === 2
                              ? '#cbd5e1'
                              : place === 3
                              ? '#d97706'
                              : '#9ca3af',
                        }}
                      >
                        {place === 1
                          ? '🥇 1st Place'
                          : place === 2
                          ? '🥈 2nd Place'
                          : place === 3
                          ? '🥉 3rd Place'
                          : `#${place} Place`}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="form-input"
                          style={{
                            width: '60px',
                            textAlign: 'center',
                            fontWeight: 700,
                            padding: '4px 6px',
                            fontSize: '0.95rem',
                          }}
                          value={placementPoints[place] ?? 0}
                          onChange={(e) =>
                            handleUpdatePlacementPoint(place, parseInt(e.target.value, 10) || 0)
                          }
                        />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            Tournament format: <strong>4 Matches</strong> • All modifications recalculate cumulative standings.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="icon-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="icon-btn primary"
              onClick={handleSaveAllChanges}
              style={{ padding: '8px 18px', fontWeight: 700 }}
            >
              <Save size={16} />
              <span>Save & Apply All 4 Rounds</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
