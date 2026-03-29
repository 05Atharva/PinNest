const MS_PER_DAY = 1000 * 60 * 60 * 24;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (from, to) => {
  const diff = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(diff / MS_PER_DAY);
};

export const formatDeadline = (isoString) => {
  if (!isoString) return '';
  const now = new Date();
  const target = new Date(isoString);
  const days = daysBetween(now, target);

  if (days > 1) return `${days} days left`;
  if (days === 1) return 'Due tomorrow';
  if (days === 0) return 'Due today';
  if (days === -1) return 'Overdue by 1 day';
  return `Overdue by ${Math.abs(days)} days`;
};

export const getUrgencyLevel = (isoString) => {
  if (!isoString) return 'safe';
  const now = new Date();
  const target = new Date(isoString);
  const days = daysBetween(now, target);

  if (days < 0) return 'overdue';
  if (days <= 3) return 'critical';
  if (days <= 14) return 'warning';
  return 'safe';
};

export const formatStreak = (days) => {
  const count = Number.isFinite(days) ? days : 0;
  return `🔥 ${count}-day streak`;
};
