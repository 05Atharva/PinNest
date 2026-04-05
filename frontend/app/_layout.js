import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/services/supabase';
import { useUserStore } from '../src/store/userStore';
import { useNotesStore } from '../src/store/notesStore';
import AuthScreen from '../src/screens/auth/AuthScreen';
import '../src/widgets/widgetTaskHandler';

const RootLayout = () => {
  const [checking, setChecking] = useState(true);
  // Reactive selector — re-renders the layout when session changes.
  const session = useUserStore((s) => s.session);
  const setSession = useUserStore((s) => s.setSession);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user?.id) fetchNotes(data.session.user.id);
      setChecking(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user?.id) fetchNotes(session.user.id);
      }
    );

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, [fetchNotes, setSession]);

  if (checking) return null;

  if (!session) {
    return (
      <>
        <StatusBar style="light" />
        <AuthScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="CreateNoteScreen" />
        <Stack.Screen name="EditNoteScreen" />
      </Stack>
    </>
  );
};

export default RootLayout;
