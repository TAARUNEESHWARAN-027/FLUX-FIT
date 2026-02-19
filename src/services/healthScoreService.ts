import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthScoreBreakdown {
    composite: number;     // 0-100
    workout: number;       // 0-100
    nutrition: number;     // 0-100
    sleep: number;         // 0-100
    mood: number;          // 0-100
    recovery: number;      // 0-100
}

export interface HealthScoreHistory {
    date: string;
    score: HealthScoreBreakdown;
}

// ─── Weights ──────────────────────────────────────────────────────────────────

const WEIGHTS = {
    workout: 0.25,
    nutrition: 0.25,
    sleep: 0.20,
    mood: 0.15,
    recovery: 0.15,
} as const;

// ─── Score Computation ────────────────────────────────────────────────────────

function computeComposite(b: Omit<HealthScoreBreakdown, 'composite'>): number {
    return Math.round(
        b.workout * WEIGHTS.workout +
        b.nutrition * WEIGHTS.nutrition +
        b.sleep * WEIGHTS.sleep +
        b.mood * WEIGHTS.mood +
        b.recovery * WEIGHTS.recovery
    );
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const healthScoreService = {
    /**
     * Compute today's health score from all data domains.
     */
    async computeTodayScore(userId: string): Promise<HealthScoreBreakdown> {
        const todayStr = new Date().toISOString().split('T')[0];

        let workoutScore = 0;
        let nutritionScore = 0;
        let sleepScore = 0;
        let moodScore = 0;
        let recoveryScore = 0;

        // Workout score: based on this week's compliance (workouts logged / 5 expected)
        try {
            const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
            const { data: logs } = await supabase
                .from('workout_logs')
                .select('id')
                .eq('user_id', userId)
                .gte('date', weekAgo);
            const count = logs?.length || 0;
            workoutScore = Math.min(100, Math.round((count / 5) * 100));
        } catch { /* ignore */ }

        // Nutrition score: based on today's calorie target adherence
        try {
            const { data: meals } = await supabase
                .from('meal_logs')
                .select('calories')
                .eq('user_id', userId)
                .eq('date', todayStr);

            const { data: targets } = await supabase
                .from('nutrition_targets')
                .select('calories')
                .eq('user_id', userId)
                .single();

            const total = meals?.reduce((s, m) => s + (m.calories || 0), 0) || 0;
            const target = targets?.calories || 2500;
            if (total > 0) {
                const ratio = total / target;
                // Penalize both under and over eating
                nutritionScore = Math.max(0, Math.round(100 - Math.abs(1 - ratio) * 100));
            }
        } catch { /* ignore */ }

        // Sleep score: based on hours (7+ = 100, scaled linearly)
        try {
            const { data: rec } = await supabase
                .from('recovery_logs')
                .select('sleep_hours, sleep_quality')
                .eq('user_id', userId)
                .eq('date', todayStr)
                .single();

            if (rec) {
                const hoursScore = Math.min(100, Math.round(((rec.sleep_hours || 0) / 8) * 80));
                const qualityScore = ((rec.sleep_quality || 3) / 5) * 20;
                sleepScore = Math.round(hoursScore + qualityScore);
            }
        } catch { /* ignore */ }

        // Mood score: from today's mood journal or daily checkin
        try {
            const { data: mood } = await supabase
                .from('mood_journal')
                .select('mood_score, energy_level')
                .eq('user_id', userId)
                .eq('date', todayStr)
                .limit(1);

            if (mood && mood.length > 0) {
                const ms = (mood[0].mood_score / 5) * 70;
                const es = ((mood[0].energy_level || 3) / 5) * 30;
                moodScore = Math.round(ms + es);
            } else {
                // Fallback to daily checkin
                const { data: checkin } = await supabase
                    .from('daily_checkins')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('date', todayStr)
                    .single();

                if (checkin) {
                    moodScore = 60; // Default for having checked in
                }
            }
        } catch { /* ignore */ }

        // Recovery score: from recovery_logs readiness_score
        try {
            const { data: rec } = await supabase
                .from('recovery_logs')
                .select('readiness_score')
                .eq('user_id', userId)
                .eq('date', todayStr)
                .single();

            recoveryScore = rec?.readiness_score || 0;
        } catch { /* ignore */ }

        const breakdown: HealthScoreBreakdown = {
            workout: workoutScore,
            nutrition: nutritionScore,
            sleep: sleepScore,
            mood: moodScore,
            recovery: recoveryScore,
            composite: 0,
        };
        breakdown.composite = computeComposite(breakdown);

        // Store in DB
        try {
            await supabase
                .from('health_scores')
                .upsert({
                    user_id: userId,
                    date: todayStr,
                    composite_score: breakdown.composite,
                    workout_score: breakdown.workout,
                    nutrition_score: breakdown.nutrition,
                    sleep_score: breakdown.sleep,
                    mood_score: breakdown.mood,
                    recovery_score: breakdown.recovery,
                    breakdown: breakdown,
                }, { onConflict: 'user_id,date' });
        } catch { /* ignore */ }

        return breakdown;
    },

    /**
     * Get health score history for the last N days.
     */
    async getHistory(userId: string, days = 7): Promise<HealthScoreHistory[]> {
        try {
            const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('health_scores')
                .select('*')
                .eq('user_id', userId)
                .gte('date', since)
                .order('date', { ascending: true });

            if (error || !data) return [];

            return data.map(row => ({
                date: row.date,
                score: {
                    composite: row.composite_score,
                    workout: row.workout_score,
                    nutrition: row.nutrition_score,
                    sleep: row.sleep_score,
                    mood: row.mood_score,
                    recovery: row.recovery_score,
                },
            }));
        } catch {
            return [];
        }
    },

    /**
     * Get 7-day trend direction.
     */
    async getTrend(userId: string): Promise<'up' | 'down' | 'stable'> {
        const history = await this.getHistory(userId, 7);
        if (history.length < 2) return 'stable';

        const recent = history.slice(-3).reduce((s, h) => s + h.score.composite, 0) / Math.min(3, history.length);
        const older = history.slice(0, 3).reduce((s, h) => s + h.score.composite, 0) / Math.min(3, history.length);
        const diff = recent - older;

        if (diff > 5) return 'up';
        if (diff < -5) return 'down';
        return 'stable';
    },
};
