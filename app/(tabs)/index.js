import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
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
import { upsertMoodCloud } from '../../lib/moodsApi';
import { supabase } from '../../lib/supabase';
import { verseForScore } from '../../services/scripture';


export default function Home() {
  const [score, setScore] = useState(3);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  const [truths, setTruths] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTruth, setNewTruth] = useState('');
  const [author, setAuthor] = useState('');

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    (async () => {
      const m = await getTodayMood(today);
      if (m) {
        setSaved(m);
        setScore(m.score);
        setNote(m.note ?? '');
        setSuggestion(verseForScore(m.score));
      } else {
        setSuggestion(verseForScore(score));
      }
    })();
  }, []);

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
    .select('id, text, author, created_at')   // ⬅️ only the columns that exist
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
      await upsertMood({ date: today, score, note });
      upsertMoodCloud({ date: today, score, note }).catch(() => {});
      const newSaved = { date: today, score, note };
      setSaved(newSaved);
      setSuggestion(verseForScore(score));
      Alert.alert('Saved', 'Your check-in was saved for today.');
    } catch (e) {
      Alert.alert('Error', String(e?.message ?? e));
    }
  }

  const renderHeader = () => (
    <>
      {/* Soft gradient header */}
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
            <Pressable key={n} style={[s.emoji, score === n && s.emojiActive]} onPress={() => setScore(n)}>
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

        {/* Section title for the board */}
        <View style={s.boardHeader}>
          <Text style={s.sectionTitle}>📝 Truth & Scripture Board</Text>
          <Pressable style={s.shareButton} onPress={() => setModalVisible(true)}>
            <Text style={s.shareButtonText}>+ Share</Text>
          </Pressable>
        </View>
      </View>
    </>
  );

  const renderItem = ({ item }) => {
    const text = item.text ?? item.content ?? '';
    return (
      <View style={s.truthCard}>
        <Text style={s.truthText}>"{text}"</Text>
        <Text style={s.truthAuthor}>– {item.author || 'Anonymous'}</Text>
        <Text style={s.truthDate}>{dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      {/* Single FlatList drives the whole page (no nested VirtualizedLists) */}
      <FlatList
        data={truths}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal to share truth */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalWrap}>
          <View style={s.modalCard}>
            <Text style={s.h2}>Share Your Truth</Text>
            <TextInput
              placeholder="Write your truth or scripture..."
              value={newTruth}
              onChangeText={setNewTruth}
              multiline
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

const s = StyleSheet.create({
  hero: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
  },
  hello: { fontSize: 18, fontWeight: '700', color: '#234' },
  date: { color: '#64727a', marginTop: 2 },
  todayPill: { backgroundColor: '#2f6f4e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  todayPillText: { color: '#fff', fontWeight: '700' },

  wrap: { padding: 16, gap: 16 },
  h1: { fontSize: 22, fontWeight: '700' },
  h2: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  emoji: { alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', width: '18%', backgroundColor: '#fff' },
  emojiActive: { borderColor: '#2f6f4e' },
  big: { fontSize: 28 },
  small: { fontSize: 12, color: '#666' },

  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, minHeight: 50, textAlignVertical: 'top', marginBottom: 8, backgroundColor: '#fff' },
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

  truthCard: { padding: 12, borderRadius: 10, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  truthText: { fontStyle: 'italic', fontSize: 14, color: '#111827' },
  truthAuthor: { fontSize: 12, color: '#555', marginTop: 6 },
  truthDate: { fontSize: 11, color: '#777', marginTop: 2 },

  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '85%' },
});