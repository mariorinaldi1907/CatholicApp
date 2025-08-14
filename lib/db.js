import * as SQLite from 'expo-sqlite';

// Open (or create) the DB once
let _db;
export async function getDb() {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('fiat.db');
  return _db;
}

// Run first-time migrations
export async function migrate() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS moods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE,       -- YYYY-MM-DD
      score INTEGER NOT NULL, -- 1..5
      note TEXT               -- optional
    );
  `);
  await db.execAsync(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
  `);
}

// Upsert today's mood
export async function upsertMood({ date, score, note }) {
  const db = await getDb();
  // UNIQUE(date) lets us replace the same day if user edits
  await db.runAsync(
    'INSERT OR REPLACE INTO moods(date, score, note) VALUES (?,?,?)',
    [date, score, note ?? null]
  );
}

// Read today's mood
export async function getTodayMood(date) {
  const db = await getDb();
  return await db.getFirstAsync(
    'SELECT id, date, score, note FROM moods WHERE date = ?',
    [date]
  );
}

// Recent moods (for future charts)
export async function getRecentMoods(limit = 30) {
  const db = await getDb();
  return await db.getAllAsync(
    `SELECT date, score FROM moods ORDER BY date DESC LIMIT ?`,
    [limit]
  );
}

export async function createEntry({ title, body }) {
  const db = await getDb();
  const created_at = new Date().toISOString();
  const res = await db.runAsync(
    'INSERT INTO entries (created_at, title, body) VALUES (?,?,?)',
    [created_at, title, body ?? null]
  );
  return { id: res.lastInsertRowId, created_at, title, body: body ?? null };
}

export async function updateEntry(id, { title, body }) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE entries SET title = ?, body = ? WHERE id = ?',
    [title, body ?? null, id]
  );
}

export async function deleteEntry(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
}

export async function getEntry(id) {
  const db = await getDb();
  return await db.getFirstAsync(
    'SELECT id, created_at, title, body FROM entries WHERE id = ?',
    [id]
  );
}

export async function listEntries(limit = 100) {
  const db = await getDb();
  return await db.getAllAsync(
    'SELECT id, created_at, title, body FROM entries ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
}