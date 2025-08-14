import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { listEntries } from '../../lib/db';

export default function JournalList() {
  const [items, setItems] = useState([]);

  async function load() {
    const rows = await listEntries(200);
    setItems(rows);
  }

  // Reload when returning to this tab
  useFocusEffect(() => {
    load();
  });

  useEffect(() => { load(); }, []);

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Text style={s.h1}>Journal</Text>
        <Link href="/journal/new" asChild>
          <Pressable style={s.btn}><Text style={s.btnText}>New</Text></Pressable>
        </Link>
      </View>

      {items.length === 0 ? (
        <Text style={s.empty}>No entries yet. Tap “New” to add your first reflection.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Link href={`/journal/${item.id}`} asChild>
              <Pressable style={s.card}>
                <Text style={s.title} numberOfLines={1}>{item.title}</Text>
                <Text style={s.snip} numberOfLines={2}>{item.body ?? ''}</Text>
                <Text style={s.date}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { fontSize: 22, fontWeight: '700' },
  btn: { backgroundColor: '#2f6f4e', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
  empty: { color: '#666' },
  card: { borderWidth: 1, borderColor: '#e3e3e3', borderRadius: 12, padding: 12, backgroundColor: '#fafafa' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  snip: { color: '#333' },
  date: { color: '#777', marginTop: 6, fontSize: 12 },
});