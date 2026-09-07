import React from 'react';
import { X, ShieldAlert, Target, Trophy, Users, BookOpen } from 'lucide-react';
import { CODM_PLACEMENT_POINTS } from '../../types/codm';

interface CodmRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateText?: string;
  totalTeams?: number;
}

export const CodmRulesModal: React.FC<CodmRulesModalProps> = ({
  isOpen,
  onClose,
  dateText = 'TBA',
  totalTeams = 8,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={20} color="#f59e0b" />
            <h3 className="modal-title">CODM Tournament Rules & Guidelines</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', paddingRight: '8px' }}>
          {/* Section A: Team Composition */}
          <div className="rule-card">
            <div className="rule-card-header">
              <Users size={18} color="#3b82f6" />
              <h4>A. TEAM COMPOSITION</h4>
            </div>
            <div className="rule-content">
              <p>Each CODM team must have <strong>5 registered players</strong>:</p>
              <ul className="rule-bullet-list">
                <li><span className="badge-pill main-badge">4</span> <strong>Main Players</strong> (active in squad)</li>
                <li><span className="badge-pill reserve-badge">1</span> <strong>Reserve Player</strong> (5th registered slot)</li>
              </ul>
              <p className="rule-note">
                • The 5th registered player will serve as the team's <strong>Reserve Player</strong>.
                <br />
                • The reserve player may only substitute according to the official tournament substitution rules.
              </p>
            </div>
          </div>

          {/* Section XII: Tournament Format */}
          <div className="rule-card">
            <div className="rule-card-header">
              <Trophy size={18} color="#f59e0b" />
              <h4>XII. CODM TOURNAMENT FORMAT</h4>
            </div>
            <div className="rule-content">
              <div className="format-grid">
                <div className="format-item">
                  <span className="format-label">Date</span>
                  <span className="format-val">{dateText}</span>
                </div>
                <div className="format-item">
                  <span className="format-label">Total Teams</span>
                  <span className="format-val">{totalTeams} Teams</span>
                </div>
                <div className="format-item">
                  <span className="format-label">Game Mode</span>
                  <span className="format-val">Battle Royale – Squad</span>
                </div>
                <div className="format-item">
                  <span className="format-label">Total Matches</span>
                  <span className="format-val">4 Rounds</span>
                </div>
              </div>

              <div className="match-rounds-preview">
                <div className="round-pill-info">
                  <strong>Match 1 & 2:</strong> Online Custom Lobby
                </div>
                <div className="round-pill-info">
                  <strong>Match 3 & 4:</strong> Online Custom Lobby
                </div>
              </div>

              <p className="rule-note" style={{ marginTop: '10px' }}>
                🗺️ <strong>Maps:</strong> The map will be <strong>randomized each round</strong> (e.g., Isolated or Blackout).
                <br />
                📊 A <strong>point-based system</strong> will determine the final standings.
              </p>
            </div>
          </div>

          {/* Section XIII: Scoring System */}
          <div className="rule-card">
            <div className="rule-card-header">
              <Target size={18} color="#10b981" />
              <h4>XIII. CODM SCORING SYSTEM</h4>
            </div>
            <div className="rule-content">
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e5e7eb' }}>
                  Placement Points
                </span>
                <div className="points-table-grid">
                  {Object.entries(CODM_PLACEMENT_POINTS).map(([place, pts]) => (
                    <div key={place} className={`points-cell place-${place}`}>
                      <span className="place-num">
                        {place === '1' ? '🥇 1st' : place === '2' ? '🥈 2nd' : place === '3' ? '🥉 3rd' : `${place}th`}
                      </span>
                      <span className="place-pts">+{pts} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="kill-points-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🎯</span>
                  <div>
                    <strong>Kill Points:</strong> +1 point per kill
                  </div>
                </div>
                <div className="formula-box">
                  <strong>Total Score</strong> = Placement Points + Kill Points
                </div>
              </div>

              <p className="rule-note" style={{ marginTop: '8px' }}>
                Points from all four matches will be added together to determine the final tournament standings.
              </p>
            </div>
          </div>

          {/* Section XIV: Match Rules */}
          <div className="rule-card">
            <div className="rule-card-header">
              <ShieldAlert size={18} color="#ef4444" />
              <h4>XIV. CODM MATCH RULES</h4>
            </div>
            <div className="rule-content">
              <ul className="rule-bullet-list">
                <li>
                  <strong>Online Matches:</strong> Teams must join the official tournament custom lobby <strong>on time</strong>.
                </li>
                <li>
                  <strong>Connectivity:</strong> A stable internet connection is the responsibility of each team. Match delays or disconnects will follow organizer discretion.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="icon-btn primary" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
