import { supabase } from '@/lib/supabase';
import type {
    Workout,
    WorkoutInsert,
    WorkoutUpdate,
    WorkoutLog,
    WorkoutLogInsert,
} from '@/types';

export const workoutService = {
    // ── Templates ────────────────────────────────────────────────────────────

    async getWorkouts(userId: string): Promise<Workout[]> {
        const { data, error } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Workout[];
    },

    async getWorkoutById(id: string): Promise<Workout & { workout_exercises: unknown[] }> {
        const { data, error } = await supabase
            .from('workouts')
            .select(`
        *,
        workout_exercises (
          *,
          exercise:exercises (*)
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async createWorkout(workout: WorkoutInsert): Promise<Workout> {
        const { data, error } = await supabase
            .from('workouts')
            .insert(workout)
            .select()
            .single();

        if (error) throw error;
        return data as Workout;
    },

    async updateWorkout(id: string, updates: WorkoutUpdate): Promise<Workout> {
        const { data, error } = await supabase
            .from('workouts')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Workout;
    },

    async deleteWorkout(id: string): Promise<void> {
        const { error } = await supabase.from('workouts').delete().eq('id', id);
        if (error) throw error;
    },

    // ── Logging ──────────────────────────────────────────────────────────────

    async logWorkout(log: WorkoutLogInsert): Promise<WorkoutLog> {
        const { data, error } = await supabase
            .from('workout_logs')
            .insert(log)
            .select()
            .single();

        if (error) throw error;
        return data as WorkoutLog;
    },

    async finishWorkoutLog(logId: string): Promise<void> {
        const { error } = await supabase
            .from('workout_logs')
            .update({
                finished_at: new Date().toISOString(),
            })
            .eq('id', logId);

        if (error) throw error;
    },

    async getWorkoutLogs(userId: string, limit = 10): Promise<WorkoutLog[]> {
        const { data, error } = await supabase
            .from('workout_logs')
            .select(`
        *,
        workout:workouts (name),
        exercise_logs (
          *,
          exercise:exercises (name, muscle_group)
        )
      `)
            .eq('user_id', userId)
            .order('started_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as WorkoutLog[];
    },
};
