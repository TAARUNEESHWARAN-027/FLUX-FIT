import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthProvider';
import { analyticsService, type HeatmapCell, type WeeklyTrend, type InsightsSummary } from '@/services/analyticsService';

export type { HeatmapCell, WeeklyTrend, InsightsSummary };

export function useAnalytics() {
    const { user } = useAuthContext();
    const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
    const [trends, setTrends] = useState<WeeklyTrend[]>([]);
    const [summary, setSummary] = useState<InsightsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        try {
            const [h, t, s] = await Promise.all([
                analyticsService.getHeatmap(user.id, 90),
                analyticsService.getWeeklyTrends(user.id, 8),
                analyticsService.getSummary(user.id),
            ]);
            setHeatmap(h);
            setTrends(t);
            setSummary(s);
        } catch (e) {
            console.warn('useAnalytics: failed', e);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return { heatmap, trends, summary, loading, refetch: fetchAll };
}
