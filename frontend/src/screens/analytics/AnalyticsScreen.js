import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryPie,
  VictoryScatter,
  VictoryTheme,
} from 'victory-native';
import { format } from 'date-fns';
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
  WARM_BG,
} from '../../constants/colors';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useNotes } from '../../hooks/useNotes';
import { formatDeadline, getUrgencyLevel } from '../../utils/dateHelpers';
import { useSettingsStore } from '../../store/settingsStore';
import { getThemeColors } from '../../utils/themeHelpers';

// note.color is stored as a string name in DB — map to hex for backgroundColor.
const COLOR_MAP = {
  yellow: NOTE_YELLOW,
  green: NOTE_GREEN,
  blue: NOTE_BLUE,
  neutral: NOTE_NEUTRAL,
};

const HEATMAP_COLS = 14;
const HEATMAP_ROWS = 7;
const HEATMAP_CELL = 12;
const HEATMAP_GAP = 4;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const dateKey = (date) => startOfDay(date).toDateString();

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getConsistencyColor = (score) => {
  if (score >= 70) return MUTED_GREEN;
  if (score >= 40) return '#D8A35B';
  return TERRACOTTA;
};

const getHeatmapColor = (count) => {
  if (count >= 3) return TERRACOTTA;
  if (count === 2) return 'rgba(217,122,95,0.65)';
  if (count === 1) return 'rgba(217,122,95,0.35)';
  return 'rgba(139,94,60,0.08)';
};

const SkeletonBlock = ({ height }) => (
  <View style={[styles.skeleton, { height }]} />
);

