import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthProvider';

export interface Exercise {
    name: string;
    sets: string;
    reps: string;
    rpe?: number;
}

export interface WorkoutPlan {
    id: string;
    day_of_week: number;
    name: string;
    focus: string | null;
    intensity: string;
    estimated_duration_min: number;
    exercises: Exercise[];
    is_rest_day: boolean;
}

export interface WorkoutLog {
    id: string;
    date: string;
    plan_id: string | null;
    exercises_completed: unknown;
    duration_minutes: number | null;
    total_volume_kg: number;
    rpe_average: number | null;
    adherence_score: number;
    notes: string | null;
    created_at: string;
}

export interface PersonalRecord {
    id: string;
    exercise_name: string;
    weight_kg: number;
    reps: number;
    achieved_at: string;
}

// Default workout plan so the UI always has something to show
const DEFAULT_PLANS: WorkoutPlan[] = [
    { id: '1', day_of_week: 0, name: 'Rest Day', focus: 'Full Rest', intensity: 'low', estimated_duration_min: 0, exercises: [], is_rest_day: true },
    {
        id: '2', day_of_week: 1, name: 'Push A - Hypertrophy', focus: 'Chest, Shoulders & Triceps', intensity: 'high', estimated_duration_min: 70,
        exercises: [{ name: 'Incline Bench Press', sets: '4', reps: '8-10', rpe: 8 }, { name: 'Overhead Press', sets: '3', reps: '10-12', rpe: 8 }, { name: 'Lateral Raises', sets: '4', reps: '15-20', rpe: 9 }, { name: 'Tricep Pushdowns', sets: '3', reps: '12-15', rpe: 8 }], is_rest_day: false
    },
    {
        id: '3', day_of_week: 2, name: 'Pull A - Strength', focus: 'Back & Biceps', intensity: 'high', estimated_duration_min: 65,
        exercises: [{ name: 'Weighted Pull-ups', sets: '3', reps: '5-8', rpe: 9 }, { name: 'Barbell Row', sets: '4', reps: '8-10', rpe: 8 }, { name: 'Lat Pulldowns', sets: '3', reps: '10-12', rpe: 8 }, { name: 'Face Pulls', sets: '4', reps: '15-20', rpe: 7 }], is_rest_day: false
    },
    {
        id: '4', day_of_week: 3, name: 'Legs - Power', focus: 'Quads, Hamstrings & Glutes', intensity: 'high', estimated_duration_min: 75,
        exercises: [{ name: 'Barbell Squat', sets: '4', reps: '6-8', rpe: 9 }, { name: 'Romanian Deadlift', sets: '3', reps: '8-10', rpe: 8 }, { name: 'Leg Press', sets: '3', reps: '10-12', rpe: 8 }, { name: 'Walking Lunges', sets: '3', reps: '12 each', rpe: 7 }], is_rest_day: false
    },
    {
        id: '5', day_of_week: 4, name: 'Push B - Volume', focus: 'Chest, Shoulders & Triceps', intensity: 'moderate', estimated_duration_min: 60,
        exercises: [{ name: 'Flat Dumbbell Press', sets: '4', reps: '10-12', rpe: 8 }, { name: 'Cable Flyes', sets: '3', reps: '12-15', rpe: 7 }, { name: 'Arnold Press', sets: '3', reps: '10-12', rpe: 8 }, { name: 'Overhead Extensions', sets: '3', reps: '12-15', rpe: 7 }], is_rest_day: false
    },
    {
        id: '6', day_of_week: 5, name: 'Pull B - Volume', focus: 'Back & Biceps', intensity: 'moderate', estimated_duration_min: 60,
        exercises: [{ name: 'Cable Row', sets: '4', reps: '10-12', rpe: 8 }, { name: 'Single-Arm Lat Pulldown', sets: '3', reps: '10-12', rpe: 8 }, { name: 'Rear Delt Flyes', sets: '3', reps: '15-20', rpe: 7 }, { name: 'Barbell Curls', sets: '3', reps: '10-12', rpe: 8 }], is_rest_day: false
    },
    {
        id: '7', day_of_week: 6, name: 'Active Recovery', focus: 'Light Cardio & Mobility', intensity: 'low', estimated_duration_min: 30,
        exercises: [{ name: 'Light Walking', sets: '1', reps: '20 min', rpe: 3 }, { name: 'Foam Rolling', sets: '1', reps: '10 min', rpe: 2 }], is_rest_day: true
    },
];

export function useWorkouts() {
    const { user } = useAuthContext();
    const [todayPlan, setTodayPlan] = useState<WorkoutPlan | null>(null);
    const [weeklyPlans, setWeeklyPlans] = useState<WorkoutPlan[]>([]);
    const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
    const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);

        const today = new Date().getDay(); // 0=Sun
        let usedDefaults = false;

        try {
            // Fetch weekly plans
            const { data: plans, error } = await supabase
                .from('workout_plans')
                .select('*')
                .eq('user_id', user.id)
                .order('day_of_week');

            if (error || !plans || plans.length === 0) {
                // Fall back to defaults
                console.warn('useWorkouts: Using default plans.', error?.message);
                setWeeklyPlans(DEFAULT_PLANS);
                setTodayPlan(DEFAULT_PLANS.find(p => p.day_of_week === today) || null);
                usedDefaults = true;
            } else {
                const typed = plans.map(p => ({
                    ...p,
                    exercises: (p.exercises || []) as Exercise[],
                })) as WorkoutPlan[];
                setWeeklyPlans(typed);
                setTodayPlan(typed.find(p => p.day_of_week === today) || null);
            }
        } catch {
            console.warn('useWorkouts: Exception, using defaults.');
            setWeeklyPlans(DEFAULT_PLANS);
            setTodayPlan(DEFAULT_PLANS.find(p => p.day_of_week === today) || null);
            usedDefaults = true;
        }

        if (!usedDefaults) {
            try {
                // Fetch recent workout logs (last 7)
                const { data: logs } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('date', { ascending: false })
                    .limit(7);
                if (logs) setRecentLogs(logs as WorkoutLog[]);
            } catch { /* ignore */ }

            try {
                // Fetch PRs
                const { data: prs } = await supabase
                    .from('personal_records')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('weight_kg', { ascending: false })
                    .limit(5);
                if (prs) setPersonalRecords(prs as PersonalRecord[]);
            } catch { /* ignore */ }
        }

        setLoading(false);
    }, [user]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const logWorkout = useCallback(async (log: Omit<WorkoutLog, 'id' | 'created_at'>) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('workout_logs')
                .insert({ ...log, user_id: user.id });
            if (!error) fetchAll();
            return { error };
        } catch (err) {
            console.warn('logWorkout failed:', err);
            return { error: { message: String(err) } };
        }
    }, [user, fetchAll]);

    return { todayPlan, weeklyPlans, recentLogs, personalRecords, loading, logWorkout, refetch: fetchAll };
}
