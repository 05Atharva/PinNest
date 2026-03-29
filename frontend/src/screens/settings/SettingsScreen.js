import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useUserStore } from '../../store/userStore';
import {
  BROWN,
  PAPER_BEIGE,
  TERRACOTTA,
  WARM_BG,
} from '../../constants/colors';

const THEME_KEY = 'pinnest_theme_preference';

const SettingsScreen = () => {
  const { user, signOut } = useUserStore();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((value) => {
      setDarkMode(value === 'dark');
    });
  }, []);

  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{user?.email ?? '—'}</Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.label}>Dark mode</Text>
        <Switch
          value={darkMode}
          onValueChange={toggleDarkMode}
          thumbColor={darkMode ? TERRACOTTA : PAPER_BEIGE}
          trackColor={{ false: 'rgba(139,94,60,0.2)', true: 'rgba(217,122,95,0.4)' }}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>App version</Text>
        <Text style={styles.value}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </View>

      <Pressable onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM_BG,
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: PAPER_BEIGE,
    borderRadius: 16,
    padding: 14,
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    backgroundColor: PAPER_BEIGE,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    color: BROWN,
    opacity: 0.8,
  },
  value: {
    fontSize: 14,
    color: BROWN,
    fontWeight: '700',
    marginTop: 4,
  },
  signOut: {
    borderWidth: 1,
    borderColor: TERRACOTTA,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: {
    color: TERRACOTTA,
    fontWeight: '700',
  },
});

export default SettingsScreen;
