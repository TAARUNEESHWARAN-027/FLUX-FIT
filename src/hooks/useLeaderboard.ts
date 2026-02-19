import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    current_level: number;
    current_xp: number;
    streak_current: number;
}

// Default entries so the leaderboard isn't empty while DB is not set up
const DEFAULT_ENTRIES: LeaderboardEntry[] = [
    { rank: 1, user_id: 'demo-1', username: 'alex_iron', display_name: 'Alex Iron', avatar_url: null, current_level: 5, current_xp: 12500, streak_current: 30 },
    { rank: 2, user_id: 'demo-2', username: 'sarah_lift', display_name: 'Sarah Lift', avatar_url: null, current_level: 4, current_xp: 9800, streak_current: 22 },
    { rank: 3, user_id: 'demo-3', username: 'mike_grind', display_name: 'Mike Grind', avatar_url: null, current_level: 4, current_xp: 8200, streak_current: 15 },
    { rank: 4, user_id: 'demo-4', username: 'luna_fit', display_name: 'Luna Fit', avatar_url: null, current_level: 3, current_xp: 5600, streak_current: 12 },
    { rank: 5, user_id: 'demo-5', username: 'jay_strong', display_name: 'Jay Strong', avatar_url: null, current_level: 3, current_xp: 4100, streak_current: 8 },
];

export function useLeaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);

        try {
            // Try materialized view first, fall back to profiles
            const { data, error } = await supabase
                .from('leaderboard_global')
                .select('*')
                .order('rank')
                .limit(50);

            if (!error && data && data.length > 0) {
                setEntries(data as LeaderboardEntry[]);
            } else {
                // Fallback: query profiles directly
                try {
                    const { data: profiles, error: profErr } = await supabase
                        .from('profiles')
                        .select('id, username, display_name, avatar_url, current_level, current_xp, streak_current')
                        .order('current_xp', { ascending: false })
                        .limit(50);

                    if (!profErr && profiles && profiles.length > 0) {
                        setEntries(profiles.map((p, i) => ({
                            rank: i + 1,
                            user_id: p.id,
                            username: p.username,
                            display_name: p.display_name,
                            avatar_url: p.avatar_url,
                            current_level: p.current_level,
                            current_xp: p.current_xp,
                            streak_current: p.streak_current,
                        })));
                    } else {
                        // No tables available, use defaults
                        setEntries(DEFAULT_ENTRIES);
                    }
                } catch {
                    setEntries(DEFAULT_ENTRIES);
                }
            }
        } catch {
            console.warn('useLeaderboard: query failed, using defaults.');
            setEntries(DEFAULT_ENTRIES);
        }

        setLoading(false);
    }, []);

    useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

    return { entries, loading, refetch: fetchLeaderboard };
}
