// app/journal/[id].js
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { deleteEntryCloud, getEntryCloud, updateEntryCloud } from '../../lib/journalApi';

export default function EntryDetail() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const row = await getEntryCloud(String(id));
        setTitle(row?.title ?? '');
        setBody(row?.body ?? '');
      } catch (e) {
        Alert.alert('Error', e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSave() {
    if (!title.trim()) return Alert.alert('Title cannot be empty');
    try {
      setSaving(true);
      await updateEntryCloud(String(id), { title: title.trim(), body });
      Alert.alert('Saved', 'Entry updated');
    } catch (e) {
      Alert.alert('Error', e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntryCloud(String(id));
            router.back();
          } catch (e) {
            Alert.alert('Error', e.message ?? String(e));
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Inline back (useful even if headers are hidden) */}
        <Pressable onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </Pressable>

        <Text style={s.h1}>Edit reflection</Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          style={s.input}
          returnKeyType="next"
        />

        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Write your reflection…"
          style={[s.input, s.textarea]}
          multiline
        />

        <View style={s.row}>
          <Pressable style={[s.btn, { flex: 1 }, saving && { opacity: 0.7 }]} onPress={onSave} disabled={saving}>
            <Text style={s.btnText}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
          <Pressable style={[s.btnOutline, { flex: 1 }]} onPress={onDelete}>
            <Text style={s.btnOutlineText}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  back: { alignSelf: 'flex-start' },
  backText: { color: '#2f6f4e', fontWeight: '700' },
  h1: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 12, backgroundColor: '#fff',
  },
  textarea: { minHeight: 160, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { backgroundColor: '#2f6f4e', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnOutline: { borderWidth: 1, borderColor: '#c33', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnOutlineText: { color: '#c33', fontWeight: '700' },
});