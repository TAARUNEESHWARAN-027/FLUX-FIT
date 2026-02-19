import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIRecommendation {
    id: string;
    type: 'daily_plan' | 'nudge' | 'recovery' | 'challenge' | 'insight' | 'goal_suggestion';
    priority: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    actionLabel?: string;
    actionRoute?: string;
    expiresAt?: string;
    status: 'pending' | 'seen' | 'acted' | 'dismissed' | 'expired';
    feedbackRating?: number;
    createdAt: string;
    metadata: Record<string, unknown>;
}

interface UserSignals {
    workoutCountThisWeek: number;
    avgSleepHours: number;
    avgMood: number;
    currentStreak: number;
    missedGoals: string[];
    lastWorkoutDaysAgo: number;
    nutritionAdherence: number;
    recoveryScore: number;
}

// ─── Rule Engine ──────────────────────────────────────────────────────────────

function generateRuleBasedRecommendations(signals: UserSignals): Omit<AIRecommendation, 'id' | 'createdAt' | 'status'>[] {
    const recs: Omit<AIRecommendation, 'id' | 'createdAt' | 'status'>[] = [];

    // Rule 1: Workout consistency nudge
    if (signals.workoutCountThisWeek < 3) {
        recs.push({
            type: 'nudge',
            priority: signals.workoutCountThisWeek === 0 ? 'high' : 'medium',
            title: signals.workoutCountThisWeek === 0
                ? "Let's get moving! 💪"
                : 'Keep the momentum going!',
            message: signals.workoutCountThisWeek === 0
                ? "You haven't logged a workout this week. Even a 20-minute session counts. Your body will thank you."
                : `You've done ${signals.workoutCountThisWeek} workout${signals.workoutCountThisWeek > 1 ? 's' : ''} this week. One more session will keep your streak alive!`,
            actionLabel: 'Start Workout',
            actionRoute: '/workouts',
            metadata: { rule: 'workout_consistency', workoutsThisWeek: signals.workoutCountThisWeek },
        });
    }

    // Rule 2: Sleep quality concern
    if (signals.avgSleepHours > 0 && signals.avgSleepHours < 6.5) {
        recs.push({
            type: 'recovery',
            priority: signals.avgSleepHours < 5 ? 'high' : 'medium',
            title: 'Your sleep needs attention 😴',
            message: `You're averaging ${signals.avgSleepHours.toFixed(1)} hours of sleep. Aim for 7-9 hours. Poor sleep undermines your workouts, mood, and recovery.`,
            actionLabel: 'Log Recovery',
            actionRoute: '/recovery',
            metadata: { rule: 'sleep_quality', avgSleep: signals.avgSleepHours },
        });
    }

    // Rule 3: Mood-based support
    if (signals.avgMood > 0 && signals.avgMood < 3) {
        recs.push({
            type: 'insight',
            priority: 'high',
            title: "We're here for you 💙",
            message: "Your mood has been lower than usual. Remember — movement is medicine. Even a short walk or stretching session can shift your energy. You're stronger than you think.",
            actionLabel: 'Journal Your Mood',
            actionRoute: '/wellness',
            metadata: { rule: 'mood_support', avgMood: signals.avgMood },
        });
    }

    // Rule 4: Streak celebration / protection
    if (signals.currentStreak >= 7) {
        recs.push({
            type: 'nudge',
            priority: 'medium',
            title: `${signals.currentStreak}-day streak! 🔥`,
            message: `Incredible discipline! You've been consistent for ${signals.currentStreak} days straight. Don't break the chain — your streak multiplier is active.`,
            metadata: { rule: 'streak_celebrate', streak: signals.currentStreak },
        });
    } else if (signals.currentStreak > 0 && signals.lastWorkoutDaysAgo >= 1) {
        recs.push({
            type: 'nudge',
            priority: 'high',
            title: 'Protect your streak! ⚡',
            message: `You have a ${signals.currentStreak}-day streak going. Log today's activity to keep it alive.`,
            actionLabel: 'Daily Check-in',
            actionRoute: '/',
            metadata: { rule: 'streak_protect', streak: signals.currentStreak },
        });
    }

    // Rule 5: Nutrition adherence
    if (signals.nutritionAdherence < 50 && signals.nutritionAdherence > 0) {
        recs.push({
            type: 'insight',
            priority: 'medium',
            title: 'Fuel your progress 🥗',
            message: `Your nutrition tracking is at ${signals.nutritionAdherence}% this week. Consistent fueling is the foundation of performance. Try logging just one meal today.`,
            actionLabel: 'Log Nutrition',
            actionRoute: '/nutrition',
            metadata: { rule: 'nutrition_adherence', adherence: signals.nutritionAdherence },
        });
    }

    // Rule 6: Recovery recommendation
    if (signals.recoveryScore > 0 && signals.recoveryScore < 40) {
        recs.push({
            type: 'recovery',
            priority: 'high',
            title: 'Recovery day recommended 🧊',
            message: 'Your recovery score is low. Consider an active recovery session — foam rolling, stretching, or a light walk. Pushing through fatigue leads to burnout.',
            actionLabel: 'Recovery Protocol',
            actionRoute: '/recovery',
            metadata: { rule: 'low_recovery', score: signals.recoveryScore },
        });
    }

    // Rule 7: Generate a daily plan recommendation
    recs.push({
        type: 'daily_plan',
        priority: 'low',
        title: "Today's adaptive plan ✨",
        message: buildDailyPlanMessage(signals),
        actionLabel: 'View Plan',
        actionRoute: '/',
        metadata: { rule: 'daily_plan', signals },
    });

    return recs;
}

