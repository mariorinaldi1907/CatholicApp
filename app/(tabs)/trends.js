import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getRecentMoods } from '../../lib/db'; // fallback (SQLite)
import { listMoodsCloud } from '../../lib/moodsApi'; // NEW

const ranges = [7, 30, 90];
const screenWidth = Dimensions.get('window').width;

export default function Trends() {
  const [days, setDays] = useState(7);
  const [points, setPoints] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // Try cloud first
        const cloud = await listMoodsCloud(120);  // [{date:'YYYY-MM-DD', score}]
        const sorted = [...cloud].reverse();      // oldest -> newest
        setPoints(sorted.slice(-days));
      } catch {
        // Fallback to local if offline / auth issue
        const local = await getRecentMoods(120);  // newest -> oldest
        const sorted = [...local].reverse();
        setPoints(sorted.slice(-days));
      }
    })();
  }, [days]);

  if (!points) return <View style={s.center}><ActivityIndicator /></View>;

  const labels = points.map(p => p.date.slice(5));
  const data = points.map(p => Number(p.score));

  return (
    <View style={s.wrap}>
      <Text style={s.h1}>Mood trends</Text>

      <View style={s.row}>
        {ranges.map(r => (
          <Pressable key={r} onPress={() => setDays(r)}
            style={[s.chip, days===r && s.chipActive]}>
            <Text style={[s.chipText, days===r && s.chipTextActive]}>{r}d</Text>
          </Pressable>
        ))}
      </View>

      {data.length === 0 ? (
        <Text style={{ color:'#666' }}>No data yet. Save a few daily check-ins on Home.</Text>
      ) : (
        <LineChart
          data={{ labels, datasets: [{ data }] }}
          width={screenWidth - 32}
          height={220}
          fromZero
          yAxisInterval={1}
          chartConfig={{
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (o = 1) => `rgba(47,111,78,${o})`,
            labelColor: (o = 1) => `rgba(60,60,60,${o})`,
            propsForDots: { r: '3' },
          }}
          bezier
          style={{ marginTop: 12, borderRadius: 12 }}
          segments={4}
          yLabelsOffset={10}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  center: { flex:1, justifyContent:'center', alignItems:'center' },
  h1: { fontSize: 22, fontWeight: '700' },
  row: { flexDirection:'row', gap:8 },
  chip: { borderWidth:1, borderColor:'#2f6f4e', paddingVertical:6, paddingHorizontal:10, borderRadius:12 },
  chipActive: { backgroundColor:'#2f6f4e' },
  chipText: { color:'#2f6f4e', fontWeight:'700' },
  chipTextActive: { color:'#fff' },
});