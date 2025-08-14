import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import dayjs from 'dayjs';            // if you don’t have it: npm i dayjs
import { getTodayMood, upsertMood } from '../../lib/db';
import { verseForScore } from '../../services/scripture';

export default function Home() {
  const [score, setScore] = useState(3);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(null);       // {date, score, note}
  const [suggestion, setSuggestion] = useState(null);

  const today = dayjs().format('YYYY-MM-DD');

  // Load today's mood when screen mounts
  useEffect(() => {
    (async () => {
      const m = await getTodayMood(today);
      if (m) {
        setSaved(m);
        setScore(m.score);
        setNote(m.note ?? '');
        setSuggestion(verseForScore(m.score));
      }
    })();
  }, []);

  async function onSave() {
    try {
      await upsertMood({ date: today, score, note });
      const newSaved = { date: today, score, note };
      setSaved(newSaved);
      setSuggestion(verseForScore(score));
      Alert.alert('Saved', 'Your check-in was saved for today.');
    } catch (e) {
      Alert.alert('Error', String(e?.message ?? e));
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <View style={s.wrap}>
        <Text style={s.h1}>How are you feeling today?</Text>

        <View style={s.row}>
          {[1,2,3,4,5].map((n) => (
            <Pressable key={n} style={[s.emoji, score === n && s.emojiActive]} onPress={() => setScore(n)}>
              <Text style={s.big}>{n===1?'😞':n===2?'😕':n===3?'😐':n===4?'🙂':'😄'}</Text>
              <Text style={s.small}>{n}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          placeholder="Add a note or intention…"
          value={note}
          onChangeText={setNote}
          multiline
          style={s.input}
        />

        <Pressable onPress={onSave} style={s.btn}>
          <Text style={s.btnText}>Save check-in</Text>
        </Pressable>

        {saved && (
          <Text style={s.subtle}>
            Saved for {saved.date} • score {saved.score}{saved.note ? ' • note added' : ''}
          </Text>
        )}

        {suggestion && (
          <View style={s.card}>
            <Text style={s.cardRef}>{suggestion.ref}</Text>
            <Text style={s.cardText}>{suggestion.text}</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 16 },
  h1: { fontSize: 22, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  emoji: { alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', width: '18%' },
  emojiActive: { borderColor: '#2f6f4e' },
  big: { fontSize: 28 },
  small: { fontSize: 12, color: '#666' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, minHeight: 64, textAlignVertical: 'top' },
  btn: { backgroundColor: '#2f6f4e', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  subtle: { color: '#666' },
  card: { borderWidth: 1, borderColor: '#e3e3e3', borderRadius: 12, padding: 14, backgroundColor: '#fafafa' },
  cardRef: { fontWeight: '700', marginBottom: 6 },
  cardText: { fontSize: 16 },
});