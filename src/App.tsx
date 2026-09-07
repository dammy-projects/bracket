import React, { useState, useEffect } from 'react';
import { Participant, Match, TournamentSettings, Tournament } from './types/tournament';
import { CodmTournamentSettings, CodmTeam, CodmRound } from './types/codm';
import { INITIAL_SETTINGS, INITIAL_PARTICIPANTS } from './utils/defaultData';
import {
  INITIAL_CODM_SETTINGS,
  INITIAL_CODM_TEAMS,
  INITIAL_CODM_ROUNDS,
} from './utils/codmDefaultData';
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
import { CodmLeaderboard } from './components/codm/CodmLeaderboard';
import { CodmScoreModal } from './components/codm/CodmScoreModal';
import { CodmTeamManagerModal } from './components/codm/CodmTeamManagerModal';
import { CodmRulesModal } from './components/codm/CodmRulesModal';

export const App: React.FC = () => {
  const tournamentId = 't_current';

  // Tournament Game Mode: 'bracket' (Knockout) or 'codm' (Points Leaderboard)
  const [tournamentMode, setTournamentMode] = useState<'bracket' | 'codm'>(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('game');
    if (modeParam === 'codm' || modeParam === 'br') return 'codm';
    if (modeParam === 'bracket') return 'bracket';
    const saved = localStorage.getItem('tournament_mode');
    return (saved as 'bracket' | 'codm') || 'codm';
  });

  const [settings, setSettings] = useState<TournamentSettings>(() => {
    const saved = localStorage.getItem('bracket_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem('bracket_participants');
    return saved ? JSON.parse(saved) : INITIAL_PARTICIPANTS;
  });

  // CODM Battle Royale State
  const [codmSettings, setCodmSettings] = useState<CodmTournamentSettings>(() => {
    const saved = localStorage.getItem('codm_settings');
    if (!saved) return INITIAL_CODM_SETTINGS;
    try {
      const parsed: CodmTournamentSettings = JSON.parse(saved);
      if (parsed.totalTeams === 7) {
        parsed.totalTeams = 8;
        if (parsed.subtitle && parsed.subtitle.includes('7 Teams')) {
          parsed.subtitle = parsed.subtitle.replace('7 Teams', '8 Teams');
        }
        safeSetLocalStorage('codm_settings', parsed);
      }
      return parsed;
    } catch {
      return INITIAL_CODM_SETTINGS;
    }
  });

  const [codmTeams, setCodmTeams] = useState<CodmTeam[]>(() => {
    const saved = localStorage.getItem('codm_teams');
    if (!saved) return INITIAL_CODM_TEAMS;
    try {
      const parsed: CodmTeam[] = JSON.parse(saved);
      const hasTechPython = parsed.some(
        (t) =>
          t.id === 'ct_8' ||
          t.name.toLowerCase().includes('python') ||
          t.tag?.toUpperCase() === 'BSIT'
      );
      if (!hasTechPython) {
        const pythonTeam = INITIAL_CODM_TEAMS.find((t) => t.id === 'ct_8') || {
          id: 'ct_8',
          name: 'Tech Python',
          tag: 'BSIT',
          seed: 8,
          avatarColor: '#10b981',
          avatarIcon: '🐍',
          players: [
            { id: 'p_8_1', name: 'Player 1', ign: 'BSIT-Python', role: 'main' as const },
            { id: 'p_8_2', name: 'Player 2', ign: 'BSIT-Byte', role: 'main' as const },
            { id: 'p_8_3', name: 'Player 3', ign: 'BSIT-Cipher', role: 'main' as const },
            { id: 'p_8_4', name: 'Player 4', ign: 'BSIT-Glitch', role: 'main' as const },
            { id: 'p_8_5', name: 'Player 5 (Sub)', ign: 'BSIT-Reserve', role: 'reserve' as const },
          ],
        };
        const updated = [...parsed, pythonTeam];
        safeSetLocalStorage('codm_teams', updated);
        return updated;
      }
      return parsed;
    } catch {
      return INITIAL_CODM_TEAMS;
    }
  });

  const [codmRounds, setCodmRounds] = useState<CodmRound[]>(() => {
    const saved = localStorage.getItem('codm_rounds');
    return saved ? JSON.parse(saved) : INITIAL_CODM_ROUNDS;
  });

  const [codmRoundFilter, setCodmRoundFilter] = useState<number | 'all'>('all');

  // CODM Modals
  const [isCodmRulesOpen, setIsCodmRulesOpen] = useState(false);
  const [isCodmTeamManagerOpen, setIsCodmTeamManagerOpen] = useState(false);
  const [selectedCodmRoundNum, setSelectedCodmRoundNum] = useState<number | null>(null);

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
    const expectedPasscode =
      tournamentMode === 'codm'
        ? codmSettings.adminPasscode || 'admin123'
        : settings.adminPasscode || 'admin123';

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

  // Modals state for bracket
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

  useEffect(() => {
    safeSetLocalStorage('codm_settings', codmSettings);
  }, [codmSettings]);

  useEffect(() => {
    safeSetLocalStorage('codm_teams', codmTeams);
  }, [codmTeams]);

  useEffect(() => {
    safeSetLocalStorage('codm_rounds', codmRounds);
  }, [codmRounds]);

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

  // Handle settings update
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

  // Reset general
  const handleResetGeneral = () => {
    if (tournamentMode === 'bracket') {
      if (window.confirm('Reset all match scores and knockout progress?')) {
        const reset = generateBracket(participants, settings);
        setMatches(reset);
        setChampion(null);
        autoSyncCloud({ ...fullTournamentData, matches: reset });
      }
    } else {
      if (window.confirm('Reset all round scores and results for CODM Battle Royale?')) {
        const resetRounds: CodmRound[] = codmRounds.map((r) => ({
          ...r,
          status: 'scheduled',
          results: {},
        }));
        setCodmRounds(resetRounds);
        safeSetLocalStorage('codm_rounds', resetRounds);
      }
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
    if (tournamentMode === 'bracket') {
      setActiveRoundIndex('all');
    } else {
      setCodmRoundFilter('all');
    }
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

  const activeTitle = tournamentMode === 'bracket' ? settings.title : codmSettings.title;
  const activeSubtitle = tournamentMode === 'bracket' ? settings.subtitle : codmSettings.subtitle;
  const activeLogo = tournamentMode === 'bracket' ? settings.logoUrl : (codmSettings.logoUrl || settings.logoUrl);
  const activeBadge = tournamentMode === 'bracket' ? settings.statusBadge : codmSettings.statusBadge;

  return (
    <div className="bracket-workspace">
      {/* Print-Only Header Banner (Used for Knockout Bracket) */}
      {tournamentMode === 'bracket' && (
        <div className="print-only-header">
          <div className="print-header-brand">
            {activeLogo && (
              <img src={activeLogo} alt="Logo" className="print-logo" />
            )}
            <div>
              <h1 className="print-title">{activeTitle}</h1>
              {activeSubtitle && <p className="print-subtitle">{activeSubtitle}</p>}
            </div>
          </div>
          <div className="print-meta">
            <span className="print-badge">{activeBadge}</span>
            <span className="print-date">
              {new Date().toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      )}

      <Header
        settings={
          tournamentMode === 'bracket'
            ? settings
            : {
                ...settings,
                title: codmSettings.title,
                subtitle: codmSettings.subtitle,
                statusBadge: codmSettings.statusBadge,
                logoUrl: codmSettings.logoUrl || settings.logoUrl,
              }
        }
        rounds={roundNames}
        activeRoundIndex={activeRoundIndex}
        participantCount={tournamentMode === 'bracket' ? participants.length : codmTeams.length}
        isAdmin={isAdmin}
        tournamentMode={tournamentMode}
        onSelectTournamentMode={(mode) => {
          setTournamentMode(mode);
          localStorage.setItem('tournament_mode', mode);
        }}
        onOpenLoginModal={() => setIsAdminLoginOpen(true)}
        onLogout={handleAdminLogout}
        onSelectRound={setActiveRoundIndex}
        onOpenParticipantsModal={() => setIsParticipantsOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onResetBracket={handleResetGeneral}
        onToggleFullscreen={handleToggleFullscreen}
        onPrint={handlePrint}
      />

      {/* Main Content: Conditional based on tournamentMode */}
      {tournamentMode === 'bracket' ? (
        <BracketCanvas
          matches={matches}
          rounds={roundNames}
          activeRoundIndex={activeRoundIndex}
          highlightedParticipantId={highlightedParticipantId}
          isViewOnly={isViewOnly}
          onSelectMatch={handleSelectMatch}
          onHoverParticipant={setHighlightedParticipantId}
        />
      ) : (
        <CodmLeaderboard
          settings={codmSettings}
          teams={codmTeams}
          rounds={codmRounds}
          activeRoundFilter={codmRoundFilter}
          isAdmin={isAdmin}
          onSelectRoundFilter={setCodmRoundFilter}
          onOpenScoreModal={(roundNum) => setSelectedCodmRoundNum(roundNum)}
          onOpenTeamManager={() => setIsCodmTeamManagerOpen(true)}
          onOpenRulesModal={() => setIsCodmRulesOpen(true)}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLogin={handleAdminLogin}
      />

      {/* Bracket Specific Modals */}
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

      {/* CODM Specific Modals */}
      <CodmRulesModal
        isOpen={isCodmRulesOpen}
        onClose={() => setIsCodmRulesOpen(false)}
        dateText={codmSettings.dateText}
        totalTeams={codmTeams.length}
      />

      <CodmTeamManagerModal
        teams={codmTeams}
        isOpen={isCodmTeamManagerOpen}
        onClose={() => setIsCodmTeamManagerOpen(false)}
        onUpdateTeams={(updated) => {
          setCodmTeams(updated);
          safeSetLocalStorage('codm_teams', updated);
          setCodmSettings((prev) => {
            const next = {
              ...prev,
              totalTeams: updated.length,
              subtitle: prev.subtitle.replace(/\d+\s*Teams/i, `${updated.length} Teams`),
            };
            safeSetLocalStorage('codm_settings', next);
            return next;
          });
        }}
      />

      <CodmScoreModal
        round={codmRounds.find((r) => r.roundNumber === selectedCodmRoundNum) || null}
        allRounds={codmRounds}
        teams={codmTeams}
        isOpen={selectedCodmRoundNum !== null}
        onClose={() => setSelectedCodmRoundNum(null)}
        onSelectRoundIndex={(num) => setSelectedCodmRoundNum(num)}
        onSaveRoundScores={(updatedRound) => {
          const updated = codmRounds.map((r) =>
            r.roundNumber === updatedRound.roundNumber ? updatedRound : r
          );
          setCodmRounds(updated);
          safeSetLocalStorage('codm_rounds', updated);
        }}
      />
    </div>
  );
};

export default App;

