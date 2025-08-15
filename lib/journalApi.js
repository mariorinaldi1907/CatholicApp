// lib/journalApi.js
import { supabase } from './supabase';

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const id = data?.user?.id;
  if (!id) throw new Error('Not signed in');
  return id;
}

export async function listEntriesCloud(limit = 200) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, created_at, title, body')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createEntryCloud({ title, body }) {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ user_id, title, body: body ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getEntryCloud(id) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, created_at, title, body')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateEntryCloud(id, patch) {
  const { data, error } = await supabase
    .from('journal_entries')
    .update({ title: patch.title, body: patch.body ?? null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEntryCloud(id) {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}