import { Stack } from 'expo-router';

export default function ConfessionLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      {/* remove the index line because there's no app/confession/index.js */}
      <Stack.Screen name="[id]" options={{ title: 'Confession' }} />
      <Stack.Screen name="new" options={{ title: 'New Confession' }} />
    </Stack>
  );
}