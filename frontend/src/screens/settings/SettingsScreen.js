import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useUserStore } from '../../store/userStore';
import { useSettingsStore } from '../../store/settingsStore';
import {
  BROWN,
  PAPER_BEIGE,
  TERRACOTTA,
  WARM_BG,
} from '../../constants/colors';
import { getThemeColors } from '../../utils/themeHelpers';

const SettingsScreen = () => {
  const { user, signOut } = useUserStore();
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const colors = getThemeColors(theme);
  const darkMode = theme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom + 8, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Signed in as</Text>
        <Text style={[styles.value, { color: colors.text }]}>{user?.email ?? '—'}</Text>
      </View>

      <View style={[styles.cardRow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Dark mode</Text>
        <Switch
          value={darkMode}
          onValueChange={toggleTheme}
          thumbColor={darkMode ? colors.accent : colors.card}
          trackColor={{
            false: 'rgba(139,94,60,0.2)',
            true: 'rgba(217,122,95,0.4)',
          }}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>App version</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>

      <Pressable onPress={signOut} style={[styles.signOut, { borderColor: colors.accent }]}>
        <Text style={[styles.signOutText, { color: colors.accent }]}>Sign Out</Text>
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
