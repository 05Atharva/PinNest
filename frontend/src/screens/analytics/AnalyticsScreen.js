import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryPie,
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

// note.color is stored as a string name in DB — map to hex for backgroundColor.
const COLOR_MAP = {
  yellow: NOTE_YELLOW,
  green: NOTE_GREEN,
  blue: NOTE_BLUE,
  neutral: NOTE_NEUTRAL,
};

const HEATMAP_COLS = 12;
const HEATMAP_ROWS = 7;

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
  const {
    summary,
    weeklyCompletions,
    heatmapData,
    priorityBreakdown,
    insights,
    loading,
  } = useAnalytics();
  const { notes } = useNotes();

  const completionPct = Math.round((summary.completionRate || 0) * 100);

  const heatmapGrid = useMemo(() => {
    if (!heatmapData?.length) return [];
    const grid = Array.from({ length: HEATMAP_ROWS }, () => []);
    for (let col = 0; col < HEATMAP_COLS; col += 1) {
      for (let row = 0; row < HEATMAP_ROWS; row += 1) {
        const idx = col * HEATMAP_ROWS + row;
        const item = heatmapData[idx];
        grid[row][col] = item ?? { date: null, count: 0 };
      }
    }
    return grid;
  }, [heatmapData]);

  const heatmapLabels = useMemo(() => {
    if (!heatmapData?.length) return [];
    const labels = [];
    for (let col = 0; col < HEATMAP_COLS; col += 1) {
      const idx = col * HEATMAP_ROWS;
      const item = heatmapData[idx];
      if (!item?.date) {
        labels.push('');
      } else {
        labels.push(format(new Date(item.date), 'MMM d'));
      }
    }
    return labels;
  }, [heatmapData]);

  const weeklySeries = weeklyCompletions?.length
    ? weeklyCompletions.map((w, idx) => ({ x: idx + 1, y: w.count ?? 0 }))
    : [];

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={['#F3E3B3', WARM_BG]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.heroCard]}
      >
        {loading ? (
          <SkeletonBlock height={80} />
        ) : (
          <>
            <Text style={styles.heroEmoji}>🔥</Text>
            <Text style={styles.heroNumber}>{summary.streak ?? 0}</Text>
            <Text style={styles.heroLabel}>day streak</Text>
            <Text style={styles.heroSub}>Best: {summary.streak ?? 0} days</Text>
          </>
        )}
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={[styles.card, styles.statCard]}>
          <Text style={styles.cardTitle}>Completion</Text>
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
            <Text style={styles.statValue}>{completionPct}%</Text>
          ) : null}
        </View>

        <View style={[styles.card, styles.statCard]}>
          <Text style={styles.cardTitle}>Consistency</Text>
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
            <Text style={styles.scoreLabel}>/ 100</Text>
          ) : null}
        </View>

        <View style={[styles.card, styles.statCard]}>
          <Text style={styles.cardTitle}>Total Pinned</Text>
          {loading ? (
            <SkeletonBlock height={70} />
          ) : (
            <Text style={styles.scoreValue}>{summary.totalCreated ?? 0}</Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Activity Heatmap</Text>
        {loading ? (
          <SkeletonBlock height={120} />
        ) : (
          <View style={styles.heatmapWrap}>
            <View style={styles.heatmapRowLabels}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => (
                <Text key={d} style={styles.heatmapLabel}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.heatmapGrid}>
              {heatmapGrid.map((row, rowIdx) => (
                <View key={`row-${rowIdx}`} style={styles.heatmapRow}>
                  {row.map((cell, colIdx) => (
                    <View
                      key={`cell-${rowIdx}-${colIdx}`}
                      style={[
                        styles.heatmapCell,
                        { backgroundColor: getHeatmapColor(cell.count || 0) },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}
        {!loading ? (
          <View style={styles.heatmapAxis}>
            {heatmapLabels.map((label, idx) => (
              <Text key={`label-${idx}`} style={styles.heatmapAxisLabel}>
                {idx % 3 === 0 ? label : ''}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Weekly Completions</Text>
        {loading ? (
          <SkeletonBlock height={160} />
        ) : (
          {weeklySeries.length < 2 ? (
            // VictoryLine needs at least 2 data points to render — show placeholder.
            <Text style={styles.emptyNote}>Not enough data yet</Text>
          ) : (
            <VictoryChart
              width={320}
              height={180}
              theme={VictoryTheme.material}
              domainPadding={{ y: 10 }}
            >
              <VictoryAxis
                tickFormat={() => ''}
                style={{ axis: { stroke: 'transparent' }, ticks: { stroke: 'transparent' } }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: 'transparent' },
                  ticks: { stroke: 'transparent' },
                  tickLabels: { fill: BROWN, fontSize: 10 },
                  grid: { stroke: 'rgba(139,94,60,0.1)' },
                }}
              />
              <VictoryLine
                interpolation="natural"
                data={weeklySeries}
                style={{ data: { stroke: TERRACOTTA, strokeWidth: 3 } }}
              />
            </VictoryChart>
          )}
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Priority Breakdown</Text>
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
                  <Text style={styles.legendText}>
                    {item.x}: {item.y}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
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
                <Text style={styles.deadlineTitle} numberOfLines={1}>
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
          <Text style={styles.emptyNote}>No upcoming deadlines</Text>
        )}
      </View>

      <View style={styles.insightsWrap}>
        {loading ? (
          <SkeletonBlock height={100} />
        ) : (
          insights.map((text, idx) => (
            <View
              key={`insight-${idx}`}
              style={[styles.insightCard, idx % 2 === 0 && styles.insightAlt]}
            >
              <Text style={styles.insightEmoji}>💡</Text>
              <Text style={styles.insightText}>{text}</Text>
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
    gap: 6,
    paddingTop: 2,
  },
  heatmapLabel: {
    fontSize: 10,
    color: BROWN,
    opacity: 0.6,
  },
  heatmapGrid: {
    flex: 1,
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  heatmapCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  heatmapAxis: {
    flexDirection: 'row',
    marginTop: 6,
    justifyContent: 'space-between',
  },
  heatmapAxisLabel: {
    fontSize: 9,
    color: BROWN,
    opacity: 0.6,
    width: 22,
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
