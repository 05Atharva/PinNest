import { useCallback, useEffect, useState } from 'react';
import {
  getAnalyticsSummary,
  getHeatmapData,
  getPersonalInsights,
  getPriorityBreakdown,
  getWeeklyCompletions,
} from '../services/analyticsService';
import { useUserStore } from '../store/userStore';

const DEFAULT_SUMMARY = {
  streak: 0,
  completionRate: 0,
  totalCreated: 0,
  totalCompleted: 0,
  consistencyScore: 0,
};

/**
 * Loads all analytics data for the current user.
 * Returns { summary, weeklyCompletions, heatmapData, priorityBreakdown, insights, loading, error, refresh }
 */
export const useAnalytics = () => {
  const user = useUserStore((s) => s.user);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [weeklyCompletions, setWeeklyCompletions] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [priorityBreakdown, setPriorityBreakdown] = useState({ high: 0, medium: 0, low: 0 });
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    const [summaryRes, weeklyRes, heatmapRes, priorityRes, insightsRes] = await Promise.all([
      getAnalyticsSummary(user.id),
      getWeeklyCompletions(user.id),
      getHeatmapData(user.id),
      getPriorityBreakdown(user.id),
      getPersonalInsights(user.id),
    ]);

    if (summaryRes.error || weeklyRes.error || heatmapRes.error || priorityRes.error || insightsRes.error) {
      const firstError =
        summaryRes.error || weeklyRes.error || heatmapRes.error || priorityRes.error || insightsRes.error;
      setError(firstError?.message ?? 'Failed to load analytics');
    }

    if (summaryRes.data) setSummary(summaryRes.data);
    if (weeklyRes.data) setWeeklyCompletions(weeklyRes.data);
    if (heatmapRes.data) setHeatmapData(heatmapRes.data);
    if (priorityRes.data) setPriorityBreakdown(priorityRes.data);
    if (insightsRes.data) setInsights(insightsRes.data);

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    summary,
    weeklyCompletions,
    heatmapData,
    priorityBreakdown,
    insights,
    loading,
    error,
    refresh: load,
  };
};
