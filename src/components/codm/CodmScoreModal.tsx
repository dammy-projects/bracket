import React, { useState, useEffect } from 'react';
import { CodmRound, CodmTeam, CodmMatchResult, CODM_PLACEMENT_POINTS } from '../../types/codm';
import { calculateMatchPoints } from '../../utils/codmCalculator';
import { CODM_MAPS } from '../../utils/codmDefaultData';
import { X, Dices, Save, AlertTriangle, CheckCircle2, Trophy } from 'lucide-react';

interface CodmScoreModalProps {
  round: CodmRound | null;
  allRounds: CodmRound[];
  teams: CodmTeam[];
  isOpen: boolean;
  onClose: () => void;
  onSaveRoundScores: (updatedRound: CodmRound) => void;
  onSelectRoundIndex: (roundIndex: number) => void;
}

export const CodmScoreModal: React.FC<CodmScoreModalProps> = ({
  round,
  allRounds,
  teams,
  isOpen,
  onClose,
  onSaveRoundScores,
  onSelectRoundIndex,
}) => {
  if (!isOpen || !round) return null;

  const [mapName, setMapName] = useState(round.map || 'Isolated');
  const [roundStatus, setRoundStatus] = useState(round.status || 'scheduled');
  const [results, setResults] = useState<Record<string, { placement: number; kills: number }>>(() => {
    const initial: Record<string, { placement: number; kills: number }> = {};
    teams.forEach((t) => {
      const existing = round.results[t.id];
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
    setMapName(round.map || 'Isolated');
    setRoundStatus(round.status || 'scheduled');
    const updated: Record<string, { placement: number; kills: number }> = {};
    teams.forEach((t) => {
      const existing = round.results[t.id];
      updated[t.id] = {
        placement: existing?.placement || 0,
        kills: existing?.kills || 0,
      };
    });
    setResults(updated);
  }, [round.roundNumber, teams]);

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

  const handleSave = () => {
    const finalResults: Record<string, CodmMatchResult> = {};
    teams.forEach((team) => {
      const r = results[team.id] || { placement: 0, kills: 0 };
      const { placementPoints, killPoints, totalPoints } = calculateMatchPoints(
        r.placement,
        r.kills
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
                {round.lobbyType} • 7 Teams • Battle Royale Squad
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

            {hasDuplicatePlacements && (
              <div className="duplicate-warning">
                <AlertTriangle size={16} />
                <span>Notice: Two or more teams have the same placement!</span>
              </div>
            )}
          </div>

          {/* Teams Scoring Table */}
          <div className="codm-score-table-wrap">
            <table className="codm-score-table">
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>Team</th>
                  <th style={{ width: '160px' }}>Placement</th>
                  <th style={{ width: '120px' }}>Placement Pts</th>
                  <th style={{ width: '140px' }}>Kills (+1 pt)</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Total Pts</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const entry = results[team.id] || { placement: 0, kills: 0 };
                  const { placementPoints, killPoints, totalPoints } = calculateMatchPoints(
                    entry.placement,
                    entry.kills
                  );
                  const isDupe = entry.placement > 0 && (placementCounts[entry.placement] || 0) > 1;

                  return (
                    <tr key={team.id} className={isDupe ? 'row-duplicate-placement' : ''}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="team-logo-small" />
                          ) : (
                            <span
                              className="team-logo-small"
                              style={{ backgroundColor: team.avatarColor || '#3b82f6' }}
                            >
                              {team.avatarIcon || '🛡️'}
                            </span>
                          )}
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
                          <option value="1">🥇 1st Place (20 pts)</option>
                          <option value="2">🥈 2nd Place (15 pts)</option>
                          <option value="3">🥉 3rd Place (12 pts)</option>
                          <option value="4">4th Place (10 pts)</option>
                          <option value="5">5th Place (8 pts)</option>
                          <option value="6">6th Place (6 pts)</option>
                          <option value="7">7th Place (4 pts)</option>
                          <option value="8">8th Place (2 pts)</option>
                        </select>
                      </td>

                      {/* Placement Points Preview */}
                      <td>
                        <span className="pts-tag placement-tag">
                          +{placementPoints} pts
                        </span>
                      </td>

                      {/* Kills Input */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                            style={{ width: '60px', textAlign: 'center' }}
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
