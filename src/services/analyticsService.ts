import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeatmapCell {
    date: string;
    intensity: number;  // 0–4
    activities: number;
}

export interface WeeklyTrend {
    weekStart: string;
    workouts: number;
    nutritionDays: number;
    recoveryDays: number;
    avgMood: number;
    avgSleep: number;
    healthScore: number;
}

export interface InsightsSummary {
    totalWorkouts: number;
    totalWorkoutMinutes: number;
    avgWorkoutsPerWeek: number;
    bestStreak: number;
    currentStreak: number;
    totalXpEarned: number;
    achievementsUnlocked: number;
    totalAchievements: number;
    moodTrend: 'up' | 'down' | 'stable';
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const analyticsService = {
    async getHeatmap(userId: string, days = 90): Promise<HeatmapCell[]> {
        const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
        const cells: Map<string, number> = new Map();

        for (let i = 0; i < days; i++) {
            const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
            cells.set(d, 0);
        }

        try {
            const { data: workouts } = await supabase
                .from('workout_logs').select('date')
                .eq('user_id', userId).gte('date', since);
            workouts?.forEach(w => cells.set(w.date, (cells.get(w.date) || 0) + 2));
        } catch { /* ignore */ }

        try {
            const { data: meals } = await supabase
                .from('meal_logs').select('date')
                .eq('user_id', userId).gte('date', since);
            const mealDays = new Set(meals?.map(m => m.date));
            mealDays.forEach(d => cells.set(d, (cells.get(d) || 0) + 1));
        } catch { /* ignore */ }

        try {
            const { data: recovery } = await supabase
                .from('recovery_logs').select('date')
                .eq('user_id', userId).gte('date', since);
            recovery?.forEach(r => cells.set(r.date, (cells.get(r.date) || 0) + 1));
        } catch { /* ignore */ }

        try {
            const { data: moods } = await supabase
                .from('mood_journal').select('date')
                .eq('user_id', userId).gte('date', since);
            const moodDays = new Set(moods?.map(m => m.date));
            moodDays.forEach(d => cells.set(d, (cells.get(d) || 0) + 1));
        } catch { /* ignore */ }

        return Array.from(cells.entries())
            .map(([date, activities]) => ({
                date, activities,
                intensity: Math.min(4, activities) as 0 | 1 | 2 | 3 | 4,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    },

    async getWeeklyTrends(userId: string, weeks = 8): Promise<WeeklyTrend[]> {
        const trends: WeeklyTrend[] = [];
        const now = new Date();

        for (let w = weeks - 1; w >= 0; w--) {
            const weekStart = new Date(now.getTime() - (w * 7 + now.getDay()) * 86400000);
            const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
            const startStr = weekStart.toISOString().split('T')[0];
            const endStr = weekEnd.toISOString().split('T')[0];

            let workouts = 0, nutritionDays = 0, recoveryDays = 0;
            let avgMood = 0, avgSleep = 0, healthScore = 0;

            try {
                const { data: wl } = await supabase.from('workout_logs').select('id')
                    .eq('user_id', userId).gte('date', startStr).lte('date', endStr);
                workouts = wl?.length || 0;
            } catch { /* */ }

            try {
                const { data: ml } = await supabase.from('meal_logs').select('date')
                    .eq('user_id', userId).gte('date', startStr).lte('date', endStr);
                nutritionDays = new Set(ml?.map(m => m.date)).size;
            } catch { /* */ }

            try {
                const { data: rl } = await supabase.from('recovery_logs').select('date, sleep_hours')
                    .eq('user_id', userId).gte('date', startStr).lte('date', endStr);
                recoveryDays = rl?.length || 0;
                if (rl?.length) avgSleep = rl.reduce((s, r) => s + (r.sleep_hours || 0), 0) / rl.length;
            } catch { /* */ }

            try {
                const { data: mj } = await supabase.from('mood_journal').select('mood_score')
                    .eq('user_id', userId).gte('date', startStr).lte('date', endStr);
                if (mj?.length) avgMood = mj.reduce((s, m) => s + m.mood_score, 0) / mj.length;
            } catch { /* */ }

            try {
                const { data: hs } = await supabase.from('health_scores').select('composite_score')
                    .eq('user_id', userId).gte('date', startStr).lte('date', endStr);
                if (hs?.length) healthScore = Math.round(hs.reduce((s, h) => s + h.composite_score, 0) / hs.length);
            } catch { /* */ }

            trends.push({
                weekStart: startStr, workouts, nutritionDays, recoveryDays,
                avgMood: Math.round(avgMood * 10) / 10, avgSleep: Math.round(avgSleep * 10) / 10, healthScore
            });
        }
        return trends;
    },

    async getSummary(userId: string): Promise<InsightsSummary> {
        const summary: InsightsSummary = {
            totalWorkouts: 0, totalWorkoutMinutes: 0, avgWorkoutsPerWeek: 0,
            bestStreak: 0, currentStreak: 0, totalXpEarned: 0,
            achievementsUnlocked: 0, totalAchievements: 0, moodTrend: 'stable',
        };

        try {
            const { data: profile } = await supabase.from('profiles')
                .select('streak_current, streak_longest, current_xp, created_at')
                .eq('id', userId).single();
            if (profile) {
                summary.bestStreak = profile.streak_longest || 0;
                summary.currentStreak = profile.streak_current || 0;
                summary.totalXpEarned = profile.current_xp || 0;
                const weeks = Math.max(1, Math.ceil(
                    (Date.now() - new Date(profile.created_at).getTime()) / (7 * 86400000)));
                const { data: wl } = await supabase.from('workout_logs').select('id, duration_minutes')
                    .eq('user_id', userId);
                summary.totalWorkouts = wl?.length || 0;
                summary.totalWorkoutMinutes = wl?.reduce((s, w) => s + (w.duration_minutes || 0), 0) || 0;
                summary.avgWorkoutsPerWeek = Math.round((summary.totalWorkouts / weeks) * 10) / 10;
            }
        } catch { /* */ }

        try {
            const [{ count: unlocked }, { count: total }] = await Promise.all([
                supabase.from('user_achievements').select('id', { count: 'exact', head: true }).eq('user_id', userId),
                supabase.from('achievements').select('id', { count: 'exact', head: true }),
            ]);
            summary.achievementsUnlocked = unlocked || 0;
            summary.totalAchievements = total || 0;
        } catch { /* */ }

        try {
            const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
            const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
            const { data: recent } = await supabase.from('mood_journal').select('mood_score')
                .eq('user_id', userId).gte('date', oneWeekAgo);
            const { data: older } = await supabase.from('mood_journal').select('mood_score')
                .eq('user_id', userId).gte('date', twoWeeksAgo).lt('date', oneWeekAgo);
            if (recent?.length && older?.length) {
                const ra = recent.reduce((s, m) => s + m.mood_score, 0) / recent.length;
                const oa = older.reduce((s, m) => s + m.mood_score, 0) / older.length;
                summary.moodTrend = ra > oa + 0.3 ? 'up' : ra < oa - 0.3 ? 'down' : 'stable';
            }
        } catch { /* */ }

        return summary;
    },
};
