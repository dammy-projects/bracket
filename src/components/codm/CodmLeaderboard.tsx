import React from 'react';
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
      {/* ========================================================
          WEB INTERACTIVE SCREEN VIEW (HIDDEN ON PRINT)
          ======================================================== */}
      <div className="codm-screen-view">
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
                  const rankClass =
                    row.rank === 1
                      ? 'rank-first'
                      : row.rank === 2
                      ? 'rank-second'
                      : row.rank === 3
                      ? 'rank-third'
                      : '';

                  return (
                    <tr key={row.team.id} className={`standings-row ${rankClass}`}>
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
                            {row.team.tag && (
                              <div className="standings-team-sub">
                                <span className="team-tag-badge">{row.team.tag}</span>
                              </div>
                            )}
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

      {/* ========================================================
          MODERN PRINT STANDINGS DOCUMENT (PRINT-ONLY)
          ======================================================== */}
      <div className="codm-print-sheet">
        {/* Modern Print Header */}
        <div className="modern-print-header">
          <div className="modern-print-header-main">
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" className="modern-print-logo" />
            )}
            <div>
              <div className="modern-print-tag">OFFICIAL TOURNAMENT SCORECARD</div>
              <h1 className="modern-print-title">{settings.title}</h1>
              <p className="modern-print-subtitle">
                {settings.subtitle || 'Battle Royale Squad Tournament • Official Standings & Results'}
              </p>
            </div>
          </div>

          <div className="modern-print-meta-grid">
            <div className="meta-box">
              <span className="meta-lbl">GAME MODE</span>
              <span className="meta-val">{settings.gameMode}</span>
            </div>
            <div className="meta-box">
              <span className="meta-lbl">FORMAT</span>
              <span className="meta-val">{settings.totalTeams} Teams • 4 Rounds</span>
            </div>
            <div className="meta-box">
              <span className="meta-lbl">DATE</span>
              <span className="meta-val">{settings.dateText || 'TBA'}</span>
            </div>
            <div className="meta-box">
              <span className="meta-lbl">STATUS</span>
              <span className="meta-val badge">{settings.statusBadge}</span>
            </div>
          </div>
        </div>

        {/* Modern Print Standings Table */}
        <div className="modern-print-table-wrap">
          <table className="modern-print-table">
            <thead>
              <tr>
                <th className="col-rank">RANK</th>
                <th className="col-team">TEAM / DEPARTMENT</th>
                <th className="col-match">
                  MATCH 1
                  <span className="th-sub">{rounds[0]?.map || 'Map 1'}</span>
                </th>
                <th className="col-match">
                  MATCH 2
                  <span className="th-sub">{rounds[1]?.map || 'Map 2'}</span>
                </th>
                <th className="col-match">
                  MATCH 3
                  <span className="th-sub">{rounds[2]?.map || 'Map 3'}</span>
                </th>
                <th className="col-match">
                  MATCH 4
                  <span className="th-sub">{rounds[3]?.map || 'Map 4'}</span>
                </th>
                <th className="col-kills">TOTAL KILLS</th>
                <th className="col-placement">PLACEMENT PTS</th>
                <th className="col-total">TOTAL POINTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => {
                const rankLabel =
                  row.rank === 1
                    ? '1ST'
                    : row.rank === 2
                    ? '2ND'
                    : row.rank === 3
                    ? '3RD'
                    : `${row.rank}TH`;
                const rankClass =
                  row.rank === 1
                    ? 'rank-gold'
                    : row.rank === 2
                    ? 'rank-silver'
                    : row.rank === 3
                    ? 'rank-bronze'
                    : 'rank-normal';

                return (
                  <tr key={row.team.id} className={`print-row ${rankClass}`}>
                    <td className="col-rank">
                      <span className={`print-rank-badge ${rankClass}`}>
                        {rankLabel}
                      </span>
                    </td>
                    <td className="col-team">
                      <div className="print-team-cell">
                        {row.team.logoUrl ? (
                          <img
                            src={row.team.logoUrl}
                            alt={row.team.name}
                            className="print-team-logo"
                          />
                        ) : (
                          <span
                            className="print-team-logo icon"
                            style={{ backgroundColor: row.team.avatarColor || '#3b82f6' }}
                          >
                            {row.team.avatarIcon || '🏆'}
                          </span>
                        )}
                        <div className="print-team-details">
                          <span className="print-team-name">{row.team.name}</span>
                          {row.team.tag && (
                            <span className="print-dept-tag">{row.team.tag}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Matches 1-4 */}
                    {[1, 2, 3, 4].map((mNum) => {
                      const mRes = row.matchBreakdown[mNum];
                      return (
                        <td key={mNum} className="col-match">
                          {mRes && mRes.placement > 0 ? (
                            <div className="print-match-cell">
                              <span className="print-match-total">{mRes.totalPoints}</span>
                              <span className="print-match-breakdown">
                                #{mRes.placement} • {mRes.kills}k
                              </span>
                            </div>
                          ) : (
                            <span className="print-empty">-</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="col-kills">
                      <span className="print-stat-val">{row.totalKills}</span>
                    </td>

                    <td className="col-placement">
                      <span className="print-stat-val">+{row.totalPlacementPoints}</span>
                    </td>

                    <td className="col-total">
                      <span className="print-total-badge">{row.totalPoints} PTS</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modern Print Footer */}
        <div className="modern-print-footer">
          <div className="print-scoring-reference">
            <div className="reference-title">OFFICIAL SCORING FORMULA</div>
            <div className="reference-content">
              <span><strong>Placement Points:</strong> 1st: 20 pts | 2nd: 15 pts | 3rd: 12 pts | 4th: 10 pts | 5th: 8 pts | 6th: 6 pts | 7th: 4 pts | 8th: 2 pts</span>
              <span> • </span>
              <span><strong>Kill Points:</strong> +1 pt/kill</span>
              <span> • </span>
              <span><strong>Total:</strong> Placement Pts + Kill Pts</span>
            </div>
          </div>

          <div className="print-signoff-row">
            <div className="signoff-box">
              <span className="signoff-line"></span>
              <span className="signoff-label">Tournament Official / Marshall</span>
            </div>
            <div className="signoff-box">
              <span className="signoff-line"></span>
              <span className="signoff-label">Chief Arbiter / Head Organizer</span>
            </div>
            <div className="signoff-box right">
              <span className="signoff-date">
                Official Report • Verified {new Date().toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="signoff-label">Official System Verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
