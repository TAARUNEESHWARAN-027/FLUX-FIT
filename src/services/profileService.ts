import { supabase } from '@/lib/supabase';
import type { Profile, ProfileUpdate } from '@/types';

export const profileService = {
    async getProfile(userId: string): Promise<Profile> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data as Profile;
    },

    async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as Profile;
    },

    async getLeaderboard(limit = 20): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, xp, level, streak')
            .order('xp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as Profile[];
    },
};
