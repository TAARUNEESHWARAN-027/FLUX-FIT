import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LevelInfo {
    level: number;
    title: string;
    currentXp: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    progressPct: number;
}

export interface Achievement {
    id: string;
    code: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    xpReward: number;
    unlocked: boolean;
    unlockedAt?: string;
}

export interface GamificationStatus {
    level: LevelInfo;
    streakCurrent: number;
    streakLongest: number;
    streakMultiplier: number;
    habitStrength: number;
    totalXp: number;
    achievements: Achievement[];
    recentUnlocks: Achievement[];
}

// ─── Formulae ─────────────────────────────────────────────────────────────────

/**
 * XP required to reach a given level.
 * Formula: floor(1000 * level^1.5)
 * Level 1 = 0 XP (starting point)
 */
export function xpForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(1000 * Math.pow(level, 1.5));
}

/**
 * Determine the level for a given total XP.
 */
export function levelForXp(totalXp: number): number {
    let level = 1;
    while (xpForLevel(level + 1) <= totalXp) {
        level++;
    }
    return level;
}

/**
 * Get the title for a level.
 */
export function levelTitle(level: number): string {
    const titles: Record<number, string> = {
        1: 'Novice', 2: 'Beginner', 3: 'Consistency Builder',
        4: 'Discipline Acolyte', 5: 'Flux Initiate',
        6: 'Iron Will', 7: 'Elite Performer', 8: 'Legendary',
        9: 'Titan', 10: 'Diamond', 11: 'Apex Predator',
        12: 'Unstoppable', 13: 'Mythic', 14: 'Transcendent',
        15: 'Omega', 16: 'Ascended', 17: 'Immortal',
        18: 'Flux Master', 19: 'Singularity', 20: 'Godlike',
    };
    return titles[level] || `Level ${level}`;
}

/**
 * Streak multiplier: min(2.0, 1.0 + streak * 0.02)
 */
export function streakMultiplier(streakDays: number): number {
    return Math.min(2.0, 1.0 + streakDays * 0.02);
}

/**
 * Habit strength score (0-100).
 * (consistency_7d * 0.4) + (streak_ratio * 0.3) + (improvement_rate * 0.3)
 */
export function habitStrength(
    consistency7d: number,  // days active / 7 (0-1)
    streakRatio: number,    // current / longest (0-1)
    improvementRate: number // week-over-week delta normalized to 0-1
): number {
    return Math.round(
        ((consistency7d * 0.4) + (streakRatio * 0.3) + (Math.max(0, Math.min(1, improvementRate)) * 0.3)) * 100
    );
}

/**
 * Calculate XP earned for a workout completion.
 */
