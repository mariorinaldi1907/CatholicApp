// lib/moodsApi.js
import { supabase } from './supabase';

/**
 * Upsert one mood for the logged-in user for a given date.
 * Enforced unique(user_id, date) at DB-level.
 */
export async function upsertMoodCloud({ date, score, note }) {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) throw new Error('Not signed in');

  const user_id = authData.user.id;

  const { error } = await supabase
    .from('moods')
    .upsert({ user_id, date, score, note }, { onConflict: 'user_id,date' });

  if (error) throw error;
}

/** Get today’s mood for the logged-in user */
export async function getTodayMoodCloud(date) {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) throw new Error('Not signed in');

  const user_id = authData.user.id;

  const { data, error } = await supabase
    .from('moods')
    .select('id, date, score, note, created_at, updated_at')
    .eq('user_id', user_id)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data; // could be null if none yet
}

/** List last N days for the logged-in user (for Trends) */
export async function listMoodsCloud({ days = 30 }) {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) throw new Error('Not signed in');

  const user_id = authData.user.id;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('moods')
    .select('date, score, note')
    .eq('user_id', user_id)
    .gte('date', since.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}