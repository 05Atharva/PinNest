import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { requestWidgetUpdate } from 'react-native-android-widget';
import Constants from 'expo-constants';
import {
  BROWN,
  DUSTY_BLUE,
  MUTED_GREEN,
  NOTE_BLUE,
  NOTE_GREEN,
  NOTE_NEUTRAL,
  NOTE_YELLOW,
  PAPER_BEIGE,
  TERRACOTTA,
} from '../../constants/colors';
import { useNotes } from '../../hooks/useNotes';
import PinNestWidget, { WIDGET_NAME_BY_PRIORITY } from '../../widgets/PinNestWidget';
import { saveWidgetNote } from '../../widgets/widgetTaskHandler';
import { useUserStore } from '../../store/userStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getThemeColors } from '../../utils/themeHelpers';

const COLOR_OPTIONS = [
  { key: 'yellow', label: 'Yellow', hex: NOTE_YELLOW },
  { key: 'green', label: 'Green', hex: NOTE_GREEN },
  { key: 'blue', label: 'Blue', hex: NOTE_BLUE },
  { key: 'neutral', label: 'Neutral', hex: NOTE_NEUTRAL },
];

const PRIORITY_OPTIONS = [
  { key: 'high', label: 'High', color: TERRACOTTA },
  { key: 'medium', label: 'Medium', color: MUTED_GREEN },
  { key: 'low', label: 'Low', color: DUSTY_BLUE },
];

const CreateNoteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeNote = route.params?.note ?? null;
  const routeId = route.params?.id ?? null;
  const { notes, addNote, editNote } = useNotes();
  const noteFromStore = routeId ? notes.find((n) => n.id === routeId) : null;
  const note = routeNote ?? noteFromStore;
  const isEdit = Boolean(routeId || note?.id);
  const insets = useSafeAreaInsets();
  const theme = useSettingsStore((s) => s.theme);
  const themeColors = getThemeColors(theme);
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient';

  const user = useUserStore((s) => s.user);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [colorKey, setColorKey] = useState('neutral');
  const [deadline, setDeadline] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const colorAnim = useRef(new Animated.Value(3)).current;

  useEffect(() => {
    if (!note) return;
    setTitle(note.title ?? '');
    setDescription(note.description ?? '');
    setPriority(note.priority ?? 'medium');
    setColorKey(note.color ?? 'neutral');
    setDeadline(note.deadline ? new Date(note.deadline) : null);
  }, [note]);

  useEffect(() => {
    const idx = COLOR_OPTIONS.findIndex((c) => c.key === colorKey);
    if (idx === -1) return;
    Animated.timing(colorAnim, {
      toValue: idx,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [colorAnim, colorKey]);

  const bgColor = useMemo(() => {
    if (theme === 'dark') {
      return themeColors.background;
    }
    return colorAnim.interpolate({
      inputRange: COLOR_OPTIONS.map((_, i) => i),
      outputRange: COLOR_OPTIONS.map((c) => c.hex),
    });
  }, [colorAnim, theme, themeColors.background]);

  const deadlineLabel = deadline
    ? format(deadline, 'dd MMM yyyy')
    : 'No deadline';

  const buildNotePayload = () => ({
    id: note?.id ?? routeId ?? null,
    user_id: note?.user_id ?? user?.id ?? null,
    title: title.trim(),
    description: description.trim() || null,
    priority,
    color: colorKey,
    deadline: deadline ? deadline.toISOString() : null,
    is_completed: note?.is_completed ?? false,
  });

  const onSave = async () => {
    if (saving) return;
    if (!title.trim()) return;
    if (!user?.id && !note?.user_id) {
      Alert.alert('Sign in required', 'Please sign in before pinning a goal.');
      return;
    }
    setSaving(true);
    const payload = buildNotePayload();

    if (isEdit && !payload.id) {
      Alert.alert('Edit failed', 'Missing note id.');
      setSaving(false);
      return;
    }

    const result = isEdit
      ? await editNote(payload.id, payload)
      : await addNote(payload);

    if (result?.error) {
      Alert.alert('Save failed', result.error.message ?? 'Unable to save note.');
      setSaving(false);
      return;
    }

    await Haptics.selectionAsync();
    if (Platform.OS === 'android') {
      ToastAndroid.show('Pinned!', ToastAndroid.SHORT);
    }
    setSaving(false);
    if (navigation.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation.navigate('board');
    }
  };

  const onAddToHomeScreen = async () => {
    if (isExpoGo) {
      Alert.alert(
        'Requires Dev Build',
        'Home screen widgets require a custom dev build. Expo Go does not support react-native-android-widget.'
      );
      return;
    }
    if (!isEdit || !note?.id) {
      Alert.alert('Save first', 'Save this note before adding it to your home screen.');
      return;
    }
    const widgetNote = buildNotePayload();
    const widgetName = WIDGET_NAME_BY_PRIORITY[priority] ?? WIDGET_NAME_BY_PRIORITY.medium;

    await requestWidgetUpdate({
      widgetName,
      renderWidget: async (widgetInfo) => {
        await saveWidgetNote(widgetInfo.widgetId, widgetNote);
        return <PinNestWidget note={widgetNote} />;
      },
      widgetNotFound: () => {
        Alert.alert(
          'Add Widget',
          'To add this note, long-press your home screen → Widgets → PinNest, then choose the size.'
        );
      },
    });

    if (Platform.OS === 'android') {
      ToastAndroid.show('Widget updated', ToastAndroid.SHORT);
    }
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        style={[styles.flex, { paddingBottom: insets.bottom + 8 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.swatchRow, { marginTop: insets.top + 4 }]}>
          {COLOR_OPTIONS.map((swatch) => {
            const active = colorKey === swatch.key;
            return (
              <Pressable
                key={swatch.key}
                onPress={() => setColorKey(swatch.key)}
                style={[
                  styles.swatch,
                  { backgroundColor: swatch.hex },
                  active && styles.swatchActive,
                ]}
              />
            );
          })}
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Your goal..."
          placeholderTextColor={themeColors.mutedText}
          style={[styles.titleInput, { color: themeColors.text }]}
        />

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Add details (optional)..."
          placeholderTextColor={themeColors.mutedText}
          style={[styles.descriptionInput, { color: themeColors.text }]}
          multiline
        />

        <View style={styles.priorityRow}>
          {PRIORITY_OPTIONS.map((opt) => {
            const active = priority === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setPriority(opt.key)}
                style={[
                  styles.priorityPill,
                  active && { backgroundColor: opt.color },
                ]}
              >
                <Text
                  style={[
                    styles.priorityText,
                    { color: themeColors.text },
                    active && { color: PAPER_BEIGE },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => setShowPicker(true)}
          style={[
            styles.deadlineRow,
            { backgroundColor: theme === 'dark' ? themeColors.card : 'rgba(255,255,255,0.35)' },
          ]}
        >
          <Text
            style={[
              styles.deadlineText,
              !deadline && { opacity: 0.6 },
              { color: themeColors.text },
            ]}
          >
            {deadlineLabel}
          </Text>
          {deadline ? (
            <Pressable onPress={() => setDeadline(null)}>
              <Text style={[styles.clearText, { color: themeColors.accent }]}>Clear</Text>
            </Pressable>
          ) : null}
        </Pressable>

        {showPicker ? (
          <DateTimePicker
            value={deadline ?? new Date()}
            mode="date"
            display="default"
            onChange={(_, selected) => {
              setShowPicker(false);
              if (selected) setDeadline(selected);
            }}
          />
        ) : null}

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 6 }]}>
          <Pressable
            onPress={onAddToHomeScreen}
            style={[
              styles.widgetButton,
              { borderColor: themeColors.accent },
              (!isEdit || isExpoGo) && styles.widgetDisabled,
            ]}
            disabled={!isEdit || isExpoGo}
          >
            <Text
              style={[
                styles.widgetText,
                { color: themeColors.accent },
                (!isEdit || isExpoGo) && styles.widgetTextDisabled,
              ]}
            >
              Add to Home Screen
            </Text>
          </Pressable>
          <Pressable onPress={onSave} style={[styles.saveButton, saving && styles.saveDisabled]} disabled={saving}>
            <Text style={styles.saveText}>
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Pin it'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  swatchActive: {
    borderWidth: 2,
    borderColor: TERRACOTTA,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '600',
    color: BROWN,
    marginBottom: 12,
  },
  descriptionInput: {
    fontSize: 14,
    color: BROWN,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  priorityPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: BROWN,
  },
  deadlineRow: {
    marginTop: 22,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: BROWN,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: TERRACOTTA,
  },
  bottomBar: {
    marginTop: 'auto',
    paddingVertical: 18,
    gap: 10,
  },
  widgetButton: {
    borderWidth: 1,
    borderColor: TERRACOTTA,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  widgetText: {
    color: TERRACOTTA,
    fontSize: 14,
    fontWeight: '700',
  },
  widgetDisabled: {
    opacity: 0.5,
  },
  widgetTextDisabled: {
    color: 'rgba(217,122,95,0.7)',
  },
  saveButton: {
    backgroundColor: TERRACOTTA,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  saveDisabled: {
    opacity: 0.7,
  },
  saveText: {
    color: PAPER_BEIGE,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateNoteScreen;
