import { Stack } from 'expo-router';

export default function JournalStack() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="new" options={{ title: 'New Reflection' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit Reflection' }} />
    </Stack>
  );
}