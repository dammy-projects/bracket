import { getSupabaseClient } from '../lib/supabase';
import { Tournament, Participant, Match } from '../types/tournament';
import { CodmTournamentSettings, CodmTeam, CodmRound, CodmPlayer, CodmMatchResult } from '../types/codm';

/**
 * Upload logo file directly to Supabase Storage bucket 'logo'
 */
export const uploadLogoToSupabaseStorage = async (
  file: File,
  prefix: string = 'logo'
): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { error: uploadErr } = await supabase.storage
      .from('logo')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadErr) {
      console.warn('Supabase storage upload notice (falling back to database storage):', uploadErr.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('logo')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Failed to upload logo image to Supabase storage, using direct storage:', err);
    return null;
  }
};

// ============================================================================
// BRACKET TOURNAMENT CLOUD SYNC
// ============================================================================

export const saveTournamentToCloud = async (tournament: Tournament): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    // 1. Upsert Tournament
    const { error: tourneyErr } = await supabase.from('tournaments').upsert({
      id: tournament.id,
      title: tournament.settings.title,
      subtitle: tournament.settings.subtitle,
      logo_url: tournament.settings.logoUrl || null,
      bracket_type: tournament.settings.bracketType,
      best_of: tournament.settings.finalsBestOf || 7,
      status_badge: tournament.settings.statusBadge,
      updated_at: new Date().toISOString(),
    });

    if (tourneyErr) throw tourneyErr;

    // 2. Upsert Participants and prune deleted ones
    if (tournament.participants.length > 0) {
      const pRows = tournament.participants.map((p) => ({
        id: p.id,
        tournament_id: tournament.id,
        name: p.name,
        tag: p.tag || null,
        seed: p.seed,
        logo_url: p.logoUrl || null,
        avatar_color: p.avatarColor || null,
        avatar_icon: p.avatarIcon || null,
      }));

      const { error: pErr } = await supabase.from('participants').upsert(pRows);
      if (pErr) throw pErr;

      // Clean up participants no longer in tournament
      const currentIds = tournament.participants.map((p) => p.id);
      const { data: existing } = await supabase
        .from('participants')
        .select('id')
        .eq('tournament_id', tournament.id);

      if (existing) {
        const toDelete = existing.filter((row) => !currentIds.includes(row.id)).map((r) => r.id);
        if (toDelete.length > 0) {
          await supabase.from('participants').delete().in('id', toDelete);
        }
      }
    }

    // 3. Upsert Matches
    if (tournament.matches.length > 0) {
      const mRows = tournament.matches.map((m) => ({
        id: m.id,
        tournament_id: tournament.id,
        round_index: m.roundIndex,
        match_number: m.matchNumber,
        participant1_id: m.participant1?.id || null,
        participant2_id: m.participant2?.id || null,
        score1: m.score1,
        score2: m.score2,
        winner_id: m.winnerId,
        next_match_id: m.nextMatchId,
        next_match_slot: m.nextMatchSlot,
        status: m.status,
        updated_at: new Date().toISOString(),
      }));

      const { error: mErr } = await supabase.from('matches').upsert(mRows);
      if (mErr) throw mErr;
    }

    return true;
  } catch (err) {
    console.error('Error saving tournament to Supabase:', err);
    return false;
  }
};

export const fetchTournamentFromCloud = async (
  tournamentId: string
): Promise<Tournament | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: tourney, error: tErr } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tErr || !tourney) return null;

    const { data: pData } = await supabase
      .from('participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true });

    const { data: mData } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId);

    const participants: Participant[] = (pData || []).map((p) => ({
      id: p.id,
      name: p.name,
      tag: p.tag || undefined,
      seed: p.seed,
      logoUrl: p.logo_url || undefined,
      avatarColor: p.avatar_color || undefined,
      avatarIcon: p.avatar_icon || undefined,
    }));

    const pMap = new Map<string, Participant>();
    participants.forEach((p) => pMap.set(p.id, p));

    const matches: Match[] = (mData || []).map((m) => {
      const isThird = m.id === 'm_3rd_place';
      return {
        id: m.id,
        roundIndex: m.round_index,
        matchNumber: m.match_number,
        participant1: m.participant1_id ? pMap.get(m.participant1_id) || null : null,
        participant2: m.participant2_id ? pMap.get(m.participant2_id) || null : null,
        score1: m.score1,
        score2: m.score2,
        winnerId: m.winner_id,
        nextMatchId: m.next_match_id,
        nextMatchSlot: m.next_match_slot,
        status: m.status,
        isThirdPlaceMatch: isThird,
        bestOf: isThird ? 3 : (m.round_index === 0 ? 3 : m.round_index === 1 ? 5 : 7),
      };
    });

    return {
      id: tourney.id,
      settings: {
        title: tourney.title,
        subtitle: tourney.subtitle || '',
        logoUrl: tourney.logo_url || '',
        bracketType: tourney.bracket_type || 'single_elimination',
        hasThirdPlaceMatch: true,
        quarterfinalsBestOf: 3,
        semifinalsBestOf: 5,
        finalsBestOf: 7,
        thirdPlaceBestOf: 3,
        statusBadge: tourney.status_badge || 'LIVE',
      },
      participants,
      matches,
      activeRoundIndex: 'all',
      highlightedParticipantId: null,
    };
  } catch (err) {
    console.error('Error fetching tournament from Supabase:', err);
    return null;
  }
};

