// app/(tabs)/index.js
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getTodayMood, upsertMood } from '../../lib/db';
import { getTodayMoodCloud, upsertMoodCloud } from '../../lib/moodsApi';
import { supabase } from '../../lib/supabase';
import { verseForScore } from '../../services/scripture';

/** ---------------------------
 *  Stable header (memoized)
 *  ---------------------------
 */
const HomeHeader = memo(function HomeHeader({
  score,
  setScore,
  note,
  setNote,
  saved,
  suggestion,
  onSaveMood,
  openShare,
}) {
  return (
    <>
      {/* Soft gradient banner */}
      <LinearGradient
        colors={['#eaf7f1', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <View>
          <Text style={s.hello}>Welcome back</Text>
          <Text style={s.date}>{dayjs().format('ddd, D MMM YYYY')}</Text>
        </View>
        <View style={s.todayPill}><Text style={s.todayPillText}>Today</Text></View>
      </LinearGradient>

      <View style={s.wrap}>
        <Text style={s.h1}>How are you feeling today?</Text>

        {/* Mood Picker */}
        <View style={s.row}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              style={[s.emoji, score === n && s.emojiActive]}
              onPress={() => setScore(n)}
            >
              <Text style={s.big}>{n === 1 ? '😞' : n === 2 ? '😕' : n === 3 ? '😐' : n === 4 ? '🙂' : '😄'}</Text>
              <Text style={s.small}>{n}</Text>
            </Pressable>
          ))}
        </View>

        {/* Note input */}
        <TextInput
          placeholder="Add a note or intention…"
          value={note}
          onChangeText={setNote}
          multiline
          scrollEnabled
          style={s.input}
        />

        <Pressable onPress={onSaveMood} style={s.btn}>
          <Text style={s.btnText}>Save check-in</Text>
        </Pressable>

        {/* Saved info + note card */}
        {saved && (
          <View style={{ gap: 8 }}>
            <Text style={s.subtle}>Saved for {saved.date} • score {saved.score}</Text>
            {!!saved.note && (
              <View style={s.noteCard}>
                <Text style={s.noteTitle}>Your note</Text>
                <Text style={s.noteBody}>{saved.note}</Text>
              </View>
            )}
          </View>
        )}

        {/* Verse Suggestion */}
        {suggestion && (
          <View style={s.card}>
            <Text style={s.cardRef}>{suggestion.ref}</Text>
            <Text style={s.cardText}>{suggestion.text}</Text>
          </View>
        )}

        {/* Board header */}
        <View style={s.boardHeader}>
          <Text style={s.sectionTitle}>📝 Truth & Scripture Board</Text>
          <Pressable style={s.shareButton} onPress={openShare}>
            <Text style={s.shareButtonText}>+ Share</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
});

/** ---------------------------
 *  Home screen
 *  ---------------------------
 */
