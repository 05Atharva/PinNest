import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import {
  BROWN,
  NOTE_BLUE,
  NOTE_GREEN,
  NOTE_NEUTRAL,
  NOTE_YELLOW,
  TERRACOTTA,
} from '../constants/colors';
import { getPinColor } from '../utils/priorityHelpers';
import { formatDeadline, getUrgencyLevel } from '../utils/dateHelpers';

// Widget providers are configured in app.json.
// Users must add the widget manually from the Android widget picker:
// Long-press home screen -> Widgets -> PinNest -> choose size.
export const WIDGET_NAME_BY_PRIORITY = {
  high: 'PinNestWidgetLarge',
  medium: 'PinNestWidgetMedium',
  low: 'PinNestWidgetSmall',
};

const COLOR_MAP = {
  yellow: NOTE_YELLOW,
  green: NOTE_GREEN,
  blue: NOTE_BLUE,
  neutral: NOTE_NEUTRAL,
};

const toRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string') return `rgba(0, 0, 0, ${alpha})`;
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
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getDeadlineColor = (urgency) => {
  if (urgency === 'overdue') return TERRACOTTA;
  return toRgba(BROWN, 0.7);
};

const PinNestWidget = ({ note }) => {
  const pinColor = getPinColor(note.priority);
  const colorHex = COLOR_MAP[note.color] ?? NOTE_NEUTRAL;
  const backgroundColor = toRgba(colorHex, 0.92);
  const deadlineText = note.deadline ? formatDeadline(note.deadline) : '';
  const urgency = getUrgencyLevel(note.deadline);

  return (
    <FlexWidget
      clickAction="OPEN_NOTE"
      clickActionData={{ note }}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        padding: 10,
        borderRadius: 12,
        backgroundColor,
      }}
    >
      <FlexWidget style={{ width: 'match_parent', alignItems: 'center' }}>
        <FlexWidget
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: pinColor,
          }}
        />
      </FlexWidget>

      <TextWidget
        text={note.title ?? ''}
        maxLines={2}
        style={{
          color: BROWN,
          fontSize: 14,
          fontWeight: '700',
          textAlign: 'center',
          marginTop: 6,
        }}
      />

      {deadlineText ? (
        <TextWidget
          text={deadlineText}
          maxLines={1}
          style={{
            color: getDeadlineColor(urgency),
            fontSize: 10,
            textAlign: 'center',
            marginTop: 4,
          }}
        />
      ) : null}
    </FlexWidget>
  );
};

export default PinNestWidget;
