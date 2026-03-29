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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { requestWidgetUpdate } from 'react-native-android-widget';
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
  const note = route.params?.note ?? null;
  const isEdit = Boolean(note?.id);

  const { addNote, editNote } = useNotes();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [colorKey, setColorKey] = useState('neutral');
  const [deadline, setDeadline] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

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

  const bgColor = useMemo(
    () =>
      colorAnim.interpolate({
        inputRange: COLOR_OPTIONS.map((_, i) => i),
        outputRange: COLOR_OPTIONS.map((c) => c.hex),
      }),
    [colorAnim]
  );

  const deadlineLabel = deadline
    ? format(deadline, 'dd MMM yyyy')
    : 'No deadline';

  const buildNotePayload = () => ({
    id: note?.id,
    title: title.trim(),
    description: description.trim() || null,
    priority,
    color: colorKey,
    deadline: deadline ? deadline.toISOString() : null,
    is_completed: note?.is_completed ?? false,
  });

  const onSave = async () => {
    if (!title.trim()) return;
    const payload = buildNotePayload();

    if (isEdit) {
      await editNote(note.id, payload);
    } else {
      await addNote(payload);
    }

    await Haptics.selectionAsync();
    if (Platform.OS === 'android') {
      ToastAndroid.show('Pinned!', ToastAndroid.SHORT);
    }
    navigation.goBack();
  };

  const onAddToHomeScreen = async () => {
    if (!isEdit || !note?.id) return;
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
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.swatchRow}>
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
          placeholderTextColor={BROWN}
          style={styles.titleInput}
        />

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Add details (optional)..."
          placeholderTextColor={BROWN}
          style={styles.descriptionInput}
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
                    active && { color: PAPER_BEIGE },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => setShowPicker(true)} style={styles.deadlineRow}>
          <Text
            style={[
              styles.deadlineText,
              !deadline && { opacity: 0.6 },
            ]}
          >
            {deadlineLabel}
          </Text>
          {deadline ? (
            <Pressable onPress={() => setDeadline(null)}>
              <Text style={styles.clearText}>Clear</Text>
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

        <View style={styles.bottomBar}>
          {isEdit ? (
            <Pressable onPress={onAddToHomeScreen} style={styles.widgetButton}>
              <Text style={styles.widgetText}>Add to Home Screen</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onSave} style={styles.saveButton}>
            <Text style={styles.saveText}>
              {isEdit ? 'Save changes' : 'Pin it'}
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
  saveButton: {
    backgroundColor: TERRACOTTA,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  saveText: {
    color: PAPER_BEIGE,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateNoteScreen;
