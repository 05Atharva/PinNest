import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { PAPER_BEIGE } from '../../src/constants/colors';
import { useSettingsStore } from '../../src/store/settingsStore';
import { getThemeColors } from '../../src/utils/themeHelpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const iconFor = (name, focused, colors) => {
  const color = focused ? colors.accent : 'rgba(139,94,60,0.5)';
  const glyph = name === 'board' ? '🏠' : name === 'analytics' ? '📊' : '⚙️';
  return <Text style={{ fontSize: 18, color }}>{glyph}</Text>;
};

const TabsLayout = () => {
  const theme = useSettingsStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: PAPER_BEIGE,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: 'rgba(139,94,60,0.5)',
        tabBarIcon: ({ focused }) => iconFor(route.name, focused, colors),
      })}
    >
      <Tabs.Screen name="board" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
};

export default TabsLayout;