const AnalyticsScreen = () => {
  const theme = useSettingsStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const insets = useSafeAreaInsets();
  const {
    summary,
    weeklyCompletions,
    heatmapData,
    priorityBreakdown,
    insights,
    loading,
    refresh,
  } = useAnalytics();
  const { notes } = useNotes();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const completionPct = Math.round((summary.completionRate || 0) * 100);
  const [chartWidth, setChartWidth] = useState(0);
  const [heatmapCell, setHeatmapCell] = useState(HEATMAP_CELL);

  const heatmapColumns = useMemo(() => {
    if (!heatmapData?.length) return [];
    const end = startOfDay(new Date());
    const start = addDays(end, -97);
    const startMonday = addDays(start, -((start.getDay() + 6) % 7));
    const dateToCount = new Map(
      heatmapData.map((d) => [dateKey(d.date), d.count ?? 0])
    );

    const cols = [];
    for (let col = 0; col < HEATMAP_COLS; col += 1) {
      const cells = [];
      for (let row = 0; row < HEATMAP_ROWS; row += 1) {
        const date = addDays(startMonday, col * 7 + row);
        const inRange = date >= start && date <= end;
        const key = dateKey(date);
        cells.push({
          date,
          count: inRange ? dateToCount.get(key) ?? 0 : null,
          inRange,
        });
      }
      cols.push(cells);
    }
    return cols;
  }, [heatmapData]);

  const heatmapMonthLabels = useMemo(() => {
    if (!heatmapData?.length) return [];
    const labels = [];
    const end = startOfDay(new Date());
    const start = addDays(end, -97);
    const startMonday = addDays(start, -((start.getDay() + 6) % 7));
    let lastMonth = -1;
    for (let col = 0; col < HEATMAP_COLS; col += 1) {
      const date = addDays(startMonday, col * 7);
      if (date < start || date > end) {
        labels.push('');
        continue;
      }
      if (date.getMonth() !== lastMonth) {
        labels.push(format(date, 'MMM'));
        lastMonth = date.getMonth();
      } else {
        labels.push('');
      }
    }
    return labels;
  }, [heatmapData]);

  const weeklySeries = weeklyCompletions?.length
    ? weeklyCompletions.map((w, idx) => ({
        x: idx + 1,
        y: w.count ?? 0,
        label: w.weekStart ? format(new Date(w.weekStart), 'MMM d') : `W${idx + 1}`,
      }))
    : [];
  const maxWeekly = weeklySeries.reduce((max, d) => Math.max(max, d.y), 0);
  const weeklyLabelSet = new Set(
    weeklySeries.filter((_, idx) => idx % 3 === 0).map((d) => d.label)
  );

  const priorityData = [
    { x: 'High', y: priorityBreakdown.high ?? 0, color: TERRACOTTA },
    { x: 'Medium', y: priorityBreakdown.medium ?? 0, color: MUTED_GREEN },
    { x: 'Low', y: priorityBreakdown.low ?? 0, color: DUSTY_BLUE },
  ];

  const upcoming = useMemo(() => {
    const active = notes.filter((n) => !n.is_completed && n.deadline);
    return active
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);
  }, [notes]);

  const cardStyle = { backgroundColor: colors.card, shadowColor: colors.shadow };
  const textStyle = { color: colors.text };
  const mutedTextStyle = { color: colors.mutedText };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 16, paddingTop: insets.top + 6 },
      ]}
    >
      <LinearGradient
        colors={theme === 'dark' ? [colors.card, colors.background] : ['#F3E3B3', WARM_BG]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.heroCard, cardStyle]}
      >
        {loading ? (
          <SkeletonBlock height={80} />
        ) : (
          <>
            <Text style={styles.heroEmoji}>🔥</Text>
            <Text style={styles.heroNumber}>{summary.streak ?? 0}</Text>
            <Text style={[styles.heroLabel, textStyle]}>day streak</Text>
            <Text style={[styles.heroSub, mutedTextStyle]}>
              Best: {summary.streak ?? 0} days
            </Text>
          </>
        )}
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={[styles.card, styles.statCard, cardStyle]}>
          <Text style={[styles.cardTitle, mutedTextStyle]}>Completion</Text>
          {loading ? (
            <SkeletonBlock height={70} />
          ) : (
            <VictoryPie
              data={[
                // Guard: VictoryPie crashes if both y values are 0.
                // Ensure at least a hairline slice is always present.
                { x: 1, y: Math.max(completionPct, 0.5) },
                { x: 2, y: Math.max(100 - completionPct, 0.5) },
              ]}
              width={120}
              height={120}
              innerRadius={36}
              labels={() => null}
              colorScale={[TERRACOTTA, 'rgba(139,94,60,0.1)']}
            />
          )}
          {!loading ? (
            <Text style={[styles.statValue, textStyle]}>{completionPct}%</Text>
          ) : null}
        </View>

        <View style={[styles.card, styles.statCard, cardStyle]}>
          <Text style={[styles.cardTitle, mutedTextStyle]}>Consistency</Text>
          {loading ? (
            <SkeletonBlock height={70} />
          ) : (
            <Text
              style={[
                styles.scoreValue,
                { color: getConsistencyColor(summary.consistencyScore ?? 0) },
              ]}
            >
              {summary.consistencyScore ?? 0}
            </Text>
          )}
          {!loading ? (
            <Text style={[styles.scoreLabel, mutedTextStyle]}>/ 100</Text>
          ) : null}
        </View>

        <View style={[styles.card, styles.statCard, cardStyle]}>
          <Text style={[styles.cardTitle, mutedTextStyle]}>Total Pinned</Text>
          {loading ? (
            <SkeletonBlock height={70} />
          ) : (
            <Text style={[styles.scoreValue, textStyle]}>
              {summary.totalCreated ?? 0}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.card, cardStyle]}>
        <Text style={[styles.sectionTitle, textStyle]}>Activity Heatmap</Text>
        {loading ? (
          <SkeletonBlock height={120} />
        ) : (
          <View style={styles.heatmapWrap}>
            <View style={styles.heatmapRowLabels}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
                <Text
                  key={`${d}-${idx}`}
                  style={[
                    styles.heatmapLabel,
                    mutedTextStyle,
                    {
                      height: heatmapCell,
                      lineHeight: heatmapCell,
                      marginBottom: idx === HEATMAP_ROWS - 1 ? 0 : HEATMAP_GAP,
                    },
                  ]}
                >
                  {d}
                </Text>
              ))}
            </View>
            <View
              style={styles.heatmapGrid}
              onLayout={(e) => {
                const width = e.nativeEvent.layout.width;
                const cell = Math.floor(
                  (width - HEATMAP_GAP * (HEATMAP_COLS - 1)) / HEATMAP_COLS
                );
                if (cell && cell !== heatmapCell) setHeatmapCell(cell);
              }}
            >
              <View style={styles.heatmapColumns}>
                  {heatmapColumns.map((col, colIdx) => (
                    <View key={`col-${colIdx}`} style={styles.heatmapColumn}>
                      {col.map((cell, rowIdx) => (
                        <View
                          key={`cell-${colIdx}-${rowIdx}`}
                          style={[
                            styles.heatmapCell,
                            {
                              backgroundColor: cell.inRange
                                ? getHeatmapColor(cell.count || 0)
                                : 'transparent',
                              opacity: cell.inRange ? 1 : 0.25,
                              width: heatmapCell,
                              height: heatmapCell,
                              marginBottom: rowIdx === HEATMAP_ROWS - 1 ? 0 : HEATMAP_GAP,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  ))}
              </View>
              <View style={styles.heatmapMonthRow}>
                {heatmapMonthLabels.map((label, idx) => (
                  <Text
                    key={`label-${idx}`}
                    style={[styles.heatmapMonthLabel, mutedTextStyle, { width: heatmapCell }]}
                  >
                    {label}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      <View
        style={[styles.card, cardStyle]}
        onLayout={(e) => {
          setChartWidth(e.nativeEvent.layout.width);
        }}
      >
        <Text style={[styles.sectionTitle, textStyle]}>Weekly Completions</Text>
        {loading ? (
          <SkeletonBlock height={160} />
        ) : (
          weeklySeries.length < 2 ? (
            // VictoryLine needs at least 2 data points — show a placeholder instead.
            <Text style={[styles.emptyNote, mutedTextStyle]}>Not enough data yet</Text>
          ) : (
            <>
              <VictoryChart
                width={Math.max(280, chartWidth || 320)}
                height={180}
                theme={VictoryTheme.material}
                domain={{ y: [0, Math.max(maxWeekly, 1)] }}
                domainPadding={{ y: 10 }}
              >
                <VictoryAxis
                  tickValues={[]}
                  tickFormat={() => ''}
                  style={{
                    axis: { stroke: 'transparent' },
                    ticks: { stroke: 'transparent' },
                    tickLabels: { fontSize: 0, padding: 0 },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickCount={4}
                  style={{
                    axis: { stroke: 'transparent' },
                    ticks: { stroke: 'transparent' },
                    tickLabels: { fill: colors.text, fontSize: 10 },
                    grid: { stroke: 'rgba(139,94,60,0.15)' },
                  }}
                />
                <VictoryLine
                  interpolation="natural"
                  data={weeklySeries}
                  style={{ data: { stroke: TERRACOTTA, strokeWidth: 3 } }}
                />
                <VictoryScatter
                  data={weeklySeries}
                  size={3}
                  style={{ data: { fill: TERRACOTTA } }}
                  labels={({ datum }) => (weeklyLabelSet.has(datum.label) ? datum.label : '')}
                  labelComponent={
                    <Text style={[styles.weeklyInlineLabel, mutedTextStyle]} />
                  }
                />
              </VictoryChart>
            </>
          )
        )}
      </View>

      <View style={[styles.card, cardStyle]}>
        <Text style={[styles.sectionTitle, textStyle]}>Priority Breakdown</Text>
        {loading ? (
          <SkeletonBlock height={160} />
        ) : (
          <View style={styles.pieWrap}>
            <VictoryPie
              data={priorityData}
              width={200}
              height={200}
              innerRadius={60}
              labels={() => null}
              colorScale={priorityData.map((d) => d.color)}
            />
            <View style={styles.legend}>
              {priorityData.map((item) => (
                <View key={item.x} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, textStyle]}>
                    {item.x}: {item.y}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={[styles.card, cardStyle]}>
        <Text style={[styles.sectionTitle, textStyle]}>Upcoming Deadlines</Text>
        {loading ? (
          <SkeletonBlock height={120} />
        ) : upcoming.length ? (
          upcoming.map((note) => {
            const urgency = getUrgencyLevel(note.deadline);
            const badgeColor =
              urgency === 'overdue' || urgency === 'critical'
                ? TERRACOTTA
                : urgency === 'warning'
                ? '#D8A35B'
                : MUTED_GREEN;
            return (
              <View key={note.id} style={styles.deadlineRow}>
                <View
                  style={[
                    styles.deadlineDot,
                    { backgroundColor: COLOR_MAP[note.color] ?? NOTE_NEUTRAL },
                  ]}
                />
                <Text style={[styles.deadlineTitle, textStyle]} numberOfLines={1}>
                  {note.title}
                </Text>
                <View style={[styles.deadlineBadge, { backgroundColor: badgeColor }]}>
                  <Text style={styles.deadlineBadgeText}>
                    {formatDeadline(note.deadline)}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={[styles.emptyNote, mutedTextStyle]}>No upcoming deadlines</Text>
        )}
      </View>

      <View style={styles.insightsWrap}>
        {loading ? (
          <SkeletonBlock height={100} />
        ) : (
          insights.map((text, idx) => (
            <View
              key={`insight-${idx}`}
              style={[
                styles.insightCard,
                { backgroundColor: colors.card, shadowColor: colors.shadow },
                idx % 2 === 0 && styles.insightAlt,
              ]}
            >
              <Text style={styles.insightEmoji}>💡</Text>
              <Text style={[styles.insightText, textStyle]}>{text}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM_BG,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: PAPER_BEIGE,
    borderRadius: 16,
    padding: 14,
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  heroEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  heroNumber: {
    fontSize: 46,
    fontWeight: '800',
    color: TERRACOTTA,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BROWN,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 12,
    color: BROWN,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BROWN,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: BROWN,
    marginTop: -8,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
    color: BROWN,
  },
  scoreLabel: {
    fontSize: 12,
    color: BROWN,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BROWN,
    marginBottom: 8,
  },
  heatmapWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  heatmapRowLabels: {
    width: 18,
    paddingTop: 1,
  },
  heatmapLabel: {
    fontSize: 10,
    color: BROWN,
    opacity: 0.6,
    height: HEATMAP_CELL,
  },
  heatmapGrid: {
    flex: 1,
  },
  heatmapColumns: {
    flexDirection: 'row',
    gap: HEATMAP_GAP,
  },
  heatmapColumn: {},
  heatmapCell: {
    width: HEATMAP_CELL,
    height: HEATMAP_CELL,
    borderRadius: 3,
  },
  heatmapMonthRow: {
    flexDirection: 'row',
    gap: HEATMAP_GAP,
    marginTop: 6,
  },
  heatmapMonthLabel: {
    width: HEATMAP_CELL,
    textAlign: 'center',
    fontSize: 8,
    color: BROWN,
    opacity: 0.6,
  },
  weeklyInlineLabel: {
    fontSize: 8,
    position: 'absolute',
    top: 10,
  },
  pieWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legend: {
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: BROWN,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deadlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: NOTE_NEUTRAL,
  },
  deadlineTitle: {
    flex: 1,
    fontSize: 12,
    color: BROWN,
    marginRight: 8,
  },
  deadlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  deadlineBadgeText: {
    fontSize: 10,
    color: PAPER_BEIGE,
    fontWeight: '600',
  },
  emptyNote: {
    fontSize: 12,
    color: BROWN,
    opacity: 0.7,
  },
  insightsWrap: {
    gap: 10,
  },
  insightCard: {
    backgroundColor: NOTE_NEUTRAL,
    borderRadius: 14,
    padding: 12,
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    transform: [{ rotate: '-1deg' }],
  },
  insightAlt: {
    transform: [{ rotate: '1deg' }],
  },
  insightEmoji: {
    fontSize: 16,
    marginBottom: 6,
  },
  insightText: {
    fontSize: 12,
    color: BROWN,
    lineHeight: 18,
  },
  skeleton: {
    width: '100%',
    backgroundColor: 'rgba(139,94,60,0.12)',
    borderRadius: 12,
  },
});

export default AnalyticsScreen;
