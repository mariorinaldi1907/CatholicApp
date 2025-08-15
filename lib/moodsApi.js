import { supabase } from './supabase';

/** upsert a mood for the current user+date */
export async function upsertMoodCloud({ date, score, note }) {
  const { data: u, error: ue } = await supabase.auth.getUser();
  if (ue) throw ue;
  const user_id = u?.user?.id;
  if (!user_id) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('moods')
    .upsert(
      [{ user_id, date, score, note: note ?? null }],
      { onConflict: 'user_id,date' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** latest N moods (newest first) */
export async function listMoodsCloud(limit = 120) {
  const { data, error } = await supabase
    .from('moods')
    .select('date, score')
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** today’s mood (or null) */
export async function getTodayMoodCloud(date) {
  const { data, error } = await supabase
    .from('moods')
    .select('date, score, note')
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}