import React from 'react';
import { TournamentSettings, Round } from '../types/tournament';
import { Users, Printer, Code, Maximize2, RefreshCw, Trophy, Lock, LogOut, ShieldCheck, Globe, Settings as SettingsIcon } from 'lucide-react';

interface HeaderProps {
  settings: TournamentSettings;
  rounds: Round[];
  activeRoundIndex: number | 'all';
  participantCount: number;
  isAdmin: boolean;
  tournamentMode: 'bracket' | 'codm';
  onSelectTournamentMode: (mode: 'bracket' | 'codm') => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
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
  isAdmin,
  tournamentMode,
  onSelectTournamentMode,
  onOpenLoginModal,
  onLogout,
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
          onClick={isAdmin && tournamentMode === 'bracket' ? onOpenSettingsModal : undefined}
          title={isAdmin ? 'Click to edit tournament details' : settings.title}
          style={{ cursor: isAdmin && tournamentMode === 'bracket' ? 'pointer' : 'default' }}
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
            {isAdmin ? (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={12} /> Admin Mode
              </span>
            ) : (
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Globe size={12} /> Public View
              </span>
            )}
          </div>
          <p className="brand-subtitle">{settings.subtitle}</p>
        </div>
      </div>

      {/* Tournament Game Mode Switcher */}
      <div className="tournament-mode-switcher">
        <button
          type="button"
          className={`mode-toggle-btn ${tournamentMode === 'bracket' ? 'active' : ''}`}
          onClick={() => onSelectTournamentMode('bracket')}
          title="Knockout Single Elimination Bracket"
        >
          <span>⚔️ Knockout Bracket</span>
        </button>
        <button
          type="button"
          className={`mode-toggle-btn ${tournamentMode === 'codm' ? 'active' : ''}`}
          onClick={() => onSelectTournamentMode('codm')}
          title="Call of Duty: Mobile Battle Royale (Points & Leaderboard)"
        >
          <span>🪂 CODM Battle Royale</span>
        </button>
      </div>

      {/* Bracket Round Filter Tabs (Only shown in bracket mode) */}
      {tournamentMode === 'bracket' && (
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
      )}

      {/* Actions Bar */}
      <div className="header-actions">
        <div className="live-badge">
          <span className="live-dot"></span>
          {settings.statusBadge}
        </div>

        {isAdmin ? (
          <>
            {tournamentMode === 'bracket' ? (
              <>
                <button className="icon-btn primary" onClick={onOpenParticipantsModal}>
                  <Users size={16} />
                  <span>Teams ({participantCount})</span>
                </button>

                <button className="icon-btn" onClick={onOpenSettingsModal} title="Tournament Settings">
                  <SettingsIcon size={16} />
                  <span>Settings</span>
                </button>
              </>
            ) : null}
          </>
        ) : (
          <button className="icon-btn primary" onClick={onOpenLoginModal} title="Log in as Organizer Admin">
            <Lock size={16} />
            <span>Admin Login</span>
          </button>
        )}

        <button className="icon-btn" onClick={onToggleFullscreen} title="Fullscreen View">
          <Maximize2 size={16} />
        </button>

        <button className="icon-btn" onClick={onPrint} title="Print / Export PDF">
          <Printer size={16} />
        </button>

        {tournamentMode === 'bracket' && (
          <button className="icon-btn" onClick={onOpenExportModal} title="Share & Embed">
            <Code size={16} />
          </button>
        )}

        {isAdmin && (
          <button className="icon-btn danger" onClick={onResetBracket} title="Reset Scores">
            <RefreshCw size={16} />
          </button>
        )}

        {isAdmin && (
          <button className="icon-btn" onClick={onLogout} title="Log Out Admin Session">
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        )}
      </div>
    </header>
  );
};
