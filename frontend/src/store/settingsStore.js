import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const THEME_KEY = 'pinnest_theme_preference';

export const useSettingsStore = create(
  immer((set, get) => ({
    theme: 'light',
    loadTheme: async () => {
      const value = await AsyncStorage.getItem(THEME_KEY);
      set((state) => {
        state.theme = value === 'dark' ? 'dark' : 'light';
      });
    },
    setTheme: async (theme) => {
      await AsyncStorage.setItem(THEME_KEY, theme);
      set((state) => {
        state.theme = theme;
      });
    },
    toggleTheme: async () => {
      const next = get().theme === 'dark' ? 'light' : 'dark';
      await AsyncStorage.setItem(THEME_KEY, next);
      set((state) => {
        state.theme = next;
      });
    },
  }))
);
