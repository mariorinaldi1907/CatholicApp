import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;             // or a splash/loading component
  if (session) return <Redirect href="/(tabs)" />;

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
    </Stack>
  );
}