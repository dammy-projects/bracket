import React, { useState, useEffect, useMemo } from 'react';
import {
  CodmRound,
  CodmTeam,
  CodmMatchResult,
  CODM_PLACEMENT_POINTS,
  CodmTournamentSettings,
} from '../../types/codm';
import { calculateMatchPoints } from '../../utils/codmCalculator';
import { TeamBadge } from '../common/TeamBadge';
import { CODM_MAPS } from '../../utils/codmDefaultData';
import { X, Dices, Save, AlertTriangle, CheckCircle2, Trophy, Zap } from 'lucide-react';

interface CodmScoreModalProps {
  round: CodmRound | null;
  allRounds: CodmRound[];
  teams: CodmTeam[];
  isOpen: boolean;
  onClose: () => void;
  onSaveRoundScores: (updatedRound: CodmRound) => void;
  onSelectRoundIndex: (roundIndex: number) => void;
  settings?: CodmTournamentSettings;
}

export const CodmScoreModal: React.FC<CodmScoreModalProps> = ({
  round,
  allRounds,
  teams,
  isOpen,
  onClose,
  onSaveRoundScores,
  onSelectRoundIndex,
  settings,
}) => {
  const [mapName, setMapName] = useState(round?.map || 'Isolated');
  const [roundStatus, setRoundStatus] = useState(round?.status || 'scheduled');
  const [results, setResults] = useState<Record<string, { placement: number; kills: number }>>(() => {
    const initial: Record<string, { placement: number; kills: number }> = {};
    teams.forEach((t) => {
      const existing = round?.results ? round.results[t.id] : undefined;
      initial[t.id] = {
        placement: existing?.placement || 0,
        kills: existing?.kills || 0,
      };
    });
    return initial;
  });

  const [isRandomizingMap, setIsRandomizingMap] = useState(false);

  // Sync state when round changes
  useEffect(() => {
    if (!round) return;
    setMapName(round.map || 'Isolated');
    setRoundStatus(round.status || 'scheduled');
    const updated: Record<string, { placement: number; kills: number }> = {};
    teams.forEach((t) => {
      const existing = round.results ? round.results[t.id] : undefined;
      updated[t.id] = {
        placement: existing?.placement || 0,
        kills: existing?.kills || 0,
      };
    });
    setResults(updated);
  }, [round?.roundNumber, teams]);

  const handleRandomizeMap = () => {
    setIsRandomizingMap(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randomMap = CODM_MAPS[Math.floor(Math.random() * CODM_MAPS.length)];
      setMapName(randomMap);
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        setIsRandomizingMap(false);
      }
    }, 80);
  };

  const handleUpdatePlacement = (teamId: string, placement: number) => {
    setResults((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        placement,
      },
    }));
  };

  const handleUpdateKills = (teamId: string, kills: number) => {
    setResults((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        kills: Math.max(0, kills),
      },
    }));
  };

  // Check for duplicate placements
  const placementCounts: Record<number, number> = {};
  Object.values(results).forEach((r) => {
    if (r.placement > 0) {
      placementCounts[r.placement] = (placementCounts[r.placement] || 0) + 1;
    }
  });

  const hasDuplicatePlacements = Object.values(placementCounts).some((count) => count > 1);

  const pMap = settings?.placementPoints || CODM_PLACEMENT_POINTS;
  const ptsPerKill = settings?.pointsPerKill ?? 1;

  // Auto-assign in-game placements based on kills
  const handleAutoAssignByKills = () => {
    const sorted = [...teams].sort((a, b) => {
      const aKills = results[a.id]?.kills || 0;
      const bKills = results[b.id]?.kills || 0;
      if (bKills !== aKills) return bKills - aKills;
      return a.seed - b.seed;
    });

    const newResults = { ...results };
    sorted.forEach((team, idx) => {
      const current = newResults[team.id] || { kills: 0 };
      newResults[team.id] = {
        kills: current.kills,
        placement: idx + 1,
      };
    });
    setResults(newResults);
  };

  // Calculate live ranking based on current match points
  const teamScoresWithRank = useMemo(() => {
    return teams
      .map((team) => {
        const entry = results[team.id] || { placement: 0, kills: 0 };
        const { placementPoints, killPoints, totalPoints } = calculateMatchPoints(
          entry.placement,
          entry.kills,
          ptsPerKill,
          pMap
        );
        return {
          team,
          entry,
          placementPoints,
          killPoints,
          totalPoints,
        };
      })
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.entry.kills !== a.entry.kills) return b.entry.kills - a.entry.kills;
        if (a.entry.placement > 0 && b.entry.placement > 0) return a.entry.placement - b.entry.placement;
        if (a.entry.placement > 0) return -1;
        if (b.entry.placement > 0) return 1;
        return a.team.seed - b.team.seed;
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }, [teams, results, ptsPerKill, pMap]);

  const handleSave = () => {
    if (!round) return;
    const finalResults: Record<string, CodmMatchResult> = {};
    teams.forEach((team) => {
      const r = results[team.id] || { placement: 0, kills: 0 };
      const { placementPoints, killPoints, totalPoints } = calculateMatchPoints(
        r.placement,
        r.kills,
        ptsPerKill,
        pMap
      );
      finalResults[team.id] = {
        teamId: team.id,
        placement: r.placement,
        kills: r.kills,
        placementPoints,
        killPoints,
        totalPoints,
      };
    });

    const updatedRound: CodmRound = {
      ...round,
      map: mapName,
      status: roundStatus,
      results: finalResults,
    };

    onSaveRoundScores(updatedRound);
    onClose();
  };

  if (!isOpen || !round) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '850px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={20} color="#f59e0b" />
            <div>
              <h3 className="modal-title">Record Scores: {round.name}</h3>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {round.lobbyType} • {teams.length} Teams • Battle Royale Squad
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Round Tabs & Lobby Controls */}
        <div className="modal-body" style={{ overflowY: 'auto' }}>
          {/* Round Selector Bar */}
          <div className="tabs-container" style={{ marginBottom: '16px' }}>
            {allRounds.map((r) => (
              <button
                key={r.roundNumber}
                type="button"
                className={`tab-btn ${r.roundNumber === round.roundNumber ? 'active' : ''}`}
                onClick={() => onSelectRoundIndex(r.roundNumber)}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Match Config Bar: Map and Status */}
          <div className="codm-match-config-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>
                  Selected Map (Randomized per round)
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    style={{ width: '150px' }}
                    value={mapName}
                    onChange={(e) => setMapName(e.target.value)}
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
                    onClick={handleRandomizeMap}
                    disabled={isRandomizingMap}
                    title="Randomly pick a map per tournament rules"
                  >
                    <Dices size={16} className={isRandomizingMap ? 'animate-spin' : ''} />
                    <span>{isRandomizingMap ? 'Rolling...' : 'Randomize Map'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>
                  Match Status
                </label>
                <select
                  className="form-input"
                  style={{ width: '150px' }}
                  value={roundStatus}
                  onChange={(e) => setRoundStatus(e.target.value as any)}
                >
                  <option value="scheduled">⏳ Scheduled</option>
                  <option value="live">🔴 Live in Progress</option>
                  <option value="completed">✓ Completed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="icon-btn"
                  style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                  onClick={handleAutoAssignByKills}
                  title="Automatically assign in-game placements (1st to 8th) based on kills"
                >
                  <Zap size={14} color="#f59e0b" />
                  <span>Auto-Rank Placements by Kills</span>
                </button>
              </div>

              {hasDuplicatePlacements && (
                <div className="duplicate-warning" style={{ margin: 0 }}>
                  <AlertTriangle size={16} />
                  <span>Notice: Two or more teams have the same in-game placement!</span>
                </div>
              )}
            </div>
          </div>

          {/* Teams Scoring Table */}
          <div className="codm-score-table-wrap">
            <table className="codm-score-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Placement</th>
                  <th style={{ width: '220px' }}>Team</th>
                  <th style={{ width: '180px' }}>In-Game Place</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Placement Pts</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Kills (+{ptsPerKill} pt)</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Total Pts</th>
                </tr>
              </thead>
              <tbody>
                {teamScoresWithRank.map(({ team, entry, placementPoints, killPoints, totalPoints, rank }) => {
                  const isDupe = entry.placement > 0 && (placementCounts[entry.placement] || 0) > 1;

                  return (
                    <tr key={team.id} className={isDupe ? 'row-duplicate-placement' : ''}>
                      {/* Live Calculated Placement */}
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

                      {/* Team */}
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

                      {/* Placement Dropdown */}
                      <td>
                        <select
                          className={`form-input ${isDupe ? 'input-error' : ''}`}
                          value={entry.placement}
                          onChange={(e) =>
                            handleUpdatePlacement(team.id, parseInt(e.target.value, 10))
                          }
                        >
                          <option value="0">-- Not Placed --</option>
                          <option value="1">🥇 1st Place ({pMap[1] || 20} pts)</option>
                          <option value="2">🥈 2nd Place ({pMap[2] || 15} pts)</option>
                          <option value="3">🥉 3rd Place ({pMap[3] || 12} pts)</option>
                          <option value="4">4th Place ({pMap[4] || 10} pts)</option>
                          <option value="5">5th Place ({pMap[5] || 8} pts)</option>
                          <option value="6">6th Place ({pMap[6] || 6} pts)</option>
                          <option value="7">7th Place ({pMap[7] || 4} pts)</option>
                          <option value="8">8th Place ({pMap[8] || 2} pts)</option>
                        </select>
                      </td>

                      {/* Placement Points Preview */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="pts-tag placement-tag">
                          +{placementPoints} pts
                        </span>
                      </td>

                      {/* Kills Input */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleUpdateKills(team.id, entry.kills - 1)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            style={{ width: '56px', textAlign: 'center', fontWeight: 700 }}
                            value={entry.kills}
                            onChange={(e) =>
                              handleUpdateKills(team.id, parseInt(e.target.value, 10) || 0)
                            }
                          />
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleUpdateKills(team.id, entry.kills + 1)}
                          >
                            +
                          </button>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '4px' }}>
                            = {killPoints}p
                          </span>
                        </div>
                      </td>

                      {/* Total Points for this match */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="pts-tag total-tag">
                          {totalPoints} pts
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="icon-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="icon-btn primary" onClick={handleSave}>
            <Save size={16} />
            <span>Save {round.name} Results</span>
          </button>
        </div>
      </div>
    </div>
  );
};