export default function Home() {
  const [score, setScore] = useState(3);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(null); // {date, score, note}
  const [suggestion, setSuggestion] = useState(null);

  const [truths, setTruths] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTruth, setNewTruth] = useState('');
  const [author, setAuthor] = useState('');

  const today = dayjs().format('YYYY-MM-DD');

  // Load today's mood
 useEffect(() => {
  (async () => {
    try {
      // 1) Try cloud first (per-user)
      const m = await getTodayMoodCloud(today);
      if (m) {
        setSaved({ date: m.date, score: m.score, note: m.note ?? '' });
        setScore(m.score);
        setNote(m.note ?? '');
        setSuggestion(verseForScore(m.score));
        return;
      }
      // 2) Fallback to local cache (optional)
      const local = await getTodayMood(today);
      if (local) {
        setSaved(local);
        setScore(local.score);
        setNote(local.note ?? '');
        setSuggestion(verseForScore(local.score));
      }
    } catch (e) {
      // If not signed in or network issue, use local
      const local = await getTodayMood(today);
      if (local) {
        setSaved(local);
        setScore(local.score);
        setNote(local.note ?? '');
        setSuggestion(verseForScore(local.score));
      }
    }
  })();
}, []);

  // Load truths + realtime
  useEffect(() => {
    fetchTruths();
    const channel = supabase
      .channel('truth_board_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'truth_board' }, fetchTruths)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchTruths() {
    const { data, error } = await supabase
      .from('truth_board')
      .select('id, text, author, created_at')   // match your SQL
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      Alert.alert('Truths load error', error.message);
      return;
    }
    setTruths(data ?? []);
  }

  async function postTruth() {
    if (!newTruth.trim()) return Alert.alert('Please write something first.');

    const { data: u, error: ue } = await supabase.auth.getUser();
    if (ue || !u?.user) return Alert.alert('Error', 'You must be logged in to post.');

    const displayName = author.trim() || u.user.user_metadata?.username || u.user.email || 'Anonymous';

    const { error } = await supabase.from('truth_board').insert([
      { text: newTruth, author: displayName, user_id: u.user.id },
    ]);

    if (error) return Alert.alert('Post failed', error.message);

    setNewTruth('');
    setAuthor('');
    setModalVisible(false);
  }

  async function onSaveMood() {
  try {
    // 1) Cloud (per-user, unique by date)
    await upsertMoodCloud({ date: today, score, note });

    // 2) Local cache (optional)
    await upsertMood({ date: today, score, note });

    const newSaved = { date: today, score, note };
    setSaved(newSaved);
    setSuggestion(verseForScore(score));
    Alert.alert('Saved', 'Your check-in was saved for today.');
  } catch (e) {
    Alert.alert('Error', String(e?.message ?? e));
  }
}

  const renderItem = ({ item }) => (
    <View style={s.truthCard}>
      <Text style={s.truthText}>"{item.text}"</Text>
      <Text style={s.truthAuthor}>– {item.author || 'Anonymous'}</Text>
      <Text style={s.truthDate}>{dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      style={{ flex: 1 }}
    >
      {/* One FlatList for the whole page (smooth scroll, no nested lists) */}
      <FlatList
        data={truths}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <HomeHeader
            score={score}
            setScore={setScore}
            note={note}
            setNote={setNote}
            saved={saved}
            suggestion={suggestion}
            onSaveMood={onSaveMood}
            openShare={() => setModalVisible(true)}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Share modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalWrap}>
          <View style={s.modalCard}>
            <Text style={s.h2}>Share Your Truth</Text>
            <TextInput
              placeholder="Write your truth or scripture..."
              value={newTruth}
              onChangeText={setNewTruth}
              multiline
              scrollEnabled
              style={s.input}
            />
            <TextInput
              placeholder="Your name (optional)"
              value={author}
              onChangeText={setAuthor}
              style={s.input}
            />
            <Pressable style={s.btn} onPress={postTruth}>
              <Text style={s.btnText}>Post</Text>
            </Pressable>
            <Pressable style={[s.btn, { backgroundColor: '#aaa' }]} onPress={() => setModalVisible(false)}>
              <Text style={s.btnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/** ---------------------------
 *  Styles
 *  ---------------------------
 */
const s = StyleSheet.create({
  hero: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  hello: { fontSize: 18, fontWeight: '700', color: '#234' },
  date: { color: '#64727a', marginTop: 2 },
  todayPill: { backgroundColor: '#2f6f4e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  todayPillText: { color: '#fff', fontWeight: '700' },

  wrap: { padding: 16, gap: 16 },
  h1: { fontSize: 22, fontWeight: '700' },
  h2: { fontSize: 18, fontWeight: '600', marginBottom: 8 },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  emoji: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '18%',
    backgroundColor: '#fff',
  },
  emojiActive: { borderColor: '#2f6f4e' },
  big: { fontSize: 28 },
  small: { fontSize: 12, color: '#666' },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    minHeight: 50,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    marginBottom: 8,
  },

  btn: { backgroundColor: '#2f6f4e', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700' },

  subtle: { color: '#666' },

  noteCard: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  noteTitle: { color: '#166534', fontWeight: '700', marginBottom: 4 },
  noteBody: { color: '#166534' },

  card: { borderWidth: 1, borderColor: '#e3e3e3', borderRadius: 12, padding: 14, backgroundColor: '#fafafa' },
  cardRef: { fontWeight: '700', marginBottom: 6 },
  cardText: { fontSize: 16 },

  boardHeader: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontWeight: '700', fontSize: 16, marginBottom: 0 },
  shareButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2f6f4e', borderRadius: 8 },
  shareButtonText: { color: '#fff', fontWeight: '600' },

  truthCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  truthText: { fontStyle: 'italic', fontSize: 14, color: '#111827' },
  truthAuthor: { fontSize: 12, color: '#555', marginTop: 6 },
  truthDate: { fontSize: 11, color: '#777', marginTop: 2 },

  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '85%' },
});