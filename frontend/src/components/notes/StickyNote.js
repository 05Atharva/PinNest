import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BROWN,
  MUTED_GREEN,
  NOTE_YELLOW,
  TERRACOTTA,
} from '../../constants/colors';
import { getPinColor, getPrioritySize } from '../../utils/priorityHelpers';
import { formatDeadline, getUrgencyLevel } from '../../utils/dateHelpers';

const toRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
  const cleaned = hex.replace('#', '');
  const isShort = cleaned.length === 3;
  const full = isShort
    ? cleaned
        .split('')
        .map((c) => c + c)
        .join('')
    : cleaned;
  const intVal = parseInt(full, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const getUrgencyBg = (urgency) => {
  switch (urgency) {
    case 'warning':
      return NOTE_YELLOW;
    case 'critical':
    case 'overdue':
      return TERRACOTTA;
    case 'safe':
    default:
      return MUTED_GREEN;
  }
};

const StickyNote = ({ note, onPress, onLongPress, style }) => {
  const { width, height } = getPrioritySize(note.priority);
  const rotation = useMemo(() => {
    const deg = (Math.random() * 6 - 3).toFixed(2);
    return `${deg}deg`;
  }, []);
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();
  }, [scale]);

  const pinColor = getPinColor(note.priority);
  const backgroundColor = toRgba(note.color, 0.92);
  const deadlineText = note.deadline ? formatDeadline(note.deadline) : null;
  const urgency = getUrgencyLevel(note.deadline);
  const urgencyBg = getUrgencyBg(urgency);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { width, height, transform: [{ rotate: rotation }, { scale }] },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={[styles.note, { backgroundColor }]}
      >
        <View style={styles.pinWrap}>
          <View style={[styles.pin, { backgroundColor: pinColor }]} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              numberOfLines={2}
              style={[styles.title, note.is_completed && styles.titleCompleted]}
            >
              {note.title}
            </Text>
            {note.is_completed ? <Text style={styles.check}>✓</Text> : null}
            {note.is_completed ? <View style={styles.strike} /> : null}
          </View>
          {note.description ? (
            <Text numberOfLines={3} style={styles.description}>
              {note.description}
            </Text>
          ) : null}
        </View>

        {deadlineText ? (
          <View style={[styles.deadlineBadge, { backgroundColor: urgencyBg }]}>
            <Text style={styles.deadlineText}>{deadlineText}</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
  note: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  pinWrap: {
    alignItems: 'center',
    marginTop: -2,
  },
  pin: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    flex: 1,
    marginTop: 6,
  },
  titleRow: {
    position: 'relative',
    paddingRight: 16,
    minHeight: 22,
  },
  title: {
    color: BROWN,
    fontSize: 16,
    fontWeight: '600',
  },
  titleCompleted: {
    opacity: 0.7,
  },
  strike: {
    position: 'absolute',
    left: -2,
    right: 12,
    top: '55%',
    height: 1.5,
    backgroundColor: MUTED_GREEN,
    transform: [{ rotate: '-6deg' }],
  },
  check: {
    position: 'absolute',
    right: 0,
    top: 2,
    color: MUTED_GREEN,
    fontSize: 14,
  },
  description: {
    color: BROWN,
    fontSize: 12,
    opacity: 0.75,
    marginTop: 4,
  },
  deadlineBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  deadlineText: {
    color: BROWN,
    fontSize: 10,
    fontWeight: '600',
  },
});

export default StickyNote;
