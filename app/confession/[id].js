// app/confession/[id].js
import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  getConfession,
  updateConfession,
  deleteConfession,
  markConfessed,
  parseDateInput,
  fmtDateYYYYMMDD,
} from '../../lib/confessionApi';



export default function ConfessionDetail() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  const [plannedDateStr, setPlannedDateStr] = useState('');
  const [notesBefore, setNotesBefore] = useState('');
  const [confessedAt, setConfessedAt] = useState(null);
  const [notesAfter, setNotesAfter] = useState('');

  async function load() {
    try {
      setLoading(true);
      const row = await getConfession(String(id));
      setPlannedDateStr(row.planned_date ? String(row.planned_date) : '');
      setNotesBefore(row.notes_before ?? '');
      setConfessedAt(row.confessed_at ? new Date(row.confessed_at) : null);
      setNotesAfter(row.notes_after ?? '');
    } catch (e) {
      Alert.alert('Error', e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function onSaveChanges() {
    try {
      let planned_date = null;
      if (plannedDateStr) {
        const d = parseDateInput(plannedDateStr);
        if (!d) return Alert.alert('Invalid date', 'Use YYYY-MM-DD');
        planned_date = fmtDateYYYYMMDD(d);
      }
      await updateConfession(String(id), {
        planned_date,
        notes_before: notesBefore || null,
        notes_after: notesAfter || null,
      });
      Alert.alert('Saved', 'Confession updated');
    } catch (e) {
      Alert.alert('Error', e.message ?? String(e));
    }
  }

  async function onMarkConfessed() {
    try {
      const now = new Date();
      await markConfessed(String(id), notesAfter, now);
      setConfessedAt(now);
      Alert.alert('Marked', 'Confession recorded as completed');
    } catch (e) {
      Alert.alert('Error', e.message ?? String(e));
    }
  }

  async function onDelete() {
    Alert.alert('Delete confession?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteConfession(String(id));
            router.back();
          } catch (e) {
            Alert.alert('Error', e.message ?? String(e));
          }
        },
      },
    ]);
  }

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Loading…</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={s.wrap}>
         {/* Back button */}
    <Pressable onPress={() => router.back()} style={{ marginBottom: 8 }}>
      <Text style={{ color: '#2f6f4e', fontWeight: '700' }}>← Back</Text>
    </Pressable>
    
      <Text style={s.h1}>Confession</Text>

      <Text style={s.label}>Planned date (YYYY-MM-DD)</Text>
      <TextInput
        value={plannedDateStr}
        onChangeText={setPlannedDateStr}
        style={s.input}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
      />

      <Text style={s.label}>Notes before</Text>
      <TextInput
        value={notesBefore}
        onChangeText={setNotesBefore}
        style={[s.input, { minHeight: 120, textAlignVertical: 'top' }]}
        multiline
      />

      <Text style={s.label}>Confessed at</Text>
      <Text style={s.readonly}>{confessedAt ? confessedAt.toLocaleString() : 'Not yet'}</Text>

      <Text style={s.label}>Notes after</Text>
      <TextInput
        value={notesAfter}
        onChangeText={setNotesAfter}
        style={[s.input, { minHeight: 120, textAlignVertical: 'top' }]}
        multiline
      />

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <Pressable style={[s.btn, { flex: 1 }]} onPress={onSaveChanges}>
          <Text style={s.btnText}>Save</Text>
        </Pressable>
        <Pressable style={[s.btnAlt, { flex: 1 }]} onPress={onMarkConfessed}>
          <Text style={s.btnAltText}>Mark confessed</Text>
        </Pressable>
      </View>

      <Pressable style={[s.btnDanger, { marginTop: 12 }]} onPress={onDelete}>
        <Text style={s.btnDangerText}>Delete</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: '700' },
  label: { fontWeight: '600', marginTop: 8 },
  readonly: { paddingVertical: 10, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  btn: { backgroundColor: '#2f6f4e', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnAlt: { borderWidth: 1, borderColor: '#2f6f4e', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnAltText: { color: '#2f6f4e', fontWeight: '700' },
  btnDanger: { borderWidth: 1, borderColor: '#c33', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnDangerText: { color: '#c33', fontWeight: '700' },
});