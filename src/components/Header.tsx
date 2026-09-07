import React from 'react';
import { TournamentSettings, Round } from '../types/tournament';
import { Users, Printer, Code, Maximize2, RefreshCw, Trophy, Eye, EyeOff } from 'lucide-react';

interface HeaderProps {
  settings: TournamentSettings;
  rounds: Round[];
  activeRoundIndex: number | 'all';
  participantCount: number;
  isViewOnly?: boolean;
  onToggleViewOnly?: () => void;
  onSelectRound: (roundIndex: number | 'all') => void;
  onOpenParticipantsModal: () => void;
  onOpenExportModal: () => void;
  onOpenSettingsModal: () => void;
  onResetBracket: () => void;
  onToggleFullscreen: () => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  rounds,
  activeRoundIndex,
  participantCount,
  isViewOnly = false,
  onToggleViewOnly,
  onSelectRound,
  onOpenParticipantsModal,
  onOpenExportModal,
  onOpenSettingsModal,
  onResetBracket,
  onToggleFullscreen,
  onPrint,
}) => {
  return (
    <header className="app-header">
      {/* Brand & Tournament Info */}
      <div className="brand-section">
        <div
          className="brand-logo-container"
          onClick={!isViewOnly ? onOpenSettingsModal : undefined}
          title={isViewOnly ? settings.title : 'Click to edit tournament logo and details'}
          style={{ cursor: isViewOnly ? 'default' : 'pointer' }}
        >
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo"
              style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }}
            />
          ) : (
            <Trophy color="#ffffff" size={24} />
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-title-input">{settings.title}</span>
            {isViewOnly && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Spectator View
              </span>
            )}
          </div>
          <p className="brand-subtitle">{settings.subtitle}</p>
        </div>
      </div>

      {/* Round Filter Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeRoundIndex === 'all' ? 'active' : ''}`}
          onClick={() => onSelectRound('all')}
        >
          All Rounds
        </button>
        {rounds.map((round) => (
          <button
            key={round.index}
            className={`tab-btn ${activeRoundIndex === round.index ? 'active' : ''}`}
            onClick={() => onSelectRound(round.index)}
          >
            {round.name}
          </button>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="header-actions">
        <div className="live-badge">
          <span className="live-dot"></span>
          {settings.statusBadge}
        </div>

        {onToggleViewOnly && (
          <button
            className={`icon-btn ${isViewOnly ? 'primary' : ''}`}
            onClick={onToggleViewOnly}
            title={isViewOnly ? 'Switch to Edit Mode' : 'Switch to Spectator / View Only Mode'}
          >
            {isViewOnly ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{isViewOnly ? 'Edit Mode' : 'View Only'}</span>
          </button>
        )}

        {!isViewOnly && (
          <button className="icon-btn primary" onClick={onOpenParticipantsModal}>
            <Users size={16} />
            <span>Teams ({participantCount})</span>
          </button>
        )}

        <button className="icon-btn" onClick={onToggleFullscreen} title="Fullscreen View">
          <Maximize2 size={16} />
        </button>

        <button className="icon-btn" onClick={onPrint} title="Print Bracket">
          <Printer size={16} />
        </button>

        <button className="icon-btn" onClick={onOpenExportModal} title="Share & Embed">
          <Code size={16} />
        </button>

        {!isViewOnly && (
          <button className="icon-btn" onClick={onResetBracket} title="Reset Scores">
            <RefreshCw size={16} />
          </button>
        )}
      </div>
    </header>
  );
};
