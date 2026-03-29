import { supabase } from './supabase';

const handle = (data, error) => ({ data, error: error ?? null });

const dayKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getActivityDays = (events) => {
  const set = new Set();
  events.forEach((e) => {
    set.add(dayKey(e.created_at));
  });
  return set;
};

const computeStreak = (activityDays) => {
  let streak = 0;
  let cursor = startOfToday();
  while (activityDays.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

const weekBucketKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Week starts on Monday.
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString();
};

export const getAnalyticsSummary = async (userId) => {
  try {
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id,is_completed,deadline,completed_at,created_at')
      .eq('user_id', userId);
    if (notesError) return handle(null, notesError);

    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('event_type,created_at')
      .eq('user_id', userId)
      .gte('created_at', addDays(new Date(), -120).toISOString());
    if (eventsError) return handle(null, eventsError);

    const totalCreated = notes.length;
    const completedNotes = notes.filter((n) => n.is_completed);
    const totalCompleted = completedNotes.length;
    const completionRate = totalCreated === 0 ? 0 : totalCompleted / totalCreated;

    const activityEvents =
      events?.filter(
        (e) =>
          e.event_type === 'note_completed' ||
          e.event_type === 'note_viewed' ||
          e.event_type === 'streak_day'
      ) ?? [];
    const activityDays = getActivityDays(activityEvents);
    const streak = computeStreak(activityDays);

    const deadlinesSet = notes.filter((n) => n.deadline).length;
    const deadlinesMet = events?.filter((e) => e.event_type === 'deadline_met').length ?? 0;
    const deadlineComponent =
      deadlinesSet === 0 ? 0 : (deadlinesMet / deadlinesSet) * 20;
    const streakComponent = Math.min(streak / 30, 1) * 40;
    const completionComponent = completionRate * 40;
    const consistencyScore = Math.round(
      streakComponent + completionComponent + deadlineComponent
    );

    return handle(
      { streak, completionRate, totalCreated, totalCompleted, consistencyScore },
      null
    );
  } catch (error) {
    return handle(null, error);
  }
};

export const getWeeklyCompletions = async (userId) => {
  try {
    const since = addDays(new Date(), -56).toISOString();
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('created_at,event_type')
      .eq('user_id', userId)
      .eq('event_type', 'note_completed')
      .gte('created_at', since);
    if (error) return handle(null, error);

    const buckets = {};
    (events ?? []).forEach((e) => {
      const key = weekBucketKey(e.created_at);
      buckets[key] = (buckets[key] ?? 0) + 1;
    });

    const weeks = [];
    const start = weekBucketKey(addDays(new Date(), -56));
    let cursor = new Date(start);
    for (let i = 0; i < 8; i += 1) {
      const key = cursor.toISOString();
      weeks.push({ weekStart: key, count: buckets[key] ?? 0 });
      cursor = addDays(cursor, 7);
    }

    return handle(weeks, null);
  } catch (error) {
    return handle(null, error);
  }
};

export const getHeatmapData = async (userId) => {
  try {
    const since = addDays(new Date(), -84).toISOString();
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('created_at,event_type')
      .eq('user_id', userId)
      .gte('created_at', since);
    if (error) return handle(null, error);

    const counts = {};
    (events ?? []).forEach((e) => {
      const key = dayKey(e.created_at);
      counts[key] = (counts[key] ?? 0) + 1;
    });

    const days = [];
    let cursor = addDays(startOfToday(), -83);
    for (let i = 0; i < 84; i += 1) {
      const key = dayKey(cursor);
      days.push({ date: key, count: counts[key] ?? 0 });
      cursor = addDays(cursor, 1);
    }

    return handle(days, null);
  } catch (error) {
    return handle(null, error);
  }
};

export const getPriorityBreakdown = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('priority')
      .eq('user_id', userId);
    if (error) return handle(null, error);

    const breakdown = { high: 0, medium: 0, low: 0 };
    (data ?? []).forEach((n) => {
      if (breakdown[n.priority] !== undefined) breakdown[n.priority] += 1;
    });

    return handle(breakdown, null);
  } catch (error) {
    return handle(null, error);
  }
};

export const getPersonalInsights = async (userId) => {
  try {
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('priority,created_at,completed_at,deadline,is_completed')
      .eq('user_id', userId);
    if (notesError) return handle(null, notesError);

    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('event_type,created_at')
      .eq('user_id', userId)
      .gte('created_at', addDays(new Date(), -365).toISOString());
    if (eventsError) return handle(null, eventsError);

    const insights = [];

    const completed = notes.filter((n) => n.is_completed && n.completed_at);
    const byPriority = { high: [], medium: [], low: [] };
    completed.forEach((n) => {
      const delta =
        (new Date(n.completed_at).getTime() - new Date(n.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      if (byPriority[n.priority]) byPriority[n.priority].push(delta);
    });
    if (byPriority.high.length && byPriority.medium.length) {
      const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const diff = avg(byPriority.medium) - avg(byPriority.high);
      if (diff > 0.5) {
        insights.push(
          `You complete High priority goals about ${Math.round(diff)} days faster on average than Medium ones.`
        );
      }
    }

    const dayCounts = Array(7).fill(0);
    (events ?? []).forEach((e) => {
      const day = new Date(e.created_at).getDay();
      dayCounts[day] += 1;
    });
    const maxDay = dayCounts.indexOf(Math.max(...dayCounts));
    if (dayCounts[maxDay] > 0) {
      const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
        maxDay
      ];
      insights.push(`Your most productive day is ${weekday}.`);
    }

    const deadlinesSet = notes.filter((n) => n.deadline).length;
    const deadlinesMet = (events ?? []).filter((e) => e.event_type === 'deadline_met').length;
    if (deadlinesSet > 0) {
      const pct = Math.round((deadlinesMet / deadlinesSet) * 100);
      insights.push(`You are on track — ${pct}% of your deadlines are met on time.`);
    }

    if (insights.length < 2) {
      const monthBuckets = {};
      completed.forEach((n) => {
        const d = new Date(n.completed_at);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        monthBuckets[key] = (monthBuckets[key] ?? 0) + 1;
      });
      const entries = Object.entries(monthBuckets);
      if (entries.length) {
        const [bestKey, bestCount] = entries.sort((a, b) => b[1] - a[1])[0];
        const [y, m] = bestKey.split('-');
        insights.push(`You completed ${bestCount} goals in ${m}/${y} — your best month yet!`);
      }
    }

    return handle(insights.slice(0, 3), null);
  } catch (error) {
    return handle(null, error);
  }
};
