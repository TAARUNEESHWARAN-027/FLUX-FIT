import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthProvider';
import { healthScoreService, type HealthScoreBreakdown, type HealthScoreHistory } from '@/services/healthScoreService';

export type { HealthScoreBreakdown, HealthScoreHistory };

export function useHealthScore() {
    const { user } = useAuthContext();
    const [score, setScore] = useState<HealthScoreBreakdown | null>(null);
    const [history, setHistory] = useState<HealthScoreHistory[]>([]);
    const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
    const [loading, setLoading] = useState(true);

    const fetchScore = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        try {
            const [s, h, t] = await Promise.all([
                healthScoreService.computeTodayScore(user.id),
                healthScoreService.getHistory(user.id, 7),
                healthScoreService.getTrend(user.id),
            ]);
            setScore(s);
            setHistory(h);
            setTrend(t);
        } catch (e) {
            console.warn('useHealthScore: Failed', e);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchScore(); }, [fetchScore]);

    return { score, history, trend, loading, refetch: fetchScore };
}
