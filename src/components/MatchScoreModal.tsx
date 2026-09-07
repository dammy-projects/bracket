import React, { useState, useEffect } from 'react';
import { Match } from '../types/tournament';
import { X, Trophy, Check, Award } from 'lucide-react';

interface MatchScoreModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveScore: (
    matchId: string,
    winnerId: string | null,
    score1: number | null,
    score2: number | null
  ) => void;
}

export const MatchScoreModal: React.FC<MatchScoreModalProps> = ({
  match,
  isOpen,
  onClose,
  onSaveScore,
}) => {
  const [score1, setScore1] = useState<string>('');
  const [score2, setScore2] = useState<string>('');
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      setScore1(match.score1 !== null && match.score1 !== undefined ? String(match.score1) : '');
      setScore2(match.score2 !== null && match.score2 !== undefined ? String(match.score2) : '');
      setSelectedWinnerId(match.winnerId);
    }
  }, [match]);

  if (!isOpen || !match) return null;

  const { participant1, participant2 } = match;
  const bestOf = match.bestOf || 3;
  const targetWins = Math.ceil(bestOf / 2);

  const handleSelectWinner = (winnerId: string) => {
    setSelectedWinnerId(winnerId);
  };

  const handleSave = () => {
    const s1 = score1 !== '' ? parseInt(score1, 10) : null;
    const s2 = score2 !== '' ? parseInt(score2, 10) : null;

    let autoWinner = selectedWinnerId;
    if (s1 !== null && s2 !== null) {
      if (s1 > s2 && participant1) autoWinner = participant1.id;
      if (s2 > s1 && participant2) autoWinner = participant2.id;
    }

    onSaveScore(match.id, autoWinner, s1, s2);
    onClose();
  };

  const handleClear = () => {
    onSaveScore(match.id, null, null, null);
    onClose();
  };

  const isThirdPlace = match.isThirdPlaceMatch || match.id === 'm_3rd_place';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isThirdPlace ? (
              <Award color="#fbbf24" size={20} />
            ) : (
              <Trophy color="#3b82f6" size={20} />
            )}
            <h3 className="modal-title">
              {isThirdPlace ? '3rd Place Match' : `Match #${match.matchNumber}`}
            </h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Series Rule Badge */}
          <div
            style={{
              background: isThirdPlace ? 'rgba(245, 158, 11, 0.12)' : 'rgba(37, 99, 235, 0.12)',
              border: `1px solid ${isThirdPlace ? 'rgba(245, 158, 11, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`,
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f3f4f6' }}>
              Series Format: <span style={{ color: '#60a5fa' }}>Best of {bestOf}</span>
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '2px 8px',
                borderRadius: '12px',
                color: '#d1d5db',
              }}
            >
              First to {targetWins} Wins
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '16px' }}>
            Enter game scores or click a team to select the series winner:
          </p>

          {/* Participant 1 Option */}
          <div
            className={`participant-item-row ${
              selectedWinnerId === participant1?.id ? 'winner' : ''
            }`}
            style={{
              borderColor: selectedWinnerId === participant1?.id ? '#10b981' : '#2d3342',
              cursor: participant1 ? 'pointer' : 'default',
              padding: '14px',
            }}
            onClick={() => participant1 && handleSelectWinner(participant1.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {participant1 ? (
                <>
                  <span className="seed-badge">{participant1.seed}</span>
                  {participant1.logoUrl ? (
                    <img src={participant1.logoUrl} alt="" className="team-logo" />
                  ) : (
                    <span
                      className="team-logo"
                      style={{ backgroundColor: participant1.avatarColor || '#3b82f6' }}
                    >
                      {participant1.avatarIcon || '🏆'}
                    </span>
                  )}
                  <div>
                    <div style={{ fontWeight: 700 }}>{participant1.name}</div>
                    {participant1.tag && (
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {participant1.tag}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className="placeholder-text">TBD</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {participant1 && (
                <input
                  type="number"
                  min="0"
                  max={targetWins}
                  className="form-input"
                  style={{ width: '60px', textAlign: 'center', fontWeight: 700 }}
                  placeholder="0"
                  value={score1}
                  onChange={(e) => setScore1(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              {selectedWinnerId === participant1?.id && (
                <Check color="#10b981" size={20} />
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '10px 0', color: '#6b7280', fontWeight: 700 }}>
            VS
          </div>

          {/* Participant 2 Option */}
          <div
            className={`participant-item-row ${
              selectedWinnerId === participant2?.id ? 'winner' : ''
            }`}
            style={{
              borderColor: selectedWinnerId === participant2?.id ? '#10b981' : '#2d3342',
              cursor: participant2 ? 'pointer' : 'default',
              padding: '14px',
            }}
            onClick={() => participant2 && handleSelectWinner(participant2.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {participant2 ? (
                <>
                  <span className="seed-badge">{participant2.seed}</span>
                  {participant2.logoUrl ? (
                    <img src={participant2.logoUrl} alt="" className="team-logo" />
                  ) : (
                    <span
                      className="team-logo"
                      style={{ backgroundColor: participant2.avatarColor || '#3b82f6' }}
                    >
                      {participant2.avatarIcon || '🏆'}
                    </span>
                  )}
                  <div>
                    <div style={{ fontWeight: 700 }}>{participant2.name}</div>
                    {participant2.tag && (
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {participant2.tag}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className="placeholder-text">TBD</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {participant2 && (
                <input
                  type="number"
                  min="0"
                  max={targetWins}
                  className="form-input"
                  style={{ width: '60px', textAlign: 'center', fontWeight: 700 }}
                  placeholder="0"
                  value={score2}
                  onChange={(e) => setScore2(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              {selectedWinnerId === participant2?.id && (
                <Check color="#10b981" size={20} />
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="danger-btn" onClick={handleClear}>
            Clear Match
          </button>
          <button className="icon-btn primary" onClick={handleSave}>
            Save & Advance Winner
          </button>
        </div>
      </div>
    </div>
  );
};
