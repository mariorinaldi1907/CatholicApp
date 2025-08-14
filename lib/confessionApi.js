// lib/confessionApi.js
import { supabase } from './supabase';

/** Format: YYYY-MM-DD -> Date object (or null) */
export function parseDateInput(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format Date as YYYY-MM-DD (local-safe) */
export function fmtDateYYYYMMDD(d) {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** List recent confessions (newest first) */
export async function listConfessions(limit = 100) {
  const { data, error } = await supabase
    .from('confessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Create a confession row for the current user */
export async function createConfession({ planned_date, notes_before }) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user_id = userData?.user?.id;
  if (!user_id) throw new Error('Not signed in');

  const payload = {
    user_id,
    planned_date: planned_date || null,
    notes_before: notes_before || null,
  };

  const { data, error } = await supabase
    .from('confessions')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Get one by id */
export async function getConfession(id) {
  const { data, error } = await supabase
    .from('confessions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/** Update fields (planned_date, notes_before, notes_after) */
export async function updateConfession(id, patch) {
  const { data, error } = await supabase
    .from('confessions')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Mark as confessed now (or pass a specific datetime) */
export async function markConfessed(id, notes_after, at = new Date()) {
  const { data, error } = await supabase
    .from('confessions')
    .update({ confessed_at: at.toISOString(), notes_after: notes_after ?? null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Delete */
export async function deleteConfession(id) {
  const { error } = await supabase
    .from('confessions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}