import {
  NOTE_YELLOW,
  NOTE_GREEN,
  NOTE_BLUE,
  TERRACOTTA,
  MUTED_GREEN,
  DUSTY_BLUE,
} from '../constants/colors';

export const getPrioritySize = (priority) => {
  switch (priority) {
    case 'high':
      return { width: 160, height: 160 };
    case 'medium':
      return { width: 160, height: 80 };
    case 'low':
      return { width: 80, height: 80 };
    default:
      return { width: 160, height: 80 };
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return NOTE_YELLOW;
    case 'medium':
      return NOTE_GREEN;
    case 'low':
      return NOTE_BLUE;
    default:
      return NOTE_GREEN;
  }
};

export const getPinColor = (priority) => {
  switch (priority) {
    case 'high':
      return TERRACOTTA;
    case 'medium':
      return MUTED_GREEN;
    case 'low':
      return DUSTY_BLUE;
    default:
      return TERRACOTTA;
  }
};

export const getWidgetCells = (priority) => {
  switch (priority) {
    case 'high':
      return '2x2';
    case 'medium':
      return '2x1';
    case 'low':
      return '1x1';
    default:
      return '2x1';
  }
};
