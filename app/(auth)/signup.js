import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSignup() {
    if (!email || !password) return Alert.alert('Please enter email and password');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return Alert.alert('Sign up failed', error.message);

    Alert.alert('Check your email', 'If email confirmations are enabled, confirm then return to log in.');
  }

  return (
    <View style={s.wrap}>
      <Text style={s.h1}>Create account</Text>
      <TextInput
        style={s.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.input}
        placeholder="Password (min 6 chars)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Sign up" onPress={onSignup} />
      <View style={{ height: 12 }} />
      <Link href="/(auth)/login">Have an account? Log in</Link>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12, justifyContent: 'center' },
  h1: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 },
});