export const subscribeToTournamentRealtime = (
  tournamentId: string,
  onUpdate: () => void
) => {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`tournament:${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      () => {
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      () => {
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tournaments',
        filter: `id=eq.${tournamentId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// ============================================================================
// CODM BATTLE ROYALE TOURNAMENT CLOUD SYNC
// ============================================================================

export const saveCodmTournamentToCloud = async (
  settings: CodmTournamentSettings,
  teams: CodmTeam[],
  rounds: CodmRound[]
): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const tournamentId = 't_codm';

  try {
    // 1. Upsert CODM Tournament in 'tournaments' table
    const { error: tourneyErr } = await supabase.from('tournaments').upsert({
      id: tournamentId,
      title: settings.title,
      subtitle: settings.subtitle,
      logo_url: settings.logoUrl || null,
      bracket_type: 'codm_leaderboard',
      best_of: settings.totalMatches || 4,
      status_badge: settings.statusBadge,
      updated_at: new Date().toISOString(),
    });

    if (tourneyErr) throw tourneyErr;

    // 2. Upsert CODM Teams in 'participants' table (storing 5-player squad in avatar_icon)
    if (teams.length > 0) {
      const teamRows = teams.map((team) => ({
        id: team.id,
        tournament_id: tournamentId,
        name: team.name,
        tag: team.tag || null,
        seed: team.seed,
        logo_url: team.logoUrl || null,
        avatar_color: team.avatarColor || null,
        avatar_icon: JSON.stringify(team.players || []),
      }));

      const { error: teamErr } = await supabase.from('participants').upsert(teamRows);
      if (teamErr) throw teamErr;

      // Clean up teams no longer present
      const currentTeamIds = teams.map((t) => t.id);
      const { data: existingTeams } = await supabase
        .from('participants')
        .select('id')
        .eq('tournament_id', tournamentId);

      if (existingTeams) {
        const toDelete = existingTeams.filter((r) => !currentTeamIds.includes(r.id)).map((r) => r.id);
        if (toDelete.length > 0) {
          await supabase.from('participants').delete().in('id', toDelete);
        }
      }
    }

    // 3. Upsert CODM Rounds in 'matches' table (storing results in winner_id)
    if (rounds.length > 0) {
      const roundRows = rounds.map((round) => ({
        id: `codm_r_${round.roundNumber}`,
        tournament_id: tournamentId,
        round_index: round.roundNumber,
        match_number: round.roundNumber,
        status: round.status,
        next_match_slot: round.lobbyType || 'Online Custom Lobby',
        next_match_id: round.map || 'Isolated',
        winner_id: JSON.stringify(round.results || {}),
        updated_at: new Date().toISOString(),
      }));

      const { error: rErr } = await supabase.from('matches').upsert(roundRows);
      if (rErr) throw rErr;
    }

    return true;
  } catch (err) {
    console.error('Error saving CODM tournament to Supabase:', err);
    return false;
  }
};

export const fetchCodmTournamentFromCloud = async (): Promise<{
  settings: CodmTournamentSettings;
  teams: CodmTeam[];
  rounds: CodmRound[];
} | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const tournamentId = 't_codm';

  try {
    const { data: tourney, error: tErr } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tErr || !tourney) return null;

    const { data: pData } = await supabase
      .from('participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true });

    const { data: mData } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round_index', { ascending: true });

    const teams: CodmTeam[] = (pData || []).map((p) => {
      let players: CodmPlayer[] = [];
      try {
        if (p.avatar_icon) {
          players = JSON.parse(p.avatar_icon);
        }
      } catch {
        players = [];
      }

      // Ensure 5 slots exist
      while (players.length < 5) {
        const idx = players.length;
        players.push({
          id: `p_${p.id}_${idx + 1}`,
          name: `Player ${idx + 1}`,
          ign: '',
          role: idx === 4 ? 'reserve' : 'main',
        });
      }

      return {
        id: p.id,
        name: p.name,
        tag: p.tag || undefined,
        seed: p.seed,
        logoUrl: p.logo_url || undefined,
        avatarColor: p.avatar_color || undefined,
        players,
      };
    });

    const rounds: CodmRound[] = (mData || []).map((m) => {
      let results: Record<string, CodmMatchResult> = {};
      try {
        if (m.winner_id) {
          results = JSON.parse(m.winner_id);
        }
      } catch {
        results = {};
      }

      return {
        roundNumber: m.round_index,
        name: `Match ${m.round_index}`,
        lobbyType: m.next_match_slot || 'Online Custom Lobby',
        map: m.next_match_id || 'Isolated',
        status: (m.status as 'scheduled' | 'live' | 'completed') || 'scheduled',
        results,
      };
    });

    const settings: CodmTournamentSettings = {
      title: tourney.title || 'CALL OF DUTY: MOBILE – BATTLE ROYALE',
      subtitle: tourney.subtitle || 'Squad Mode • 8 Teams • 4 Rounds • Online Custom Lobby',
      gameMode: 'Battle Royale – Squad',
      totalMatches: tourney.best_of || 4,
      totalTeams: teams.length || 8,
      statusBadge: (tourney.status_badge as 'LIVE' | 'UPCOMING' | 'COMPLETED') || 'LIVE',
      logoUrl: tourney.logo_url || '',
      dateText: 'TBA',
      pointsPerKill: 1,
      adminPasscode: 'admin123',
    };

    return { settings, teams, rounds };
  } catch (err) {
    console.error('Error fetching CODM tournament from Supabase:', err);
    return null;
  }
};

export const subscribeToCodmRealtime = (onUpdate: () => void) => {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const tournamentId = 't_codm';

  const channel = supabase
    .channel(`codm:${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      () => {
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      () => {
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tournaments',
        filter: `id=eq.${tournamentId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
