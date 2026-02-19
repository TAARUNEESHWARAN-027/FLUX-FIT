import { supabase } from '@/lib/supabase';
import type { DailyCheckin, DailyCheckinInsert } from '@/types';

export const checkinService = {
    async createCheckin(checkin: DailyCheckinInsert): Promise<DailyCheckin> {
        const { data, error } = await supabase
            .from('daily_checkins')
            .insert(checkin)
            .select()
            .single();

        if (error) throw error;
        return data as DailyCheckin;
    },

    async getTodayCheckin(userId: string): Promise<DailyCheckin | null> {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const { data, error } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle();

        if (error) throw error;
        return data as DailyCheckin | null;
    },

    async getCheckinHistory(userId: string, limit = 30): Promise<DailyCheckin[]> {
        const { data, error } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as DailyCheckin[];
    },
};
