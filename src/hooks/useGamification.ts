import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthProvider';
import { gamificationService, type GamificationStatus, type LevelInfo, type Achievement } from '@/services/gamificationService';
import { xpForLevel, levelForXp, levelTitle, streakMultiplier, habitStrength } from '@/services/gamificationService';

// Re-export formulae for use in components
export { xpForLevel, levelForXp, levelTitle, streakMultiplier, habitStrength };
export type { LevelInfo, Achievement, GamificationStatus };

const DEFAULT_STATUS: GamificationStatus = {
    level: { level: 1, title: 'Novice', currentXp: 0, xpForCurrentLevel: 0, xpForNextLevel: 1000, progressPct: 0 },
    streakCurrent: 0,
    streakLongest: 0,
    streakMultiplier: 1.0,
    habitStrength: 0,
    totalXp: 0,
    achievements: [],
    recentUnlocks: [],
};

export function useGamification() {
    const { user } = useAuthContext();
    const [status, setStatus] = useState<GamificationStatus>(DEFAULT_STATUS);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        try {
            const s = await gamificationService.getStatus(user.id);
            setStatus(s);
        } catch (e) {
            console.warn('useGamification: Failed to fetch status', e);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const checkAchievements = useCallback(async (context: Parameters<typeof gamificationService.checkAndUnlockAchievements>[1]) => {
        if (!user) return [];
        try {
            const newUnlocks = await gamificationService.checkAndUnlockAchievements(user.id, context);
            if (newUnlocks.length > 0) fetchStatus();
            return newUnlocks;
        } catch { return []; }
    }, [user, fetchStatus]);

    return { ...status, loading, checkAchievements, refetch: fetchStatus };
}
