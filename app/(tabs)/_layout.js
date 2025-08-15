// app/(tabs)/_layout.js
import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, Tabs } from 'expo-router';
import { Platform, Pressable, Text } from 'react-native';
import { useAuth } from '../../lib/auth';

export default function TabsLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,                     // keeps content below the notch
        tabBarActiveTintColor: '#2f6f4e',
        tabBarInactiveTintColor: '#8b8b8b',
        tabBarHideOnKeyboard: true,
        safeAreaInsets: { bottom: 0 },         // snug to bottom on iOS
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 70 : 60,
          paddingBottom: Platform.OS === 'ios' ? 12 : 6,
          paddingTop: 6,
          borderTopWidth: 0.5,
          borderTopColor: '#e5e5e5',
          backgroundColor: '#fff',
        },
        tabBarItemStyle: { alignItems: 'center', justifyContent: 'center' },
        tabBarIconStyle: { marginBottom: -2 },
        tabBarLabelStyle: { fontSize: 11, marginTop: 0, paddingBottom: 0 },

        tabBarIcon: ({ focused, color }) => {
          let name: any = 'home-outline';
          switch (route.name) {
            case 'index':      name = focused ? 'home' : 'home-outline'; break;
            case 'journal':    name = focused ? 'book' : 'book-outline'; break;
            case 'trends':     name = focused ? 'stats-chart' : 'stats-chart-outline'; break;
            case 'confession': name = focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'; break;
            case 'settings':   name = focused ? 'settings' : 'settings-outline'; break;
          }
          return <Ionicons name={name} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />

      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          headerRight: () => (
            <Link href="/journal/new" asChild>
              <Pressable style={{ marginRight: 12 }}>
                <Text style={{ color: '#2f6f4e', fontWeight: '700' }}>New</Text>
              </Pressable>
            </Link>
          ),
        }}
      />

      <Tabs.Screen name="trends" options={{ title: 'Trends' }} />
      <Tabs.Screen name="confession" options={{ title: 'Confession' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}