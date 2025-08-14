// app/confession/new.js
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { createConfession, parseDateInput, fmtDateYYYYMMDD } from '../../lib/confessionApi';

export default function NewConfession() {
  const [plannedDateStr, setPlannedDateStr] = useState(''); // YYYY-MM-DD
  const [notesBefore, setNotesBefore] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSave() {
    try {
      setSaving(true);
      let plannedDate = null;
      if (plannedDateStr) {
        const d = parseDateInput(plannedDateStr);
        if (!d) return Alert.alert('Invalid date', 'Use YYYY-MM-DD, e.g., 2025-08-14');
        plannedDate = fmtDateYYYYMMDD(d); // will be stored as date by Supabase
      }
      await createConfession({ planned_date: plannedDate, notes_before: notesBefore });
      router.back();
    } catch (e) {
      Alert.alert('Error', e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <View style={s.wrap}>
        <Text style={s.h1}>Plan a Confession</Text>

        <TextInput
          placeholder="Planned date (YYYY-MM-DD)"
          value={plannedDateStr}
          onChangeText={setPlannedDateStr}
          style={s.input}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Notes before confession (examination, intentions)"
          value={notesBefore}
          onChangeText={setNotesBefore}
          style={[s.input, { minHeight: 120, textAlignVertical: 'top' }]}
          multiline
        />

        <Pressable onPress={onSave} style={s.btn} disabled={saving}>
          <Text style={s.btnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 },
  btn: { backgroundColor: '#2f6f4e', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});