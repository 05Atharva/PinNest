import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { BROWN, PAPER_BEIGE, TERRACOTTA, WARM_BG } from '../../src/constants/colors';

const iconFor = (name, focused) => {
  const color = focused ? TERRACOTTA : 'rgba(139,94,60,0.5)';
  const glyph = name === 'board' ? '🏠' : name === 'analytics' ? '📊' : '⚙️';
  return <Text style={{ fontSize: 18, color }}>{glyph}</Text>;
};

const TabsLayout = () => (
  <Tabs
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: WARM_BG,
        borderTopColor: PAPER_BEIGE,
        height: 60,
      },
      tabBarActiveTintColor: TERRACOTTA,
      tabBarInactiveTintColor: 'rgba(139,94,60,0.5)',
      tabBarIcon: ({ focused }) => iconFor(route.name, focused),
    })}
  >
    <Tabs.Screen name="board" />
    <Tabs.Screen name="analytics" />
    <Tabs.Screen name="settings" />
  </Tabs>
);

export default TabsLayout;
