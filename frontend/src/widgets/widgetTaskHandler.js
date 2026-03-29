import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
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

// Register once on app startup (e.g. import this file in App.js or root layout).
registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget, clickActionData }) => {
  const widgetId = widgetInfo?.widgetId;
  const note = clickActionData?.note ?? (await loadWidgetNote(widgetId));

  if (widgetAction === 'WIDGET_DELETED') {
    await removeWidgetNote(widgetId);
    return;
  }

  if (widgetAction === 'WIDGET_CLICK') {
    if (note?.id) {
      // Requires deep link setup in the app (e.g. pinnest://note/:id).
      Linking.openURL(`pinnest://note/${note.id}`);
    } else {
      Linking.openURL('pinnest://');
    }
  }

  if (note) {
    renderWidget(<PinNestWidget note={note} />);
  }
});
