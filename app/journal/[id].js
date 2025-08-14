import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getEntry, updateEntry, deleteEntry } from '../../lib/db';

export default function EntryDetail() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    (async () => {
      const row = await getEntry(Number(id));
      if (row) {
        setTitle(row.title ?? '');
        setBody(row.body ?? '');
      }
    })();
  }, [id]);

  async function onSave() {
    if (!title.trim()) return Alert.alert('Title cannot be empty');
    await updateEntry(Number(id), { title: title.trim(), body });
    Alert.alert('Saved', 'Entry updated');
  }

  async function onDelete() {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteEntry(Number(id));
          router.back();
        }
      }
    ]);
  }

  return (
    <View style={s.wrap}>
      <Text style={s.h1}>Edit entry</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={s.input}
      />
      <TextInput
        value={body}
        onChangeText={setBody}
        style={[s.input, { minHeight: 140, textAlignVertical: 'top' }]}
        multiline
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable style={[s.btn, { flex: 1 }]} onPress={onSave}>
          <Text style={s.btnText}>Save</Text>
        </Pressable>
        <Pressable style={[s.btnOutline, { flex: 1 }]} onPress={onDelete}>
          <Text style={s.btnOutlineText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 },
  btn: { backgroundColor: '#2f6f4e', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnOutline: { borderWidth: 1, borderColor: '#c33', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnOutlineText: { color: '#c33', fontWeight: '700' },
});