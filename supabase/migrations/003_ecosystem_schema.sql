-- ============================================================
-- FLUX FIT: ECOSYSTEM EXPANSION SCHEMA (Migration 003)
-- AI Engine, Gamification, Holistic Health, Security & More
-- Idempotent — safe to run multiple times
-- ============================================================

-- ============================================================
-- 1. SOFT DELETES ON EXISTING TABLES
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ============================================================
-- 2. EXTENDED LEVEL DEFINITIONS (Infinite Scaling)
-- Formula: XP = floor(1000 * level^1.5)
-- ============================================================

INSERT INTO public.level_definitions (level, xp_required, title) VALUES
(9,   27000,  'Titan'),
(10,  31623,  'Diamond'),
(11,  36483,  'Apex Predator'),
(12,  41569,  'Unstoppable'),
(13,  46872,  'Mythic'),
(14,  52383,  'Transcendent'),
(15,  58094,  'Omega'),
(16,  64000,  'Ascended'),
(17,  70093,  'Immortal'),
(18,  76368,  'Flux Master'),
(19,  82820,  'Singularity'),
(20,  89443,  'Godlike')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. GOALS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.goals (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    title text NOT NULL,
    description text,
    category text NOT NULL DEFAULT 'fitness'
        CHECK (category IN ('fitness', 'nutrition', 'recovery', 'mental', 'custom')),
    goal_type text NOT NULL DEFAULT 'target'
        CHECK (goal_type IN ('target', 'habit', 'milestone')),
    target_metrics jsonb DEFAULT '{}'::jsonb,
    -- e.g. {"metric": "workouts_per_week", "target_value": 5, "current_value": 3}
    progress_pct float DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    status text DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
    deadline date,
    ai_suggested boolean DEFAULT false,
    ai_rationale text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON public.goals(user_id, deadline) WHERE status = 'active';

-- ============================================================
-- 4. AI RECOMMENDATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    recommendation_type text NOT NULL
        CHECK (recommendation_type IN ('daily_plan', 'nudge', 'recovery', 'challenge', 'insight', 'goal_suggestion')),
    priority text DEFAULT 'medium'
        CHECK (priority IN ('high', 'medium', 'low')),
    title text NOT NULL,
    message text NOT NULL,
    action_label text,
    action_route text,
    content jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending'
        CHECK (status IN ('pending', 'seen', 'acted', 'dismissed', 'expired')),
    feedback_rating int CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_note text,
    expires_at timestamptz,
    seen_at timestamptz,
    acted_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_recs_user ON public.ai_recommendations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_recs_type ON public.ai_recommendations(user_id, recommendation_type, created_at DESC);

-- ============================================================
-- 5. ACHIEVEMENTS SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS public.achievements (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL DEFAULT '🏆',
    category text NOT NULL DEFAULT 'general'
        CHECK (category IN ('general', 'workout', 'nutrition', 'recovery', 'streak', 'social', 'milestone')),
    rarity text DEFAULT 'common'
        CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    xp_reward int DEFAULT 0,
    unlock_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- e.g. {"type": "streak_days", "threshold": 7}
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    achievement_id uuid REFERENCES public.achievements(id) NOT NULL,
    unlocked_at timestamptz DEFAULT now(),
    notified boolean DEFAULT false,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements ON public.user_achievements(user_id);

-- Seed achievements
INSERT INTO public.achievements (code, title, description, icon, category, rarity, xp_reward, unlock_criteria, sort_order) VALUES
-- Streak achievements
('streak_3',     'Spark',              'Maintain a 3-day streak',                    '🔥', 'streak',   'common',    50,   '{"type":"streak_days","threshold":3}',    10),
('streak_7',     'Week Warrior',       'Maintain a 7-day streak',                    '⚡', 'streak',   'uncommon',  150,  '{"type":"streak_days","threshold":7}',    20),
('streak_14',    'Fortnight Force',    'Maintain a 14-day streak',                   '💪', 'streak',   'rare',      300,  '{"type":"streak_days","threshold":14}',   30),
('streak_30',    'Iron Discipline',    'Maintain a 30-day streak',                   '🏅', 'streak',   'epic',      750,  '{"type":"streak_days","threshold":30}',   40),
('streak_100',   'Centurion',          'Maintain a 100-day streak',                  '👑', 'streak',   'legendary', 2000, '{"type":"streak_days","threshold":100}',  50),

-- Workout achievements
('first_workout','First Rep',          'Complete your first workout',                '🎯', 'workout',  'common',    25,   '{"type":"workout_count","threshold":1}',  100),
('workout_10',   'Gaining Momentum',   'Complete 10 workouts',                       '💥', 'workout',  'uncommon',  100,  '{"type":"workout_count","threshold":10}', 110),
('workout_50',   'Iron Regular',       'Complete 50 workouts',                       '🦾', 'workout',  'rare',      500,  '{"type":"workout_count","threshold":50}', 120),
('workout_100',  'Century Lifter',     'Complete 100 workouts',                      '🏋️', 'workout',  'epic',      1000, '{"type":"workout_count","threshold":100}',130),

-- Nutrition achievements
('nutrition_7d', 'Clean Week',         'Track nutrition for 7 consecutive days',     '🥗', 'nutrition','uncommon',  100,  '{"type":"nutrition_streak","threshold":7}',200),
('hydration_7d', 'Hydration Hero',     'Hit water goal for 7 consecutive days',      '💧', 'nutrition','uncommon',  100,  '{"type":"water_streak","threshold":7}',   210),

-- Recovery achievements
('sleep_master', 'Sleep Master',       'Log 7+ hours of sleep for 7 straight days',  '😴', 'recovery', 'uncommon',  100,  '{"type":"sleep_streak","threshold":7}',   300),

-- Milestone achievements
('level_5',      'Rising Star',        'Reach Level 5',                              '⭐', 'milestone','uncommon',  200,  '{"type":"level","threshold":5}',          400),
('level_10',     'Elite Status',       'Reach Level 10',                             '🌟', 'milestone','rare',      500,  '{"type":"level","threshold":10}',         410),
('level_20',     'Godlike',            'Reach Level 20',                             '💎', 'milestone','legendary', 2000, '{"type":"level","threshold":20}',         420),
('xp_10k',       'XP Hoarder',        'Earn 10,000 total XP',                       '💰', 'milestone','rare',      250,  '{"type":"total_xp","threshold":10000}',   430),

-- Social achievements
('first_post',   'Voice Heard',        'Make your first community post',             '📣', 'social',   'common',    25,   '{"type":"post_count","threshold":1}',     500)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 6. BEHAVIORAL METRICS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.behavioral_metrics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    week_start date NOT NULL,
    consistency_score float DEFAULT 0 CHECK (consistency_score BETWEEN 0 AND 1),
    -- days_active / 7
    adherence_score float DEFAULT 0 CHECK (adherence_score BETWEEN 0 AND 1),
    -- avg plan adherence
    habit_strength float DEFAULT 0 CHECK (habit_strength BETWEEN 0 AND 100),
    -- composite: (consistency*0.4 + streak_ratio*0.3 + improvement*0.3) * 100
    improvement_rate float DEFAULT 0,
    -- week-over-week delta in composite health score
    workout_count int DEFAULT 0,
    nutrition_logged_days int DEFAULT 0,
    recovery_logged_days int DEFAULT 0,
    mood_avg float,
    sleep_avg_hours float,
    computed_at timestamptz DEFAULT now(),
    UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_behavioral_user ON public.behavioral_metrics(user_id, week_start DESC);

-- ============================================================
-- 7. MOOD JOURNAL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mood_journal (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    date date NOT NULL DEFAULT current_date,
    mood_score int NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
    energy_level int CHECK (energy_level BETWEEN 1 AND 5),
    anxiety_level int CHECK (anxiety_level BETWEEN 1 AND 5),
    tags text[] DEFAULT '{}',
    -- e.g. {'grateful', 'stressed', 'motivated', 'tired'}
    journal_entry text,
    context text,
    -- e.g. 'morning', 'post-workout', 'evening'
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, date, context)
);

CREATE INDEX IF NOT EXISTS idx_mood_user ON public.mood_journal(user_id, date DESC);

-- ============================================================
-- 8. HEALTH SCORES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.health_scores (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    date date NOT NULL DEFAULT current_date,
    composite_score int NOT NULL CHECK (composite_score BETWEEN 0 AND 100),
    workout_score int DEFAULT 0 CHECK (workout_score BETWEEN 0 AND 100),
    nutrition_score int DEFAULT 0 CHECK (nutrition_score BETWEEN 0 AND 100),
    sleep_score int DEFAULT 0 CHECK (sleep_score BETWEEN 0 AND 100),
    mood_score int DEFAULT 0 CHECK (mood_score BETWEEN 0 AND 100),
    recovery_score int DEFAULT 0 CHECK (recovery_score BETWEEN 0 AND 100),
    breakdown jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_health_scores_user ON public.health_scores(user_id, date DESC);

-- ============================================================
-- 9. NOTIFICATION HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notification_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    notification_type text NOT NULL
        CHECK (notification_type IN ('nudge', 'achievement', 'streak', 'level_up', 'system', 'ai_recommendation')),
    title text NOT NULL,
    message text NOT NULL,
    action_route text,
    read boolean DEFAULT false,
    read_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notification_history(user_id, read, created_at DESC);

-- ============================================================
-- 10. GDPR: USER CONSENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_consents (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    consent_type text NOT NULL
        CHECK (consent_type IN ('data_processing', 'analytics', 'marketing', 'wearable_sync', 'ai_recommendations')),
    granted boolean NOT NULL DEFAULT false,
    granted_at timestamptz,
    revoked_at timestamptz,
    ip_address text,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, consent_type)
);

-- ============================================================
-- 11. AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid,
    action text NOT NULL,
    table_name text,
    record_id text,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table ON public.audit_log(table_name, created_at DESC);

-- ============================================================
-- 12. FEATURE FLAGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    flag_key text UNIQUE NOT NULL,
    enabled boolean DEFAULT false,
    description text,
    rollout_pct int DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Seed default flags
INSERT INTO public.feature_flags (flag_key, enabled, description) VALUES
('ai_coach',        true,  'AI coaching engine'),
('mood_journal',    true,  'Mood journaling feature'),
('health_score',    true,  'Composite health score'),
('insights_page',   true,  'Behavioral insights page'),
('wearable_sync',   false, 'Wearable device sync (future)'),
('social_challenges',false, 'Social challenges (future)')
ON CONFLICT (flag_key) DO NOTHING;

-- ============================================================
-- 13. WEARABLE DATA (Future-Ready)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wearable_data (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    device_id text NOT NULL,
    device_type text NOT NULL
        CHECK (device_type IN ('apple_watch', 'fitbit', 'garmin', 'whoop', 'oura', 'samsung', 'other')),
    data_type text NOT NULL
        CHECK (data_type IN ('heart_rate', 'steps', 'calories_burned', 'sleep', 'spo2', 'hrv', 'stress', 'activity')),
    raw_value jsonb NOT NULL,
    normalized_value float,
    unit text,
    recorded_at timestamptz NOT NULL,
    synced_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wearable_user ON public.wearable_data(user_id, data_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_device ON public.wearable_data(device_id, recorded_at DESC);

-- ============================================================
-- 14. STREAK HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.streak_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    started_at date NOT NULL,
    ended_at date,
    length int NOT NULL DEFAULT 1,
    streak_type text DEFAULT 'activity'
        CHECK (streak_type IN ('activity', 'workout', 'nutrition', 'recovery')),
    max_multiplier float DEFAULT 1.0,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_streak_history_user ON public.streak_history(user_id, started_at DESC);

-- ============================================================
-- 15. ROW LEVEL SECURITY FOR NEW TABLES
-- ============================================================

-- Goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Manage Goals" ON public.goals;
CREATE POLICY "Owner Manage Goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- AI Recommendations
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Manage AI Recs" ON public.ai_recommendations;
CREATE POLICY "Owner Manage AI Recs" ON public.ai_recommendations FOR ALL USING (auth.uid() = user_id);

-- Achievements (public read)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Achievements" ON public.achievements;
CREATE POLICY "Public Read Achievements" ON public.achievements FOR SELECT USING (true);

-- User Achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Read User Achievements" ON public.user_achievements;
CREATE POLICY "Owner Read User Achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Behavioral Metrics
ALTER TABLE public.behavioral_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Read Metrics" ON public.behavioral_metrics;
CREATE POLICY "Owner Read Metrics" ON public.behavioral_metrics FOR ALL USING (auth.uid() = user_id);

-- Mood Journal
ALTER TABLE public.mood_journal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Manage Mood" ON public.mood_journal;
CREATE POLICY "Owner Manage Mood" ON public.mood_journal FOR ALL USING (auth.uid() = user_id);

-- Health Scores
ALTER TABLE public.health_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Read Health Scores" ON public.health_scores;
CREATE POLICY "Owner Read Health Scores" ON public.health_scores FOR ALL USING (auth.uid() = user_id);

-- Notification History
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Manage Notifications" ON public.notification_history;
CREATE POLICY "Owner Manage Notifications" ON public.notification_history FOR ALL USING (auth.uid() = user_id);

-- User Consents
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Manage Consents" ON public.user_consents;
CREATE POLICY "Owner Manage Consents" ON public.user_consents FOR ALL USING (auth.uid() = user_id);

-- Audit Log (no user access — admin/service role only)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Feature Flags (public read)
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Flags" ON public.feature_flags;
CREATE POLICY "Public Read Flags" ON public.feature_flags FOR SELECT USING (true);

-- Wearable Data
ALTER TABLE public.wearable_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Manage Wearable" ON public.wearable_data;
CREATE POLICY "Owner Manage Wearable" ON public.wearable_data FOR ALL USING (auth.uid() = user_id);

-- Streak History
ALTER TABLE public.streak_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Read Streaks" ON public.streak_history;
CREATE POLICY "Owner Read Streaks" ON public.streak_history FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 16. HELPER: AUTO-CONSENT ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.seed_default_consents()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_consents (user_id, consent_type, granted, granted_at) VALUES
    (NEW.id, 'data_processing', true, now()),
    (NEW.id, 'ai_recommendations', true, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_consents ON public.profiles;
CREATE TRIGGER on_profile_created_consents
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.seed_default_consents();
