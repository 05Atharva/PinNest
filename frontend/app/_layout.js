import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/services/supabase';
import { useUserStore } from '../src/store/userStore';
import { useNotesStore } from '../src/store/notesStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { logStreakDayIfNeeded } from '../src/services/analyticsService';
// Avoid loading native widget module in Expo Go (native module not present).
if (Constants.appOwnership !== 'expo') {
  // eslint-disable-next-line global-require
  require('../src/widgets/widgetTaskHandler');
}

const RootLayout = () => {
  const [checking, setChecking] = useState(true);
  const session = useUserStore((s) => s.session);
  const setSession = useUserStore((s) => s.setSession);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const loadTheme = useSettingsStore((s) => s.loadTheme);
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  useEffect(() => {
    let mounted = true;
    loadTheme();
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session ?? null;
      setSession(session);
      if (session?.user?.id) {
        fetchNotes(session.user.id);
        logStreakDayIfNeeded(session.user.id, AsyncStorage);
      }
      setChecking(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user?.id) {
          fetchNotes(session.user.id);
          logStreakDayIfNeeded(session.user.id, AsyncStorage);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, [fetchNotes, setSession]);

  useEffect(() => {
    if (!navState?.key || checking) return;
    const inAuth = segments[0] === 'auth';
    if (!session && !inAuth) {
      router.replace('/auth');
    } else if (session && inAuth) {
      router.replace('/(tabs)/board');
    }
  }, [checking, navState?.key, router, segments, session]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="CreateNoteScreen" />
        <Stack.Screen name="EditNoteScreen" />
      </Stack>
    </>
  );
};

export default RootLayout;
