import React from 'react';
import { Match, Participant } from '../types/tournament';
import { Trophy, Award } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  highlightedParticipantId: string | null;
  onSelectMatch: (match: Match) => void;
  onHoverParticipant: (id: string | null) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  highlightedParticipantId,
  onSelectMatch,
  onHoverParticipant,
}) => {
  const isWinnerMatch = match.roundIndex > 0 && match.winnerId !== null;

  const renderParticipantRow = (
    participant: Participant | null,
    score: number | null,
    isWinner: boolean
  ) => {
    const isHighlighted =
      participant && participant.id === highlightedParticipantId;

    return (
      <div
        className={`participant-row ${isWinner ? 'winner' : ''}`}
        onMouseEnter={() => participant && onHoverParticipant(participant.id)}
        onMouseLeave={() => onHoverParticipant(null)}
      >
        <div className="participant-info">
          {participant ? (
            <>
              <span className="seed-badge">{participant.seed}</span>
              {participant.logoUrl ? (
                <img
                  src={participant.logoUrl}
                  alt={participant.name}
                  className="team-logo"
                />
              ) : (
                <span
                  className="team-logo"
                  style={{
                    backgroundColor: participant.avatarColor || '#3b82f6',
                  }}
                >
                  {participant.avatarIcon || '🏆'}
                </span>
              )}
              <div className="participant-name-container">
                <span
                  className="participant-name"
                  style={{
                    color: isHighlighted ? '#60a5fa' : undefined,
                  }}
                >
                  {participant.name}
                </span>
                {participant.tag && (
                  <span className="participant-tag">- {participant.tag}</span>
                )}
              </div>
            </>
          ) : (
            <span className="placeholder-text">TBD</span>
          )}
        </div>

        {score !== null && score !== undefined && (
          <span className={`score-badge ${isWinner ? 'winner-score' : ''}`}>
            {score}
          </span>
        )}
        {isWinner && score === null && (
          <Trophy size={14} className="text-yellow-400" />
        )}
      </div>
    );
  };

  const p1IsWinner = match.winnerId && match.participant1?.id === match.winnerId;
  const p2IsWinner = match.winnerId && match.participant2?.id === match.winnerId;
  const isThirdPlaceMatch = match.isThirdPlaceMatch || match.id === 'm_3rd_place';

  const isCardHighlighted =
    (match.participant1 && match.participant1.id === highlightedParticipantId) ||
    (match.participant2 && match.participant2.id === highlightedParticipantId);

  return (
    <div className="match-wrapper" id={`match-${match.id}`}>
      <span className="match-number">{match.matchNumber}</span>
      <div
        className={`match-card ${isCardHighlighted ? 'highlighted' : ''} ${
          isWinnerMatch ? 'is-winner' : ''
        } ${isThirdPlaceMatch ? 'third-place-card' : ''}`}
        onClick={() => onSelectMatch(match)}
        title={`Click to set score (Best of ${match.bestOf || 3})`}
      >
        {/* Series Badge Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '2px 8px',
            background: isThirdPlaceMatch
              ? 'rgba(217, 119, 6, 0.2)'
              : 'rgba(255, 255, 255, 0.04)',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: isThirdPlaceMatch ? '#fbbf24' : '#9ca3af',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <span>
            {isThirdPlaceMatch ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Award size={11} color="#fbbf24" /> 3rd Place Match
              </span>
            ) : (
              `Match #${match.matchNumber}`
            )}
          </span>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1px 5px',
              borderRadius: '4px',
            }}
          >
            Bo{match.bestOf || 3}
          </span>
        </div>

        {renderParticipantRow(match.participant1, match.score1, Boolean(p1IsWinner))}
        {renderParticipantRow(match.participant2, match.score2, Boolean(p2IsWinner))}
      </div>
    </div>
  );
};
