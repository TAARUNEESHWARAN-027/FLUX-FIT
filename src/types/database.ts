// ─── Enums ────────────────────────────────────────────────────────────────────

export type MuscleGroup =
    | 'chest'
    | 'back'
    | 'shoulders'
    | 'biceps'
    | 'triceps'
    | 'quadriceps'
    | 'hamstrings'
    | 'glutes'
    | 'calves'
    | 'core'
    | 'forearms'
    | 'full_body';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type XpEventType =
    | 'workout_completed'
    | 'streak_bonus'
    | 'checkin_completed'
    | 'personal_record'
    | 'challenge_won'
    | 'level_up_bonus';

// ─── Row types ────────────────────────────────────────────────────────────────

export interface Profile {
    id: string;                   // uuid — FK to auth.users.id
    display_name: string | null;
    avatar_url: string | null;
    xp: number;
    level: number;
    streak: number;
    longest_streak: number;
    created_at: string;
    updated_at: string;
}

export interface Exercise {
    id: string;
    name: string;
    muscle_group: MuscleGroup;
    equipment: string | null;
    demo_url: string | null;
    created_at: string;
}

export interface Workout {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    difficulty: Difficulty;
    estimated_minutes: number;
    is_template: boolean;
    created_at: string;
    updated_at: string;
}

export interface WorkoutExercise {
    id: string;
    workout_id: string;
    exercise_id: string;
    order_index: number;
    target_sets: number;
    target_reps_min: number;
    target_reps_max: number;
    target_rpe: number | null;
    rest_seconds: number;
    notes: string | null;
    // Joined fields (optional — populated via query)
    exercise?: Exercise;
}

export interface WorkoutLog {
    id: string;
    user_id: string;
    workout_id: string | null;
    started_at: string;
    finished_at: string | null;
    duration_seconds: number | null;
    notes: string | null;
    xp_earned: number;
    created_at: string;
    // Joined fields
    workout?: Workout;
    exercise_logs?: ExerciseLog[];
}

export interface ExerciseLog {
    id: string;
    workout_log_id: string;
    exercise_id: string;
    set_number: number;
    weight_kg: number | null;
    reps: number;
    rpe: number | null;
    is_personal_record: boolean;
    notes: string | null;
    created_at: string;
    // Joined fields
    exercise?: Exercise;
}

export interface DailyCheckin {
    id: string;
    user_id: string;
    date: string;                 // DATE (YYYY-MM-DD)
    mood: number;                 // 1-5
    sleep_hours: number | null;
    sleep_quality: number | null; // 1-5
    soreness: number | null;      // 1-5
    energy: number | null;        // 1-5
    notes: string | null;
    created_at: string;
}

export interface XpLedgerEntry {
    id: string;
    user_id: string;
    event_type: XpEventType;
    amount: number;
    reference_id: string | null;  // FK to the entity that caused the event
    created_at: string;
}

// ─── Insert/Update helpers ────────────────────────────────────────────────────

export type ProfileUpdate = Partial<Pick<Profile, 'display_name' | 'avatar_url'>>;

export type WorkoutInsert = Omit<Workout, 'id' | 'created_at' | 'updated_at'>;
export type WorkoutUpdate = Partial<Pick<Workout, 'name' | 'description' | 'difficulty' | 'estimated_minutes'>>;

export type WorkoutExerciseInsert = Omit<WorkoutExercise, 'id' | 'exercise'>;

export type WorkoutLogInsert = Pick<WorkoutLog, 'workout_id' | 'started_at'> & { user_id: string };

export type ExerciseLogInsert = Omit<ExerciseLog, 'id' | 'created_at' | 'exercise' | 'is_personal_record'>;

export type DailyCheckinInsert = Omit<DailyCheckin, 'id' | 'created_at'>;

export type XpLedgerInsert = Omit<XpLedgerEntry, 'id' | 'created_at'>;
