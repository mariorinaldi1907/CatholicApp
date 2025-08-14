// app/(tabs)/confession.js
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { listConfessions, fmtDateYYYYMMDD } from '../../lib/confessionApi';

export default function ConfessionList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const rows = await listConfessions(200);
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Text style={s.h1}>Confession</Text>
        <Link href="/confession/new" asChild>
          <Pressable style={s.btn}><Text style={s.btnText}>New</Text></Pressable>
        </Link>
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : items.length === 0 ? (
        <Text style={s.empty}>No confessions yet. Tap “New” to plan or record one.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const planned = item.planned_date ? fmtDateYYYYMMDD(new Date(item.planned_date)) : '—';
            const confessed = item.confessed_at ? new Date(item.confessed_at).toLocaleString() : 'Not yet';

            return (
              <Link href={`/confession/${item.id}`} asChild>
                <Pressable style={s.card}>
                  <Text style={s.title}>Planned: {planned}</Text>
                  <Text style={s.mini}>Confessed: {confessed}</Text>
                  {item.notes_before ? <Text numberOfLines={2}>{item.notes_before}</Text> : null}
                </Pressable>
              </Link>
            );
          }}
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
  mini: { color: '#777', marginBottom: 6, fontSize: 12 },
});