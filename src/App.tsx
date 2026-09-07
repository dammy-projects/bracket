import React, { useState, useEffect } from 'react';
import { Participant, Match, TournamentSettings, Tournament } from './types/tournament';
import { INITIAL_SETTINGS, INITIAL_PARTICIPANTS } from './utils/defaultData';
import { generateBracket, setMatchWinner, getRoundNames } from './utils/bracketGenerator';
import { safeSetLocalStorage } from './utils/imageCompressor';
import { isSupabaseConfigured } from './lib/supabase';
import {
  saveTournamentToCloud,
  fetchTournamentFromCloud,
  subscribeToTournamentRealtime,
} from './services/supabaseService';
import { Header } from './components/Header';
import { BracketCanvas } from './components/BracketCanvas';
import { ParticipantManagerModal } from './components/ParticipantManagerModal';
import { MatchScoreModal } from './components/MatchScoreModal';
import { WinnerCelebrationModal } from './components/WinnerCelebrationModal';
import { ExportShareModal } from './components/ExportShareModal';
import { TournamentSettingsModal } from './components/TournamentSettingsModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { AdminLoginModal } from './components/AdminLoginModal';

export const App: React.FC = () => {
  const tournamentId = 't_current';

  const [settings, setSettings] = useState<TournamentSettings>(() => {
    const saved = localStorage.getItem('bracket_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem('bracket_participants');
    return saved ? JSON.parse(saved) : INITIAL_PARTICIPANTS;
  });

  const sanitizeMatches = (rawMatches: Match[], currentSettings: TournamentSettings): Match[] => {
    return rawMatches.map((m) => {
      if (m.id === 'm_3rd_place' || m.isThirdPlaceMatch) {
        return {
          ...m,
          isThirdPlaceMatch: true,
          bestOf: currentSettings.thirdPlaceBestOf ?? 3,
        };
      }
      return m;
    });
  };

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('bracket_matches');
    if (saved) {
      const parsed: Match[] = JSON.parse(saved);
      return sanitizeMatches(parsed, settings);
    }
    return generateBracket(INITIAL_PARTICIPANTS, INITIAL_SETTINGS);
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('bracket_admin_auth') === 'true';
  });

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  const isUrlViewOnly = (() => {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('view') === 'readonly' ||
      params.get('mode') === 'view' ||
      params.get('view') === 'true'
    );
  })();

  const isViewOnly = isUrlViewOnly || !isAdmin;

  const handleAdminLogin = (inputPasscode: string): boolean => {
    const expectedPasscode = settings.adminPasscode || 'admin123';
    if (inputPasscode === expectedPasscode) {
      setIsAdmin(true);
      sessionStorage.setItem('bracket_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('bracket_admin_auth');
  };

  const [activeRoundIndex, setActiveRoundIndex] = useState<number | 'all'>('all');
  const [highlightedParticipantId, setHighlightedParticipantId] = useState<string | null>(null);

  // Modals state
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);

  const [champion, setChampion] = useState<Participant | null>(null);
  const [isWinnerOpen, setIsWinnerOpen] = useState(false);

  const isCloudConnected = isSupabaseConfigured();

  // Sync to localStorage safely
  useEffect(() => {
    safeSetLocalStorage('bracket_settings', settings);
  }, [settings]);

  useEffect(() => {
    safeSetLocalStorage('bracket_participants', participants);
  }, [participants]);

  useEffect(() => {
    safeSetLocalStorage('bracket_matches', matches);
  }, [matches]);

  // Realtime subscription setup
  useEffect(() => {
    if (isCloudConnected) {
      const unsubscribe = subscribeToTournamentRealtime(tournamentId, async () => {
        const cloud = await fetchTournamentFromCloud(tournamentId);
        if (cloud) {
          setMatches(sanitizeMatches(cloud.matches, cloud.settings));
          setParticipants(cloud.participants);
          setSettings(cloud.settings);
        }
      });
      return () => unsubscribe();
    }
  }, [isCloudConnected]);

  const fullTournamentData: Tournament = {
    id: tournamentId,
    settings,
    participants,
    matches,
    activeRoundIndex,
    highlightedParticipantId,
  };

  const autoSyncCloud = (updatedTournament: Tournament) => {
    if (isCloudConnected) {
      saveTournamentToCloud(updatedTournament);
    }
  };

  // Handle participant updates
  const handleUpdateParticipants = (newParticipants: Participant[]) => {
    setParticipants(newParticipants);
    const newMatches = generateBracket(newParticipants, settings);
    setMatches(newMatches);
    autoSyncCloud({ ...fullTournamentData, participants: newParticipants, matches: newMatches });
  };

  // Handle settings update (e.g. changing series rules)
  const handleSaveSettings = (newSettings: TournamentSettings) => {
    setSettings(newSettings);
    const newMatches = generateBracket(participants, newSettings);
    setMatches(newMatches);
    autoSyncCloud({ ...fullTournamentData, settings: newSettings, matches: newMatches });
  };

  // Handle Match Selection / Score update
  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setIsMatchModalOpen(true);
  };

  const handleSaveScore = (
    matchId: string,
    winnerId: string | null,
    score1: number | null,
    score2: number | null
  ) => {
    const updatedMatches = setMatchWinner(matches, matchId, winnerId, score1, score2);
    setMatches(updatedMatches);
    autoSyncCloud({ ...fullTournamentData, matches: updatedMatches });

    // Check if final match has a winner
    const maxRoundIndex = Math.max(...updatedMatches.map((m) => m.roundIndex));
    const finalMatch = updatedMatches.find(
      (m) => m.roundIndex === maxRoundIndex && !m.isThirdPlaceMatch
    );

    if (finalMatch && finalMatch.winnerId) {
      const champ = participants.find((p) => p.id === finalMatch.winnerId) || null;
      if (champ) {
        setChampion(champ);
        setIsWinnerOpen(true);
      }
    }
  };

  // Reset bracket
  const handleResetBracket = () => {
    if (window.confirm('Reset all match scores and progress?')) {
      const reset = generateBracket(participants, settings);
      setMatches(reset);
      setChampion(null);
      autoSyncCloud({ ...fullTournamentData, matches: reset });
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handlePrint = () => {
    setActiveRoundIndex('all');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleImportJson = (data: Tournament) => {
    const newSettings = data.settings || settings;
    if (data.settings) setSettings(data.settings);
    if (data.participants) setParticipants(data.participants);
    if (data.matches) setMatches(sanitizeMatches(data.matches, newSettings));
    autoSyncCloud(data);
  };

  const handleLoadCloudTournament = (cloudData: Tournament) => {
    setSettings(cloudData.settings);
    setParticipants(cloudData.participants);
    setMatches(sanitizeMatches(cloudData.matches, cloudData.settings));
  };

  const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.roundIndex)) + 1 : 1;
  const roundNames = getRoundNames(totalRounds);

  return (
    <div className="bracket-workspace">
      {/* Print-Only Header Banner */}
      <div className="print-only-header">
        <div className="print-header-brand">
          {settings.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="print-logo" />
          )}
          <div>
            <h1 className="print-title">{settings.title}</h1>
            {settings.subtitle && <p className="print-subtitle">{settings.subtitle}</p>}
          </div>
        </div>
        <div className="print-meta">
          <span className="print-badge">{settings.statusBadge}</span>
          <span className="print-date">
            {new Date().toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      <Header
        settings={settings}
        rounds={roundNames}
        activeRoundIndex={activeRoundIndex}
        participantCount={participants.length}
        isAdmin={isAdmin}
        onOpenLoginModal={() => setIsAdminLoginOpen(true)}
        onLogout={handleAdminLogout}
        onSelectRound={setActiveRoundIndex}
        onOpenParticipantsModal={() => setIsParticipantsOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onResetBracket={handleResetBracket}
        onToggleFullscreen={handleToggleFullscreen}
        onPrint={handlePrint}
      />

      <BracketCanvas
        matches={matches}
        rounds={roundNames}
        activeRoundIndex={activeRoundIndex}
        highlightedParticipantId={highlightedParticipantId}
        isViewOnly={isViewOnly}
        onSelectMatch={handleSelectMatch}
        onHoverParticipant={setHighlightedParticipantId}
      />

      {/* Modals */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLogin={handleAdminLogin}
      />
      <ParticipantManagerModal
        participants={participants}
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        onUpdateParticipants={handleUpdateParticipants}
      />

      <MatchScoreModal
        match={selectedMatch}
        isOpen={isMatchModalOpen}
        isViewOnly={isViewOnly}
        onClose={() => setIsMatchModalOpen(false)}
        onSaveScore={handleSaveScore}
      />

      <WinnerCelebrationModal
        champion={champion}
        isOpen={isWinnerOpen}
        onClose={() => setIsWinnerOpen(false)}
      />

      <ExportShareModal
        tournament={fullTournamentData}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onImportJson={handleImportJson}
        onPrint={handlePrint}
      />

      <TournamentSettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
      />

      <SupabaseConfigModal
        tournament={fullTournamentData}
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        onLoadCloudTournament={handleLoadCloudTournament}
      />
    </div>
  );
};

export default App;
