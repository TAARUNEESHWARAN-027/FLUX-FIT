import { supabase } from '@/lib/supabase';
import type { XpLedgerEntry, XpLedgerInsert } from '@/types';

/** XP thresholds: level N requires N × 500 total XP */
export function levelForXp(xp: number): number {
    return Math.max(1, Math.floor(xp / 500));
}

/** Total XP needed to reach the NEXT level */
export function xpForNextLevel(currentLevel: number): number {
    return (currentLevel + 1) * 500;
}

/** How much XP the user still needs for next level */
export function xpRemaining(xp: number): number {
    const nextLevel = levelForXp(xp) + 1;
    return nextLevel * 500 - xp;
}

export const xpService = {
    async awardXp(entry: XpLedgerInsert): Promise<XpLedgerEntry> {
        const { data, error } = await supabase
            .from('xp_ledger')
            .insert(entry)
            .select()
            .single();

        if (error) throw error;

        // Also update the profile via the DB function
        const { error: rpcError } = await supabase.rpc('increment_xp', {
            p_user_id: entry.user_id,
            p_amount: entry.amount,
        });

        if (rpcError) throw rpcError;

        return data as XpLedgerEntry;
    },

    async getXpHistory(userId: string, limit = 50): Promise<XpLedgerEntry[]> {
        const { data, error } = await supabase
            .from('xp_ledger')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as XpLedgerEntry[];
    },
};
