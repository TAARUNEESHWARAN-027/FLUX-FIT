import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthProvider';

export interface MoodEntry {
    id?: string;
    date: string;
    moodScore: number;       // 1-5
    energyLevel?: number;    // 1-5
    anxietyLevel?: number;   // 1-5
    tags: string[];
    journalEntry?: string;
    context?: string;
}

const MOOD_TAGS = [
    'grateful', 'motivated', 'anxious', 'stressed', 'calm',
    'energized', 'tired', 'happy', 'sad', 'focused',
    'frustrated', 'hopeful', 'confident', 'overwhelmed',
];

export function useMoodJournal(date?: string) {
    const { user } = useAuthContext();
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [entries, setEntries] = useState<MoodEntry[]>([]);
    const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null);
    const [weeklyAvg, setWeeklyAvg] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchEntries = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);

        try {
            const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
            const { data } = await supabase
                .from('mood_journal')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', weekAgo)
                .order('date', { ascending: false });

            if (data) {
                const mapped = data.map(mapRow);
                setEntries(mapped);
                setTodayEntry(mapped.find(e => e.date === targetDate) || null);
                if (mapped.length > 0) {
                    setWeeklyAvg(Math.round(
                        (mapped.reduce((s, e) => s + e.moodScore, 0) / mapped.length) * 10
                    ) / 10);
                }
            }
        } catch {
            console.warn('useMoodJournal: query failed');
        }
        setLoading(false);
    }, [user, targetDate]);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const saveMood = useCallback(async (entry: Omit<MoodEntry, 'id'>) => {
        if (!user) return { error: 'Not logged in' };
        try {
            const { error } = await supabase
                .from('mood_journal')
                .upsert({
                    user_id: user.id,
                    date: entry.date,
                    mood_score: entry.moodScore,
                    energy_level: entry.energyLevel,
                    anxiety_level: entry.anxietyLevel,
                    tags: entry.tags,
                    journal_entry: entry.journalEntry,
                    context: entry.context || 'general',
                }, { onConflict: 'user_id,date,context' });

            if (!error) fetchEntries();
            return { error: error?.message };
        } catch (err) {
            // Optimistic local update
            const local: MoodEntry = { ...entry, id: crypto.randomUUID() };
            setTodayEntry(local);
            setEntries(prev => [local, ...prev.filter(e => e.date !== entry.date)]);
            return { error: String(err) };
        }
    }, [user, fetchEntries]);

    return {
        entries, todayEntry, weeklyAvg, loading,
        saveMood, refetch: fetchEntries,
        availableTags: MOOD_TAGS,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): MoodEntry {
    return {
        id: row.id,
        date: row.date,
        moodScore: row.mood_score,
        energyLevel: row.energy_level,
        anxietyLevel: row.anxiety_level,
        tags: row.tags || [],
        journalEntry: row.journal_entry,
        context: row.context,
    };
}
