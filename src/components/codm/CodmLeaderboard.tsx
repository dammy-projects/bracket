import React, { useState } from 'react';
import {
  CodmTeam,
  CodmRound,
  CodmTournamentSettings,
  CodmTeamStanding,
} from '../../types/codm';
import { computeOverallStandings } from '../../utils/codmCalculator';
import {
  Trophy,
  Target,
  Edit3,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  MapPin,
  Flame,
} from 'lucide-react';

interface CodmLeaderboardProps {
  settings: CodmTournamentSettings;
  teams: CodmTeam[];
  rounds: CodmRound[];
  activeRoundFilter: number | 'all';
  isAdmin: boolean;
  onSelectRoundFilter: (filter: number | 'all') => void;
  onOpenScoreModal: (roundNumber: number) => void;
  onOpenTeamManager: () => void;
  onOpenRulesModal: () => void;
}

export const CodmLeaderboard: React.FC<CodmLeaderboardProps> = ({
  settings,
  teams,
  rounds,
  activeRoundFilter,
  isAdmin,
  onSelectRoundFilter,
  onOpenScoreModal,
  onOpenTeamManager,
  onOpenRulesModal,
}) => {
  const standings = computeOverallStandings(teams, rounds);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const toggleExpandTeam = (teamId: string) => {
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId));
  };

  const selectedRound =
    activeRoundFilter === 'all'
      ? null
      : rounds.find((r) => r.roundNumber === activeRoundFilter);

  // Sort single round results if a specific match is active
  const singleRoundStandings = selectedRound
    ? [...teams]
        .map((team) => {
          const res = selectedRound.results[team.id] || {
            placement: 0,
            kills: 0,
            placementPoints: 0,
            killPoints: 0,
            totalPoints: 0,
          };
          return { team, ...res };
        })
        .sort((a, b) => {
          if (a.placement === 0) return 1;
          if (b.placement === 0) return -1;
          return a.placement - b.placement;
        })
    : [];

  const top3 = standings.slice(0, 3);

  return (
    <div className="codm-container">
      {/* Tournament Meta Subheader */}
      <div className="codm-meta-bar">
        <div className="codm-meta-left">
          <div className="codm-badge-group">
            <span className="codm-game-badge">🎮 {settings.gameMode}</span>
            <span className="codm-info-pill">📅 {settings.dateText}</span>
            <span className="codm-info-pill">👥 {settings.totalTeams} Teams</span>
            <span className="codm-info-pill">🎯 4 Matches</span>
          </div>
        </div>

        <div className="codm-meta-right">
          <button className="icon-btn" onClick={onOpenRulesModal}>
            <span>📜 Official Rules & Scoring</span>
          </button>
          {isAdmin && (
            <button className="icon-btn primary" onClick={onOpenTeamManager}>
              <Users size={16} />
              <span>Squad Rosters (5/team)</span>
            </button>
          )}
        </div>
      </div>

      {/* Rounds Navigation Cards */}
      <div className="codm-round-cards-grid">
        <button
          type="button"
          className={`codm-round-card ${activeRoundFilter === 'all' ? 'active' : ''}`}
          onClick={() => onSelectRoundFilter('all')}
        >
          <div className="round-card-top">
            <span className="round-card-title">Overall Standings</span>
            <Trophy size={16} color="#f59e0b" />
          </div>
          <div className="round-card-desc">Cumulative points from all 4 matches</div>
        </button>

        {rounds.map((r) => {
          const hasScores = Object.values(r.results).some((res) => res.placement > 0);
          return (
            <div
              key={r.roundNumber}
              className={`codm-round-card ${activeRoundFilter === r.roundNumber ? 'active' : ''}`}
              onClick={() => onSelectRoundFilter(r.roundNumber)}
            >
              <div className="round-card-top">
                <span className="round-card-title">{r.name}</span>
                <span className={`status-dot-badge ${r.status}`}>
                  {r.status === 'completed'
                    ? 'Completed'
                    : r.status === 'live'
                    ? 'Live'
                    : 'Scheduled'}
                </span>
              </div>
              <div className="round-card-meta">
                <span className="map-badge">
                  <MapPin size={12} /> {r.map}
                </span>
                <span className="lobby-badge">{r.lobbyType}</span>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="quick-score-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenScoreModal(r.roundNumber);
                  }}
                >
                  <Edit3 size={12} />
                  <span>{hasScores ? 'Edit Scores' : 'Enter Scores'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Podium Highlights (only on 'all' view) */}
      {activeRoundFilter === 'all' && standings.length >= 3 && standings[0].totalPoints > 0 && (
        <div className="codm-podium-section">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="podium-card rank-2">
              <div className="podium-badge">🥈 2ND PLACE</div>
              <div className="podium-team-logo" style={{ backgroundColor: top3[1].team.avatarColor || '#64748b' }}>
                {top3[1].team.logoUrl ? (
                  <img src={top3[1].team.logoUrl} alt={top3[1].team.name} />
                ) : (
                  <span>{top3[1].team.avatarIcon || '👑'}</span>
                )}
              </div>
              <div className="podium-team-name">{top3[1].team.name}</div>
              {top3[1].team.tag && <div className="podium-team-tag">{top3[1].team.tag}</div>}
              <div className="podium-score-pill">
                <strong>{top3[1].totalPoints}</strong> PTS
                <span className="podium-kills">({top3[1].totalKills} kills)</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="podium-card rank-1">
              <div className="crown-icon">👑</div>
              <div className="podium-badge gold">🥇 TOURNAMENT LEADER</div>
              <div className="podium-team-logo gold-glow" style={{ backgroundColor: top3[0].team.avatarColor || '#f59e0b' }}>
                {top3[0].team.logoUrl ? (
                  <img src={top3[0].team.logoUrl} alt={top3[0].team.name} />
                ) : (
                  <span>{top3[0].team.avatarIcon || '🐂'}</span>
                )}
              </div>
              <div className="podium-team-name">{top3[0].team.name}</div>
              {top3[0].team.tag && <div className="podium-team-tag">{top3[0].team.tag}</div>}
              <div className="podium-score-pill gold">
                <strong>{top3[0].totalPoints}</strong> PTS
                <span className="podium-kills">({top3[0].totalKills} kills)</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="podium-card rank-3">
              <div className="podium-badge bronze">🥉 3RD PLACE</div>
              <div className="podium-team-logo" style={{ backgroundColor: top3[2].team.avatarColor || '#b45309' }}>
                {top3[2].team.logoUrl ? (
                  <img src={top3[2].team.logoUrl} alt={top3[2].team.name} />
                ) : (
                  <span>{top3[2].team.avatarIcon || '🛡️'}</span>
                )}
              </div>
              <div className="podium-team-name">{top3[2].team.name}</div>
              {top3[2].team.tag && <div className="podium-team-tag">{top3[2].team.tag}</div>}
              <div className="podium-score-pill">
                <strong>{top3[2].totalPoints}</strong> PTS
                <span className="podium-kills">({top3[2].totalKills} kills)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: Cumulative Overall Standings Table */}
      {activeRoundFilter === 'all' ? (
        <div className="codm-table-container">
          <div className="table-header-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="#f59e0b" />
              <h3>Official Leaderboard & Standings</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              Ranking: Total Points (Desc) → Total Kills (Desc) → Best Placement
            </span>
          </div>

          <table className="codm-standings-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Team / Department</th>
                <th className="match-col">M1</th>
                <th className="match-col">M2</th>
                <th className="match-col">M3</th>
                <th className="match-col">M4</th>
                <th style={{ textAlign: 'center' }}>Total Kills</th>
                <th style={{ textAlign: 'center' }}>Placement Pts</th>
                <th style={{ textAlign: 'right' }}>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => {
                const isExpanded = expandedTeamId === row.team.id;
                const rankClass =
                  row.rank === 1
                    ? 'rank-first'
                    : row.rank === 2
                    ? 'rank-second'
                    : row.rank === 3
                    ? 'rank-third'
                    : '';

                return (
                  <React.Fragment key={row.team.id}>
                    <tr
                      className={`standings-row ${rankClass}`}
                      onClick={() => toggleExpandTeam(row.team.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Rank Cell */}
                      <td>
                        <div className={`rank-indicator ${rankClass}`}>
                          {row.rank === 1 ? '🥇 1' : row.rank === 2 ? '🥈 2' : row.rank === 3 ? '🥉 3' : row.rank}
                        </div>
                      </td>

                      {/* Team Info Cell */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {row.team.logoUrl ? (
                            <img src={row.team.logoUrl} alt={row.team.name} className="team-logo-small" />
                          ) : (
                            <span
                              className="team-logo-small"
                              style={{ backgroundColor: row.team.avatarColor || '#3b82f6' }}
                            >
                              {row.team.avatarIcon || '🛡️'}
                            </span>
                          )}
                          <div>
                            <div className="standings-team-name">
                              {row.team.name}
                              {row.firstPlaceCount > 0 && (
                                <span className="wwcd-badge" title={`${row.firstPlaceCount} Match Win(s)`}>
                                  👑 x{row.firstPlaceCount}
                                </span>
                              )}
                            </div>
                            <div className="standings-team-sub">
                              {row.team.tag && <span className="team-tag-badge">{row.team.tag}</span>}
                              <span className="roster-preview-btn">
                                5 Players {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Match 1 to 4 Breakdown */}
                      {[1, 2, 3, 4].map((mNum) => {
                        const mRes = row.matchBreakdown[mNum];
                        return (
                          <td key={mNum} className="match-col">
                            {mRes && mRes.placement > 0 ? (
                              <div className="match-cell-box">
                                <span className="match-pts-val">{mRes.totalPoints}</span>
                                <span className="match-pts-sub">
                                  #{mRes.placement} • {mRes.kills}k
                                </span>
                              </div>
                            ) : (
                              <span className="match-cell-empty">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Kills */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="kills-pill">
                          <Flame size={12} /> {row.totalKills}
                        </span>
                      </td>

                      {/* Total Placement Points */}
                      <td style={{ textAlign: 'center' }}>
                        <span className="placement-pill">+{row.totalPlacementPoints}</span>
                      </td>

                      {/* Total Grand Score */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="total-score-pill">{row.totalPoints} PTS</span>
                      </td>
                    </tr>

                    {/* Expanded 5-Player Roster Drawer */}
                    {isExpanded && (
                      <tr className="roster-drawer-row">
                        <td colSpan={9}>
                          <div className="roster-drawer-content">
                            <div className="drawer-header">
                              <strong>{row.team.name} Official 5-Player Squad:</strong>
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                (4 Main Players + 1 Reserve Player)
                              </span>
                            </div>
                            <div className="drawer-players-grid">
                              {row.team.players?.map((pl, idx) => (
                                <div
                                  key={pl.id || idx}
                                  className={`drawer-player-item ${
                                    pl.role === 'reserve' ? 'reserve' : 'main'
                                  }`}
                                >
                                  <div className="drawer-role-tag">
                                    {pl.role === 'reserve' ? '🛡️ RESERVE' : `SQUAD #${idx + 1}`}
                                  </div>
                                  <div className="drawer-player-name">{pl.name}</div>
                                  {pl.ign && <div className="drawer-player-ign">IGN: {pl.ign}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* VIEW 2: Single Match Scorecard */
        selectedRound && (
          <div className="codm-table-container">
            <div className="single-match-header">
              <div>
                <h3>{selectedRound.name} Results & Scorecard</h3>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
                  Lobby: {selectedRound.lobbyType} • Map: <strong>{selectedRound.map}</strong> • Status: {selectedRound.status.toUpperCase()}
                </p>
              </div>

              {isAdmin && (
                <button
                  className="icon-btn primary"
                  onClick={() => onOpenScoreModal(selectedRound.roundNumber)}
                >
                  <Edit3 size={16} />
                  <span>Edit {selectedRound.name} Scores</span>
                </button>
              )}
            </div>

            <table className="codm-standings-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Placement</th>
                  <th>Team</th>
                  <th style={{ textAlign: 'center', width: '150px' }}>Placement Pts</th>
                  <th style={{ textAlign: 'center', width: '150px' }}>Kills (+1 pt each)</th>
                  <th style={{ textAlign: 'right', width: '150px' }}>Match Score</th>
                </tr>
              </thead>
              <tbody>
                {singleRoundStandings.map((row) => (
                  <tr key={row.team.id} className="standings-row">
                    <td>
                      {row.placement > 0 ? (
                        <span className={`placement-badge place-${row.placement}`}>
                          {row.placement === 1
                            ? '🥇 1st'
                            : row.placement === 2
                            ? '🥈 2nd'
                            : row.placement === 3
                            ? '🥉 3rd'
                            : `${row.placement}th`}
                        </span>
                      ) : (
                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Unrecorded</span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {row.team.logoUrl ? (
                          <img src={row.team.logoUrl} alt={row.team.name} className="team-logo-small" />
                        ) : (
                          <span
                            className="team-logo-small"
                            style={{ backgroundColor: row.team.avatarColor || '#3b82f6' }}
                          >
                            {row.team.avatarIcon || '🛡️'}
                          </span>
                        )}
                        <div>
                          <span style={{ fontWeight: 600 }}>{row.team.name}</span>
                          {row.team.tag && (
                            <span className="team-tag-badge" style={{ marginLeft: '8px' }}>
                              {row.team.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className="placement-pill">+{row.placementPoints} pts</span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className="kills-pill">
                        <Flame size={12} /> {row.kills} kills
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <span className="total-score-pill">{row.totalPoints} PTS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};
