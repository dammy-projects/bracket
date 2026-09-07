import { getSupabaseClient } from '../lib/supabase';
import { Tournament, Participant, Match } from '../types/tournament';

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
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { error: uploadErr } = await supabase.storage
      .from('logo')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadErr) {
      console.warn('Supabase storage upload warning:', uploadErr.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('logo')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Failed to upload logo image to Supabase:', err);
    return null;
  }
};

export const saveTournamentToCloud = async (tournament: Tournament): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    // 1. Upsert Tournament
    const { error: tourneyErr } = await supabase.from('tournaments').upsert({
      id: tournament.id,
      title: tournament.settings.title,
      subtitle: tournament.settings.subtitle,
      logo_url: tournament.settings.logoUrl,
      bracket_type: tournament.settings.bracketType,
      best_of: tournament.settings.finalsBestOf || 7,
      status_badge: tournament.settings.statusBadge,
      updated_at: new Date().toISOString(),
    });

    if (tourneyErr) throw tourneyErr;

    // 2. Upsert Participants
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
