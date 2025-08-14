import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

export default function Settings() {
  const { session } = useAuth();

  async function onSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Sign out failed', error.message);
  }

  return (
    <View style={s.wrap}>
      <Text style={s.h1}>Settings</Text>
      <Text style={{ marginBottom: 12 }}>Signed in as: {session?.user?.email}</Text>
      <Button title="Sign out" onPress={onSignOut} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
});