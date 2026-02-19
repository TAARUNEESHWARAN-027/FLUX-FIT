import { create } from 'zustand';
import type { Workout, WorkoutInsert, WorkoutUpdate, WorkoutLog } from '@/types';
import { workoutService } from '@/services/workoutService';

interface ActiveSet {
    exerciseId: string;
    setNumber: number;
    weight: number | null;
    reps: number;
    rpe: number | null;
}

interface WorkoutState {
    // Saved workout templates
    workouts: Workout[];
    workoutsLoading: boolean;

    // Active workout session
    activeWorkoutLogId: string | null;
    activeSets: ActiveSet[];

    // Recent logs
    recentLogs: WorkoutLog[];

    // Actions — templates
    fetchWorkouts: (userId: string) => Promise<void>;
    createWorkout: (data: WorkoutInsert) => Promise<Workout>;
    updateWorkout: (id: string, data: WorkoutUpdate) => Promise<void>;
    deleteWorkout: (id: string) => Promise<void>;

    // Actions — active session
    startSession: (userId: string, workoutId?: string) => Promise<void>;
    addSet: (set: ActiveSet) => void;
    finishSession: () => Promise<void>;

    // Actions — history
    fetchRecentLogs: (userId: string, limit?: number) => Promise<void>;

    clear: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
    workouts: [],
    workoutsLoading: false,
    activeWorkoutLogId: null,
    activeSets: [],
    recentLogs: [],

    fetchWorkouts: async (userId) => {
        set({ workoutsLoading: true });
        try {
            const workouts = await workoutService.getWorkouts(userId);
            set({ workouts, workoutsLoading: false });
        } catch {
            set({ workoutsLoading: false });
        }
    },

    createWorkout: async (data) => {
        const workout = await workoutService.createWorkout(data);
        set((s) => ({ workouts: [workout, ...s.workouts] }));
        return workout;
    },

    updateWorkout: async (id, data) => {
        const updated = await workoutService.updateWorkout(id, data);
        set((s) => ({
            workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...updated } : w)),
        }));
    },

    deleteWorkout: async (id) => {
        await workoutService.deleteWorkout(id);
        set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) }));
    },

    startSession: async (userId, workoutId) => {
        const log = await workoutService.logWorkout({
            user_id: userId,
            workout_id: workoutId ?? null,
            started_at: new Date().toISOString(),
        });
        set({ activeWorkoutLogId: log.id, activeSets: [] });
    },

    addSet: (newSet) => {
        set((s) => ({ activeSets: [...s.activeSets, newSet] }));
    },

    finishSession: async () => {
        const { activeWorkoutLogId } = get();
        if (activeWorkoutLogId) {
            await workoutService.finishWorkoutLog(activeWorkoutLogId);
        }
        set({ activeWorkoutLogId: null, activeSets: [] });
    },

    fetchRecentLogs: async (userId, limit = 10) => {
        const logs = await workoutService.getWorkoutLogs(userId, limit);
        set({ recentLogs: logs });
    },

    clear: () =>
        set({
            workouts: [],
            workoutsLoading: false,
            activeWorkoutLogId: null,
            activeSets: [],
            recentLogs: [],
        }),
}));
