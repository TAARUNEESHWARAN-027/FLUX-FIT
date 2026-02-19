import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthProvider';

export interface DashboardStats {
    workoutCompliance: number;
    workoutChange: number;
    dietAdherence: number;
    dietChange: number;
    recoveryScore: number;
    recoveryChange: number;
    daysSinceStart: number;
}

const DEFAULT_STATS: DashboardStats = {
    workoutCompliance: 0,
    workoutChange: 0,
    dietAdherence: 0,
    dietChange: 0,
    recoveryScore: 0,
    recoveryChange: 0,
    daysSinceStart: 1,
};

export function useStats() {
    const { user } = useAuthContext();
    const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const weekAgo = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];

        let workoutCompliance = 0;
        let dietAdherence = 0;
        let recoveryScore = 0;
        let daysSinceStart = 1;

        try {
            // Get workout logs this week
            const { data: workoutLogs } = await supabase
                .from('workout_logs')
                .select('adherence_score')
                .eq('user_id', user.id)
                .gte('date', weekAgo)
                .lte('date', todayStr);

            workoutCompliance = workoutLogs && workoutLogs.length > 0
                ? Math.round(workoutLogs.reduce((s, l) => s + (l.adherence_score || 0), 0) / workoutLogs.length)
                : 0;
        } catch { /* ignore */ }

        try {
            // Get nutrition data
            const { data: mealLogs } = await supabase
                .from('meal_logs')
                .select('calories')
                .eq('user_id', user.id)
                .eq('date', todayStr);

            const { data: targets } = await supabase
                .from('nutrition_targets')
                .select('calories')
                .eq('user_id', user.id)
                .single();

            const totalCal = mealLogs?.reduce((s, m) => s + (m.calories || 0), 0) || 0;
            const targetCal = targets?.calories || 2500;
            dietAdherence = targetCal > 0 ? Math.min(100, Math.round((totalCal / targetCal) * 100)) : 0;
        } catch { /* ignore */ }

        try {
            // Get recovery score
            const { data: recovery } = await supabase
                .from('recovery_logs')
                .select('readiness_score')
                .eq('user_id', user.id)
                .eq('date', todayStr)
                .single();

            recoveryScore = recovery?.readiness_score || 0;
        } catch { /* ignore */ }

        try {
            // Days since profile was created
            const { data: profile } = await supabase
                .from('profiles')
                .select('created_at')
                .eq('id', user.id)
                .single();

            daysSinceStart = profile?.created_at
                ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000) + 1
                : 1;
        } catch { /* ignore */ }

        setStats({
            workoutCompliance,
            workoutChange: 0,
            dietAdherence,
            dietChange: 0,
            recoveryScore,
            recoveryChange: 0,
            daysSinceStart,
        });
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    return { stats, loading, refetch: fetchStats };
}
