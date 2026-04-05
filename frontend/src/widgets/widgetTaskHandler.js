import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import React from 'react';
import PinNestWidget from './PinNestWidget';

const NOTE_STORAGE_KEY = 'pinnest_widget_note_';

export const saveWidgetNote = async (widgetId, note) => {
  if (!widgetId) return;
  await AsyncStorage.setItem(`${NOTE_STORAGE_KEY}${widgetId}`, JSON.stringify(note));
};

export const loadWidgetNote = async (widgetId) => {
  if (!widgetId) return null;
  const raw = await AsyncStorage.getItem(`${NOTE_STORAGE_KEY}${widgetId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const removeWidgetNote = async (widgetId) => {
  if (!widgetId) return;
  await AsyncStorage.removeItem(`${NOTE_STORAGE_KEY}${widgetId}`);
};

/**
 * react-native-android-widget handler API (v0.10):
 *   Props: { widgetAction, widgetName, widgetId, clickAction, clickActionData }
 *   Must RETURN a JSX element (or null). Do NOT call renderWidget().
 *
 * HOW TO ADD A WIDGET TO HOME SCREEN:
 *   1. Long-press any empty spot on the Android home screen.
 *   2. Tap "Widgets" at the bottom.
 *   3. Find "PinNest" and drag the desired size onto the screen.
 *   4. Open the app, edit a note, tap "Add to Home Screen" to fill that slot.
 */
registerWidgetTaskHandler(async ({ widgetAction, widgetId, clickActionData }) => {
  const PLACEHOLDER = {
    title: 'Tap to pin a goal',
    color: 'neutral',
    priority: 'medium',
    deadline: null,
  };

  if (widgetAction === 'WIDGET_DELETED') {
    await removeWidgetNote(widgetId);
    return null;
  }

  // For WIDGET_CLICK the OS brings the app to foreground automatically.
  // Deep-link routing can be wired in Phase 2.
  if (widgetAction === 'WIDGET_CLICK') {
    return null;
  }

  // WIDGET_ADDED | WIDGET_UPDATE | WIDGET_RESIZED
  const note =
    clickActionData?.note ?? (await loadWidgetNote(widgetId)) ?? PLACEHOLDER;

  return <PinNestWidget note={note} />;
});
