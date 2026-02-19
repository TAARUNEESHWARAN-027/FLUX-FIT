import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthProvider';

export interface RecoveryLog {
    id?: string;
    date: string;
    sleep_hours: number | null;
    sleep_quality: number | null;
    soreness_level: number | null;
    stress_level: number | null;
    readiness_score: number | null;
    protocols_completed: { name: string; completed: boolean }[];
    notes: string | null;
}

export function useRecovery(date?: string) {
    const { user } = useAuthContext();
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [recoveryLog, setRecoveryLog] = useState<RecoveryLog | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRecovery = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('recovery_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', targetDate)
                .single();

            if (!error && data) {
                setRecoveryLog({
                    ...data,
                    protocols_completed: (data.protocols_completed || []) as { name: string; completed: boolean }[],
                } as RecoveryLog);
            } else {
                setRecoveryLog(null);
            }
        } catch {
            console.warn('useRecovery: query failed.');
            setRecoveryLog(null);
        }
        setLoading(false);
    }, [user, targetDate]);

    useEffect(() => { fetchRecovery(); }, [fetchRecovery]);

    const saveRecovery = useCallback(async (log: Partial<RecoveryLog>) => {
        if (!user) return;

        // Calculate readiness score
        const sleepScore = ((log.sleep_hours || 7) / 8) * 40;
        const sorenessScore = ((10 - (log.soreness_level || 5)) / 10) * 30;
        const stressScore = ((10 - (log.stress_level || 5)) / 10) * 30;
        const readiness = Math.min(100, Math.round(sleepScore + sorenessScore + stressScore));

        const payload = {
            user_id: user.id,
            date: targetDate,
            ...log,
            readiness_score: readiness,
            updated_at: new Date().toISOString(),
        };

        try {
            const { error } = await supabase
                .from('recovery_logs')
                .upsert(payload, { onConflict: 'user_id,date' });

            if (!error) fetchRecovery();
            return { error };
        } catch (err) {
            console.warn('saveRecovery failed:', err);
            // Still update local state optimistically
            setRecoveryLog(prev => ({ ...(prev || { date: targetDate, protocols_completed: [], notes: null }), ...log, readiness_score: readiness } as RecoveryLog));
            return { error: { message: String(err) } };
        }
    }, [user, targetDate, fetchRecovery]);

    return { recoveryLog, loading, saveRecovery, refetch: fetchRecovery };
}
