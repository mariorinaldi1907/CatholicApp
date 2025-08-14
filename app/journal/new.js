import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { createEntry } from '../../lib/db';

export default function NewEntry() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  async function onSave() {
    if (!title.trim()) return Alert.alert('Please add a title');
    await createEntry({ title: title.trim(), body });
    router.back(); // return to list (it will reload)
  }

  return (
    <View style={s.wrap}>
      <Text style={s.h1}>New reflection</Text>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={s.input}
      />
      <TextInput
        placeholder="Write your reflection, prayer, or gratitude…"
        value={body}
        onChangeText={setBody}
        style={[s.input, { minHeight: 140, textAlignVertical: 'top' }]}
        multiline
      />
      <Pressable style={s.btn} onPress={onSave}>
        <Text style={s.btnText}>Save</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12 },
  btn: { backgroundColor: '#2f6f4e', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});