export function workoutXp(
    durationMinutes: number,
    adherenceScore: number,  // 0-100
    currentStreakDays: number
): number {
    const baseXp = Math.round(durationMinutes * 1.5);
    const adherenceBonus = Math.round(baseXp * (adherenceScore / 100) * 0.5);
    const mult = streakMultiplier(currentStreakDays);
    return Math.round((baseXp + adherenceBonus) * mult);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const gamificationService = {
    /**
     * Get full gamification status for a user.
     */
    async getStatus(userId: string): Promise<GamificationStatus> {
        let totalXp = 0;
        let currentStreak = 0;
        let longestStreak = 0;

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('current_xp, streak_current, streak_longest')
                .eq('id', userId)
                .single();

            if (profile) {
                totalXp = profile.current_xp || 0;
                currentStreak = profile.streak_current || 0;
                longestStreak = profile.streak_longest || 0;
            }
        } catch { /* use defaults */ }

        const currentLevel = levelForXp(totalXp);
        const currentLevelXp = xpForLevel(currentLevel);
        const nextLevelXp = xpForLevel(currentLevel + 1);
        const xpInLevel = totalXp - currentLevelXp;
        const xpNeeded = nextLevelXp - currentLevelXp;

        const level: LevelInfo = {
            level: currentLevel,
            title: levelTitle(currentLevel),
            currentXp: totalXp,
            xpForCurrentLevel: currentLevelXp,
            xpForNextLevel: nextLevelXp,
            progressPct: xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100,
        };

        // Fetch achievements
        const achievements = await this.getAchievements(userId);
        const recentUnlocks = achievements
            .filter(a => a.unlocked && a.unlockedAt)
            .sort((a, b) => (b.unlockedAt || '').localeCompare(a.unlockedAt || ''))
            .slice(0, 5);

        // Compute habit strength
        let hs = 0;
        try {
            const { data: metrics } = await supabase
                .from('behavioral_metrics')
                .select('*')
                .eq('user_id', userId)
                .order('week_start', { ascending: false })
                .limit(1);

            if (metrics && metrics.length > 0) {
                hs = metrics[0].habit_strength || 0;
            } else {
                // Compute locally
                const consistency = currentStreak > 0 ? Math.min(1, currentStreak / 7) : 0;
                const sr = longestStreak > 0 ? currentStreak / longestStreak : 0;
                hs = habitStrength(consistency, sr, 0);
            }
        } catch {
            const consistency = currentStreak > 0 ? Math.min(1, currentStreak / 7) : 0;
            const sr = longestStreak > 0 ? currentStreak / longestStreak : 0;
            hs = habitStrength(consistency, sr, 0);
        }

        return {
            level,
            streakCurrent: currentStreak,
            streakLongest: longestStreak,
            streakMultiplier: streakMultiplier(currentStreak),
            habitStrength: hs,
            totalXp,
            achievements,
            recentUnlocks,
        };
    },

    /**
     * Fetch all achievements and mark which ones are unlocked.
     */
    async getAchievements(userId: string): Promise<Achievement[]> {
        try {
            const [{ data: allAch }, { data: userAch }] = await Promise.all([
                supabase.from('achievements').select('*').order('sort_order'),
                supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', userId),
            ]);

            if (!allAch) return [];

            const unlockedMap = new Map(
                (userAch || []).map(ua => [ua.achievement_id, ua.unlocked_at])
            );

            return allAch.map(a => ({
                id: a.id,
                code: a.code,
                title: a.title,
                description: a.description,
                icon: a.icon,
                category: a.category,
                rarity: a.rarity,
                xpReward: a.xp_reward,
                unlocked: unlockedMap.has(a.id),
                unlockedAt: unlockedMap.get(a.id) || undefined,
            }));
        } catch {
            return [];
        }
    },

    /**
     * Check and unlock any achievements the user has newly qualified for.
     */
    async checkAndUnlockAchievements(
        userId: string,
        context: {
            streakDays?: number;
            workoutCount?: number;
            level?: number;
            totalXp?: number;
            postCount?: number;
            nutritionStreak?: number;
            waterStreak?: number;
            sleepStreak?: number;
        }
    ): Promise<Achievement[]> {
        const achievements = await this.getAchievements(userId);
        const newUnlocks: Achievement[] = [];

        for (const ach of achievements) {
            if (ach.unlocked) continue;

            let qualifies = false;
            try {
                const { data: achDef } = await supabase
                    .from('achievements')
                    .select('unlock_criteria')
                    .eq('id', ach.id)
                    .single();

                if (!achDef) continue;
                const criteria = achDef.unlock_criteria as { type: string; threshold: number };

                switch (criteria.type) {
                    case 'streak_days':
                        qualifies = (context.streakDays || 0) >= criteria.threshold;
                        break;
                    case 'workout_count':
                        qualifies = (context.workoutCount || 0) >= criteria.threshold;
                        break;
                    case 'level':
                        qualifies = (context.level || 0) >= criteria.threshold;
                        break;
                    case 'total_xp':
                        qualifies = (context.totalXp || 0) >= criteria.threshold;
                        break;
                    case 'post_count':
                        qualifies = (context.postCount || 0) >= criteria.threshold;
                        break;
                    case 'nutrition_streak':
                        qualifies = (context.nutritionStreak || 0) >= criteria.threshold;
                        break;
                    case 'water_streak':
                        qualifies = (context.waterStreak || 0) >= criteria.threshold;
                        break;
                    case 'sleep_streak':
                        qualifies = (context.sleepStreak || 0) >= criteria.threshold;
                        break;
                }
            } catch { continue; }

            if (qualifies) {
                try {
                    await supabase
                        .from('user_achievements')
                        .insert({ user_id: userId, achievement_id: ach.id });
                    newUnlocks.push({ ...ach, unlocked: true, unlockedAt: new Date().toISOString() });
                } catch { /* duplicate or error, ignore */ }
            }
        }

        return newUnlocks;
    },
};
