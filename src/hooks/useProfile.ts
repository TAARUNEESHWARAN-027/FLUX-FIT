import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthProvider';

export interface Profile {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    current_level: number;
    current_xp: number;
    streak_current: number;
    streak_longest: number;
    fitness_goal: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    date_of_birth: string | null;
    created_at: string;
    updated_at: string;
}

const DEFAULT_PROFILE: Profile = {
    id: '',
    username: null,
    display_name: 'Warrior',
    avatar_url: null,
    bio: null,
    current_level: 1,
    current_xp: 0,
    streak_current: 0,
    streak_longest: 0,
    fitness_goal: 'general_fitness',
    height_cm: null,
    weight_kg: null,
    date_of_birth: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

export function useProfile() {
    const { user } = useAuthContext();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [dbAvailable, setDbAvailable] = useState(true);

    const fetchProfile = useCallback(async () => {
        if (!user) { setProfile(null); setLoading(false); return; }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.warn('useProfile: Supabase query failed, using defaults.', error.message);
                setDbAvailable(false);
                setProfile({ ...DEFAULT_PROFILE, id: user.id, display_name: user.email?.split('@')[0] || 'Warrior' });
            } else {
                setProfile(data as Profile);
                setDbAvailable(true);
            }
        } catch (err) {
            console.warn('useProfile: Exception, using defaults.', err);
            setDbAvailable(false);
            setProfile({ ...DEFAULT_PROFILE, id: user.id, display_name: user.email?.split('@')[0] || 'Warrior' });
        }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const updateProfile = useCallback(async (updates: Partial<Profile>) => {
        if (!user) return { error: { message: 'Not logged in' } };
        if (!dbAvailable) {
            // optimistic local update when DB is not available
            setProfile(prev => prev ? { ...prev, ...updates } : prev);
            return { error: null };
        }
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (!error) {
                setProfile(prev => prev ? { ...prev, ...updates } : prev);
            }
            return { error };
        } catch (err) {
            console.error('updateProfile exception:', err);
            return { error: { message: String(err) } };
        }
    }, [user, dbAvailable]);

    const levelTitle = profile
        ? getLevelTitle(profile.current_level)
        : 'Novice';

    return { profile, loading, updateProfile, refetch: fetchProfile, levelTitle, dbAvailable };
}

function getLevelTitle(level: number): string {
    const titles: Record<number, string> = {
        1: 'Novice', 2: 'Beginner', 3: 'Consistency Builder',
        4: 'Discipline Acolyte', 5: 'Flux Initiate',
        6: 'Iron Will', 7: 'Elite Performer', 8: 'Legendary',
    };
    return titles[level] || 'Novice';
}
