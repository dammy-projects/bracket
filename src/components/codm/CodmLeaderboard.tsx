import React, { useState } from 'react';
import {
  CodmTeam,
  CodmRound,
  CodmTournamentSettings,
  CodmTeamStanding,
  CODM_PLACEMENT_POINTS,
} from '../../types/codm';
import { computeOverallStandings, calculateMatchPoints } from '../../utils/codmCalculator';
import { TeamBadge } from '../common/TeamBadge';
import {
  Trophy,
  Target,
  Edit3,
  Users,
  Award,
  MapPin,
  Flame,
  Shield,
  UserCheck,
  ChevronRight,
  Sparkles,
  Calculator,
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
  onOpenPointsManager: () => void;
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
  onOpenPointsManager,
  onOpenRulesModal,
}) => {
  const standings = computeOverallStandings(teams, rounds, settings);

  const selectedRound =
    activeRoundFilter === 'all'
      ? null
      : rounds.find((r) => r.roundNumber === activeRoundFilter);

  // Sort single round results by points if a specific match is active
  const singleRoundStandings = selectedRound
    ? [...teams]
        .map((team) => {
          const raw = selectedRound.results ? selectedRound.results[team.id] : undefined;
          const placement = raw?.placement || 0;
          const kills = raw?.kills || 0;
          const { placementPoints, killPoints, totalPoints } = calculateMatchPoints(
            placement,
            kills,
            settings.pointsPerKill || 1,
            settings.placementPoints || CODM_PLACEMENT_POINTS,
            raw?.adjustmentPoints || 0
          );
          return {
            team,
            placement,
            kills,
            placementPoints,
            killPoints,
            totalPoints,
            adjustmentPoints: raw?.adjustmentPoints || 0,
            adjustmentReason: raw?.adjustmentReason,
          };
        })
        .sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          if (b.kills !== a.kills) {
            return b.kills - a.kills;
          }
          if (a.placement > 0 && b.placement > 0) {
            return a.placement - b.placement;
          }
          if (a.placement > 0) return -1;
          if (b.placement > 0) return 1;
          return a.team.seed - b.team.seed;
        })
        .map((item, idx) => ({
          ...item,
          roundRank: idx + 1,
        }))
    : [];

  const top3 = standings.slice(0, 3);
  const [viewMode, setViewMode] = useState<'standings' | 'rosters'>('standings');

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
              <span className="codm-info-pill">👥 {teams.length || settings.totalTeams} Teams</span>
              <span className="codm-info-pill">🎯 4 Matches</span>
            </div>
          </div>

          <div className="codm-meta-right">
            <div className="tabs-container" style={{ display: 'inline-flex', marginRight: '6px' }}>
              <button
                type="button"
                className={`tab-btn ${viewMode === 'standings' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setViewMode('standings')}
              >
                🏆 Standings
              </button>
              <button
                type="button"
                className={`tab-btn ${viewMode === 'rosters' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setViewMode('rosters')}
              >
                👥 Squad Rosters (5/team)
              </button>
            </div>
            <button className="icon-btn" onClick={onOpenRulesModal}>
              <span>📜 Rules</span>
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  className="icon-btn primary"
                  onClick={onOpenPointsManager}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#000000',
                    fontWeight: 700,
                  }}
                  title="Manage team scores, penalties, and points system"
                >
                  <Calculator size={16} />
                  <span>Manage Points</span>
                </button>
                <button className="icon-btn" onClick={onOpenTeamManager} title="Manage team rosters">
                  <Users size={16} />
                  <span>Manage Rosters</span>
                </button>
              </>
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
            const hasScores = Object.values(r.results || {}).some((res) => res && res.placement > 0);
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
                <div className="podium-team-logo" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TeamBadge
                    logoUrl={top3[1].team.logoUrl}
                    name={top3[1].team.name}
                    tag={top3[1].team.tag}
                    color={top3[1].team.avatarColor}
                    size={48}
                  />
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
                <div className="podium-team-logo gold-glow" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TeamBadge
                    logoUrl={top3[0].team.logoUrl}
                    name={top3[0].team.name}
                    tag={top3[0].team.tag}
                    color={top3[0].team.avatarColor}
                    size={56}
                  />
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
                <div className="podium-team-logo" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TeamBadge
                    logoUrl={top3[2].team.logoUrl}
                    name={top3[2].team.name}
                    tag={top3[2].team.tag}
                    color={top3[2].team.avatarColor}
                    size={48}
                  />
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

        {/* VIEW: Squad Rosters OR Match Standings */}
        {viewMode === 'rosters' ? (
          <div className="codm-table-container">
            <div className="table-header-title" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#3b82f6" />
                <h3>Official Registered Squad Rosters (5 Players / Team)</h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                Each squad requires 4 Main Players + 1 Reserve Player
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {teams.map((team, idx) => (
                <div
                  key={team.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="seed-badge">#{idx + 1}</span>
                      <TeamBadge
                        logoUrl={team.logoUrl}
                        name={team.name}
                        tag={team.tag}
                        color={team.avatarColor}
                        size={40}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>{team.name}</div>
                        {team.tag && (
                          <span className="team-tag-badge" style={{ fontSize: '0.7rem' }}>
                            {team.tag}
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        onClick={onOpenTeamManager}
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {/* 5-Player Squad List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[0, 1, 2, 3, 4].map((slotIdx) => {
                      const p = team.players?.[slotIdx] || {
                        id: `p_${team.id}_${slotIdx + 1}`,
                        name: `Player ${slotIdx + 1}`,
                        ign: '',
                        role: slotIdx === 4 ? 'reserve' : 'main',
                      };
                      const isRes = slotIdx === 4;

                      return (
                        <div
                          key={slotIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: isRes ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            border: isRes ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255, 255, 255, 0.04)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '2px 5px',
                                borderRadius: '4px',
                                background: isRes ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: isRes ? '#f87171' : '#60a5fa',
                              }}
                            >
                              {isRes ? 'SUB' : `#${slotIdx + 1}`}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e5e7eb' }}>
                              {p.name || `Player ${slotIdx + 1}`}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: '#93c5fd' }}>
                            {p.ign ? `IGN: ${p.ign}` : <span style={{ color: '#6b7280', fontStyle: 'italic' }}>No IGN</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeRoundFilter === 'all' ? (
          <div className="codm-table-container">
            <div className="table-header-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#f59e0b" />
                <h3>Official Leaderboard & Standings</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  Auto-Placement: Ranked by Total Points (Desc) → Total Kills (Desc) → Wins → Seed
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '5px' }}
                    onClick={onOpenPointsManager}
                  >
                    <Calculator size={13} />
                    <span>Manage Points & Rules</span>
                  </button>
                )}
              </div>
            </div>

            <table className="codm-standings-table">
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>Placement</th>
                  <th>Team / Department</th>
                  <th className="match-col">M1</th>
                  <th className="match-col">M2</th>
                  <th className="match-col">M3</th>
                  <th className="match-col">M4</th>
                  <th style={{ textAlign: 'center' }}>Total Kills</th>
                  <th style={{ textAlign: 'center' }}>Placement Pts</th>
                  <th style={{ textAlign: 'center' }}>Adj (±)</th>
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
                      {/* Rank / Placement Cell */}
                      <td>
                        <div className={`rank-indicator ${rankClass}`}>
                          {row.rank === 1 ? '🥇 1st' : row.rank === 2 ? '🥈 2nd' : row.rank === 3 ? '🥉 3rd' : `${row.rank}th`}
                        </div>
                      </td>

                      {/* Team Info Cell */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <TeamBadge
                            logoUrl={row.team.logoUrl}
                            name={row.team.name}
                            tag={row.team.tag}
                            color={row.team.avatarColor}
                            size={32}
                          />
                          <div>
                            <div className="standings-team-name">
                              {row.team.name}
                              {row.firstPlaceCount > 0 && (
                                <span className="wwcd-badge" title={`${row.firstPlaceCount} Match Win(s)`}>
                                  👑 x{row.firstPlaceCount}
                                </span>
                              )}
                            </div>
                            <div className="standings-team-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {row.team.tag && (
                                <span className="team-tag-badge">{row.team.tag}</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setViewMode('rosters')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#60a5fa',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                  padding: 0,
                                  textDecoration: 'underline',
                                }}
                              >
                                View Squad
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Match 1 to 4 Breakdown */}
                      {[1, 2, 3, 4].map((mNum) => {
                        const mRes = row.matchBreakdown[mNum];
                        return (
                          <td key={mNum} className="match-col">
                            {mRes && (mRes.placement > 0 || mRes.kills > 0 || mRes.totalPoints > 0) ? (
                              <div className="match-cell-box">
                                <span className="match-pts-val">{mRes.totalPoints}</span>
                                <span className="match-pts-sub">
                                  {mRes.placement > 0 ? `#${mRes.placement} • ` : ''}{mRes.kills}k
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

                      {/* Manual Point Adjustment (Bonus/Penalty) */}
                      <td style={{ textAlign: 'center' }}>
                        {row.pointAdjustment !== 0 ? (
                          <span
                            className={`pts-tag ${row.pointAdjustment > 0 ? 'bonus-tag' : 'penalty-tag'}`}
                            title={
                              row.adjustmentReason
                                ? `${row.adjustmentReason} (${row.pointAdjustment > 0 ? '+' : ''}${row.pointAdjustment} pts)`
                                : `Point Adjustment: ${row.pointAdjustment > 0 ? '+' : ''}${row.pointAdjustment} pts`
                            }
                          >
                            {row.pointAdjustment > 0 ? `+${row.pointAdjustment}` : row.pointAdjustment}
                          </span>
                        ) : (
                          <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>-</span>
                        )}
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
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={onOpenPointsManager}
                      title="Open 4-Round Points Manager"
                    >
                      <Calculator size={15} />
                      <span>Manage 4-Round Points</span>
                    </button>
                    <button
                      type="button"
                      className="icon-btn primary"
                      onClick={() => onOpenScoreModal(selectedRound.roundNumber)}
                    >
                      <Edit3 size={15} />
                      <span>Edit {selectedRound.name} Scores</span>
                    </button>
                  </div>
                )}
              </div>

              <table className="codm-standings-table">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>Placement</th>
                    <th>Team</th>
                    <th style={{ textAlign: 'center', width: '130px' }}>In-Game Place</th>
                    <th style={{ textAlign: 'center', width: '140px' }}>Placement Pts</th>
                    <th style={{ textAlign: 'center', width: '150px' }}>
                      Kills (+{settings.pointsPerKill || 1} pt each)
                    </th>
                    <th style={{ textAlign: 'right', width: '140px' }}>Round Points</th>
                  </tr>
                </thead>
                <tbody>
                  {singleRoundStandings.map((row) => {
                    const rankClass =
                      row.roundRank === 1
                        ? 'rank-first'
                        : row.roundRank === 2
                        ? 'rank-second'
                        : row.roundRank === 3
                        ? 'rank-third'
                        : '';

                    return (
                      <tr key={row.team.id} className={`standings-row ${rankClass}`}>
                        <td>
                          <div className={`rank-indicator ${rankClass}`}>
                            {row.roundRank === 1
                              ? '🥇 1st'
                              : row.roundRank === 2
                              ? '🥈 2nd'
                              : row.roundRank === 3
                              ? '🥉 3rd'
                              : `${row.roundRank}th`}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TeamBadge
                              logoUrl={row.team.logoUrl}
                              name={row.team.name}
                              tag={row.team.tag}
                              color={row.team.avatarColor}
                              size={32}
                            />
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
                          {row.placement > 0 ? (
                            <span className={`placement-badge place-${row.placement}`}>
                              {row.placement === 1
                                ? '👑 1st'
                                : row.placement === 2
                                ? '2nd'
                                : row.placement === 3
                                ? '3rd'
                                : `${row.placement}th`}
                            </span>
                          ) : (
                            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>-</span>
                          )}
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
                    );
                  })}
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
              <span className="meta-val">{teams.length || settings.totalTeams} Teams • 4 Rounds</span>
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
                <th className="col-rank">PLACEMENT</th>
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
                        <TeamBadge
                          logoUrl={row.team.logoUrl}
                          name={row.team.name}
                          tag={row.team.tag}
                          color={row.team.avatarColor}
                          size={30}
                          className="print-team-logo"
                        />
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
                          {mRes && (mRes.placement > 0 || mRes.kills > 0 || mRes.totalPoints > 0) ? (
                            <div className="print-match-cell">
                              <span className="print-match-total">{mRes.totalPoints}</span>
                              <span className="print-match-breakdown">
                                {mRes.placement > 0 ? `#${mRes.placement} • ` : ''}{mRes.kills}k
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
              <span>
                <strong>Placement Points:</strong> 1st: {settings.placementPoints?.[1] ?? 20} pts | 2nd: {settings.placementPoints?.[2] ?? 15} pts | 3rd: {settings.placementPoints?.[3] ?? 12} pts | 4th: {settings.placementPoints?.[4] ?? 10} pts | 5th: {settings.placementPoints?.[5] ?? 8} pts | 6th: {settings.placementPoints?.[6] ?? 6} pts | 7th: {settings.placementPoints?.[7] ?? 4} pts | 8th: {settings.placementPoints?.[8] ?? 2} pts
              </span>
              <span> • </span>
              <span><strong>Kill Points:</strong> +{settings.pointsPerKill || 1} pt/kill</span>
              <span> • </span>
              <span><strong>Total:</strong> Placement Pts + Kill Pts (± Team Adjustments)</span>
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
