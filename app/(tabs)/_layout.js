import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';

export default function TabsLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;             // or a splash/loading
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
      <Tabs.Screen name="trends" options={{ title: 'Trends' }} />
      <Tabs.Screen name="confession" options={{ title: 'Confession' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}