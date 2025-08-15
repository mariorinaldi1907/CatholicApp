import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { createEntryCloud } from '../../lib/journalApi';

export default function NewEntry() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!title.trim()) return;
    try {
      setSaving(true);
      await createEntryCloud({ title: title.trim(), body });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* optional inline back (keeps consistency even if header is hidden someday) */}
        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>

        <Text style={s.h1}>New reflection</Text>

        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          style={s.input}
          returnKeyType="next"
        />

        <TextInput
          placeholder="Write your reflection, prayer, or gratitude…"
          value={body}
          onChangeText={setBody}
          style={[s.input, s.textarea]}
          multiline
        />

        <Pressable onPress={onSave} style={[s.btn, saving && { opacity: 0.7 }]} disabled={saving}>
          <Text style={s.btnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  back: { marginBottom: 4, alignSelf: 'flex-start' },
  backText: { color: '#2f6f4e', fontWeight: '700' },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 12, backgroundColor: '#fff',
  },
  textarea: { minHeight: 160, textAlignVertical: 'top' },
  btn: {
    marginTop: 8, backgroundColor: '#2f6f4e', padding: 14,
    borderRadius: 12, alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});