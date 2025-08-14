import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { supabase } from '../lib/supabase';   // from your Step 3
import { AuthContext } from '../lib/auth';
import { useState } from 'react';
import { migrate } from '../lib/db';

export default function RootLayout() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // DB migration (runs once)
  useEffect(() => { migrate(); }, []);

  // Auth bootstrapping (from Step 3)
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { mounted = false; sub.subscription?.unsubscribe?.(); };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthContext.Provider>
  );
}