function buildDailyPlanMessage(signals: UserSignals): string {
    const parts: string[] = [];

    if (signals.recoveryScore < 40) {
        parts.push('🧘 Focus on recovery today — light stretching and mobility work.');
    } else if (signals.workoutCountThisWeek < 3) {
        parts.push('💪 Great day for a training session. Your body is ready.');
    } else {
        parts.push("⚡ You've been crushing it! Consider active recovery or a moderate session.");
    }

    if (signals.avgSleepHours < 7 && signals.avgSleepHours > 0) {
        parts.push('😴 Prioritize an early bedtime tonight — sleep debt compounds.');
    }

    if (signals.nutritionAdherence < 70) {
        parts.push('🥗 Track your meals today to stay on target.');
    }

    if (signals.avgMood < 3 && signals.avgMood > 0) {
        parts.push('💙 Take a mindful moment — journal, breathe, or go for a walk.');
    }

    return parts.join('\n');
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const aiService = {
    /**
     * Gather user signals from the last 7 days and generate recommendations.
     */
    async generateRecommendations(userId: string): Promise<AIRecommendation[]> {
        const signals = await this.gatherSignals(userId);
        const rawRecs = generateRuleBasedRecommendations(signals);

        // Store recommendations in DB
        const stored: AIRecommendation[] = [];
        for (const rec of rawRecs) {
            try {
                const { data, error } = await supabase
                    .from('ai_recommendations')
                    .insert({
                        user_id: userId,
                        recommendation_type: rec.type,
                        priority: rec.priority,
                        title: rec.title,
                        message: rec.message,
                        action_label: rec.actionLabel,
                        action_route: rec.actionRoute,
                        content: rec.metadata,
                        status: 'pending',
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    })
                    .select()
                    .single();

                if (!error && data) {
                    stored.push(this.mapRow(data));
                }
            } catch {
                // If DB not available, return in-memory recommendations
                stored.push({
                    id: crypto.randomUUID(),
                    type: rec.type,
                    priority: rec.priority,
                    title: rec.title,
                    message: rec.message,
                    actionLabel: rec.actionLabel,
                    actionRoute: rec.actionRoute,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    metadata: rec.metadata,
                });
            }
        }

        return stored;
    },

    /**
     * Fetch existing pending / today's recommendations.
     */
    async getRecommendations(userId: string): Promise<AIRecommendation[]> {
        try {
            const { data, error } = await supabase
                .from('ai_recommendations')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['pending', 'seen'])
                .order('created_at', { ascending: false })
                .limit(10);

            if (error || !data || data.length === 0) {
                // Auto-generate if none exist
                return this.generateRecommendations(userId);
            }

            return data.map(this.mapRow);
        } catch {
            return this.generateRecommendations(userId);
        }
    },

    /**
     * Submit user feedback on a recommendation.
     */
    async submitFeedback(recId: string, rating: number, note?: string): Promise<void> {
        try {
            await supabase
                .from('ai_recommendations')
                .update({
                    feedback_rating: rating,
                    feedback_note: note || null,
                    status: 'acted',
                    acted_at: new Date().toISOString(),
                })
                .eq('id', recId);
        } catch (e) {
            console.warn('aiService.submitFeedback failed:', e);
        }
    },

    /**
     * Mark a recommendation as seen.
     */
    async markSeen(recId: string): Promise<void> {
        try {
            await supabase
                .from('ai_recommendations')
                .update({ status: 'seen', seen_at: new Date().toISOString() })
                .eq('id', recId);
        } catch {
            // silent
        }
    },

    /**
     * Dismiss a recommendation.
     */
    async dismiss(recId: string): Promise<void> {
        try {
            await supabase
                .from('ai_recommendations')
                .update({ status: 'dismissed' })
                .eq('id', recId);
        } catch {
            // silent
        }
    },

    /**
     * Gather behavioral signals from the last 7 days.
     */
    async gatherSignals(userId: string): Promise<UserSignals> {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];

        const signals: UserSignals = {
            workoutCountThisWeek: 0,
            avgSleepHours: 0,
            avgMood: 0,
            currentStreak: 0,
            missedGoals: [],
            lastWorkoutDaysAgo: 7,
            nutritionAdherence: 0,
            recoveryScore: 0,
        };

        try {
            // Workout count this week
            const { data: workouts } = await supabase
                .from('workout_logs')
                .select('id, date')
                .eq('user_id', userId)
                .gte('date', weekAgo)
                .lte('date', todayStr);
            signals.workoutCountThisWeek = workouts?.length || 0;

            if (workouts && workouts.length > 0) {
                const latest = workouts.sort((a, b) => b.date.localeCompare(a.date))[0];
                signals.lastWorkoutDaysAgo = Math.floor(
                    (Date.now() - new Date(latest.date).getTime()) / 86400000
                );
            }
        } catch { /* ignore */ }

        try {
            // Sleep average
            const { data: recovery } = await supabase
                .from('recovery_logs')
                .select('sleep_hours, readiness_score')
                .eq('user_id', userId)
                .gte('date', weekAgo);
            if (recovery && recovery.length > 0) {
                const sleepVals = recovery.filter(r => r.sleep_hours).map(r => r.sleep_hours as number);
                signals.avgSleepHours = sleepVals.length > 0
                    ? sleepVals.reduce((s, v) => s + v, 0) / sleepVals.length : 0;

                const readiness = recovery.filter(r => r.readiness_score).map(r => r.readiness_score as number);
                signals.recoveryScore = readiness.length > 0
                    ? readiness.reduce((s, v) => s + v, 0) / readiness.length : 0;
            }
        } catch { /* ignore */ }

        try {
            // Mood average (from daily_checkins or mood_journal)
            const { data: moods } = await supabase
                .from('mood_journal')
                .select('mood_score')
                .eq('user_id', userId)
                .gte('date', weekAgo);
            if (moods && moods.length > 0) {
                signals.avgMood = moods.reduce((s, m) => s + m.mood_score, 0) / moods.length;
            }
        } catch { /* ignore */ }

        try {
            // Profile streak
            const { data: profile } = await supabase
                .from('profiles')
                .select('streak_current')
                .eq('id', userId)
                .single();
            signals.currentStreak = profile?.streak_current || 0;
        } catch { /* ignore */ }

        try {
            // Nutrition adherence
            const { data: meals } = await supabase
                .from('meal_logs')
                .select('date')
                .eq('user_id', userId)
                .gte('date', weekAgo);
            const uniqueDays = new Set(meals?.map(m => m.date));
            signals.nutritionAdherence = Math.round((uniqueDays.size / 7) * 100);
        } catch { /* ignore */ }

        try {
            // Missed goals
            const { data: goals } = await supabase
                .from('goals')
                .select('title, progress_pct, deadline')
                .eq('user_id', userId)
                .eq('status', 'active')
                .lt('progress_pct', 50);
            if (goals) {
                signals.missedGoals = goals.map(g => g.title);
            }
        } catch { /* ignore */ }

        return signals;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRow(row: any): AIRecommendation {
        return {
            id: row.id,
            type: row.recommendation_type,
            priority: row.priority,
            title: row.title,
            message: row.message,
            actionLabel: row.action_label,
            actionRoute: row.action_route,
            status: row.status,
            feedbackRating: row.feedback_rating,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
            metadata: row.content || {},
        };
    },
};
