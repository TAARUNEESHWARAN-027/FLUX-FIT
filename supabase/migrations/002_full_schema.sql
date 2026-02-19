-- ============================================================
-- FLUX FIT: COMPLETE DATABASE SCHEMA
-- Run this entire script in your Supabase SQL Editor
-- It is idempotent (safe to run multiple times)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. CONFIGURATION TABLES
-- ============================================================

create table if not exists public.scoring_config (
    id int primary key default 1,
    workout_weight float default 100.0,
    diet_weight float default 50.0,
    recovery_weight float default 30.0,
    streak_bonus_cap float default 1.5,
    anti_spike_limit int default 500,
    constraint singleton check (id = 1)
);
insert into public.scoring_config (id) values (1) on conflict do nothing;

create table if not exists public.level_definitions (
    level int primary key,
    xp_required bigint not null,
    title text,
    icon_url text
);
insert into public.level_definitions (level, xp_required, title) values
(1, 0, 'Novice'),
(2, 1000, 'Beginner'),
(3, 2500, 'Consistency Builder'),
(4, 5000, 'Discipline Acolyte'),
(5, 10000, 'Flux Initiate'),
(6, 20000, 'Iron Will'),
(7, 35000, 'Elite Performer'),
(8, 50000, 'Legendary')
on conflict do nothing;

-- ============================================================
-- 2. PROFILES
-- ============================================================

create table if not exists public.profiles (
    id uuid references auth.users not null primary key,
    username text unique,
    current_level int default 1 references public.level_definitions(level),
    current_xp bigint default 0,
    streak_current int default 0,
    streak_longest int default 0,
    last_activity_at timestamptz,
    xp_updated_at timestamptz,
    display_name text,
    avatar_url text,
    bio text,
    fitness_goal text default 'general_fitness',
    height_cm float,
    weight_kg float,
    date_of_birth date,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 3. XP LEDGER
-- ============================================================

do $$ begin
  create type xp_source_type as enum ('WORKOUT_LOG', 'DIET_LOG', 'RECOVERY_LOG', 'STREAK_BONUS', 'LEVEL_UP_BONUS', 'MANUAL_ADJUSTMENT');
exception when duplicate_object then null;
end $$;

create table if not exists public.xp_ledger (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    amount int not null check (amount > 0),
    source_type xp_source_type not null,
    reference_id uuid,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

create index if not exists idx_xp_ledger_user on public.xp_ledger(user_id);

-- ============================================================
-- 4. DAILY CHECK-INS
-- ============================================================

do $$ begin
  create type checkin_status as enum ('PENDING', 'PROCESSED');
exception when duplicate_object then null;
end $$;

create table if not exists public.daily_checkins (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    date date not null,
    status checkin_status default 'PENDING',
    processed_at timestamptz,
    notes text,
    created_at timestamptz default now(),
    unique(user_id, date)
);

-- ============================================================
-- 5. WORKOUT PLANS & LOGS
-- ============================================================

create table if not exists public.workout_plans (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    day_of_week int not null check (day_of_week between 0 and 6), -- 0=Sun
    name text not null,
    focus text, -- e.g. "Chest, Shoulders & Triceps"
    intensity text default 'moderate', -- low/moderate/high
    estimated_duration_min int default 60,
    exercises jsonb not null default '[]'::jsonb,
    -- exercises format: [{name, sets, reps, rpe}]
    is_rest_day boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_workout_plans_user on public.workout_plans(user_id, day_of_week);

create table if not exists public.workout_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    checkin_id uuid references public.daily_checkins(id),
    plan_id uuid references public.workout_plans(id),
    date date not null default current_date,
    exercises_completed jsonb default '[]'::jsonb,
    -- format: [{name, sets: [{weight, reps, rpe}]}]
    duration_minutes int,
    total_volume_kg float default 0,
    rpe_average float,
    adherence_score float default 0,
    notes text,
    created_at timestamptz default now()
);

create index if not exists idx_workout_logs_user on public.workout_logs(user_id, date);

create table if not exists public.personal_records (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    exercise_name text not null,
    weight_kg float not null,
    reps int default 1,
    achieved_at timestamptz default now(),
    workout_log_id uuid references public.workout_logs(id),
    unique(user_id, exercise_name)
);

-- ============================================================
-- 6. NUTRITION
-- ============================================================

create table if not exists public.nutrition_targets (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null unique,
    calories int default 2500,
    protein_g int default 180,
    carbs_g int default 280,
    fat_g int default 70,
    fiber_g int default 30,
    water_glasses int default 8,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.meal_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    date date not null default current_date,
    meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snacks')),
    name text not null,
    calories int default 0,
    protein_g float default 0,
    carbs_g float default 0,
    fat_g float default 0,
    created_at timestamptz default now()
);

create index if not exists idx_meal_logs_user_date on public.meal_logs(user_id, date);

create table if not exists public.water_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    date date not null default current_date,
    glasses int default 0,
    updated_at timestamptz default now(),
    unique(user_id, date)
);

-- ============================================================
-- 7. RECOVERY
-- ============================================================

create table if not exists public.recovery_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    date date not null default current_date,
    sleep_hours float,
    sleep_quality int check (sleep_quality between 1 and 5),
    soreness_level int check (soreness_level between 1 and 10),
    stress_level int check (stress_level between 1 and 10),
    readiness_score int, -- calculated: 0-100
    protocols_completed jsonb default '[]'::jsonb,
    -- format: [{name, completed: bool}]
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, date)
);

create index if not exists idx_recovery_logs_user on public.recovery_logs(user_id, date);

-- ============================================================
-- 8. COMMUNITY
-- ============================================================

create table if not exists public.community_posts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    content text not null,
    post_type text default 'general' check (post_type in ('general', 'workout', 'pr', 'milestone', 'challenge')),
    metadata jsonb default '{}'::jsonb,
    likes_count int default 0,
    comments_count int default 0,
    created_at timestamptz default now()
);

create index if not exists idx_posts_created on public.community_posts(created_at desc);

create table if not exists public.post_likes (
    user_id uuid references public.profiles(id) not null,
    post_id uuid references public.community_posts(id) not null,
    created_at timestamptz default now(),
    primary key (user_id, post_id)
);

create table if not exists public.post_comments (
    id uuid default uuid_generate_v4() primary key,
    post_id uuid references public.community_posts(id) not null,
    user_id uuid references public.profiles(id) not null,
    content text not null,
    created_at timestamptz default now()
);

-- ============================================================
-- 9. STORED PROCEDURES
-- ============================================================

create or replace function public.commit_xp_transaction(
    p_user_id uuid,
    p_amount int,
    p_source_type xp_source_type,
    p_reference_id uuid,
    p_metadata jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_new_total bigint;
    v_current_level int;
    v_new_level int;
    v_xp_cap int;
begin
    select anti_spike_limit into v_xp_cap from public.scoring_config where id = 1;
    if p_amount > v_xp_cap then
        raise exception 'XP amount % exceeds limit %', p_amount, v_xp_cap;
    end if;

    if exists (select 1 from public.xp_ledger where reference_id = p_reference_id) then
        return jsonb_build_object('status', 'skipped', 'reason', 'duplicate_reference');
    end if;

    insert into public.xp_ledger (user_id, amount, source_type, reference_id, metadata)
    values (p_user_id, p_amount, p_source_type, p_reference_id, p_metadata);

    update public.profiles
    set current_xp = current_xp + p_amount, xp_updated_at = now()
    where id = p_user_id
    returning current_xp, current_level into v_new_total, v_current_level;

    select level into v_new_level
    from public.level_definitions
    where xp_required <= v_new_total
    order by level desc limit 1;

    if v_new_level > v_current_level then
        update public.profiles set current_level = v_new_level where id = p_user_id;
    end if;

    return jsonb_build_object(
        'status', 'success',
        'new_xp', v_new_total,
        'new_level', v_new_level,
        'leveled_up', (v_new_level > v_current_level)
    );
end;
$$;

-- Helper: auto-seed defaults for new user
create or replace function public.seed_new_user_defaults()
returns trigger as $$
begin
    -- Default nutrition targets
    insert into public.nutrition_targets (user_id) values (new.id);

    -- Default workout plan (Push/Pull/Legs)
    insert into public.workout_plans (user_id, day_of_week, name, focus, intensity, estimated_duration_min, exercises, is_rest_day) values
    (new.id, 1, 'Push A - Hypertrophy', 'Chest, Shoulders & Triceps', 'high', 70,
     '[{"name":"Incline Bench Press","sets":"4","reps":"8-10","rpe":8},{"name":"Overhead Press","sets":"3","reps":"10-12","rpe":8},{"name":"Lateral Raises","sets":"4","reps":"15-20","rpe":9},{"name":"Tricep Pushdowns","sets":"3","reps":"12-15","rpe":8}]'::jsonb, false),

    (new.id, 2, 'Pull A - Strength', 'Back & Biceps', 'high', 65,
     '[{"name":"Weighted Pull-ups","sets":"3","reps":"5-8","rpe":9},{"name":"Barbell Row","sets":"4","reps":"8-10","rpe":8},{"name":"Lat Pulldowns","sets":"3","reps":"10-12","rpe":8},{"name":"Face Pulls","sets":"4","reps":"15-20","rpe":7}]'::jsonb, false),

    (new.id, 3, 'Legs - Power', 'Quads, Hamstrings & Glutes', 'high', 75,
     '[{"name":"Barbell Squat","sets":"4","reps":"6-8","rpe":9},{"name":"Romanian Deadlift","sets":"3","reps":"8-10","rpe":8},{"name":"Leg Press","sets":"3","reps":"10-12","rpe":8},{"name":"Walking Lunges","sets":"3","reps":"12 each","rpe":7}]'::jsonb, false),

    (new.id, 4, 'Push B - Volume', 'Chest, Shoulders & Triceps', 'moderate', 60,
     '[{"name":"Flat Dumbbell Press","sets":"4","reps":"10-12","rpe":8},{"name":"Cable Flyes","sets":"3","reps":"12-15","rpe":7},{"name":"Arnold Press","sets":"3","reps":"10-12","rpe":8},{"name":"Overhead Extensions","sets":"3","reps":"12-15","rpe":7}]'::jsonb, false),

    (new.id, 5, 'Pull B - Volume', 'Back & Biceps', 'moderate', 60,
     '[{"name":"Cable Row","sets":"4","reps":"10-12","rpe":8},{"name":"Single-Arm Lat Pulldown","sets":"3","reps":"10-12","rpe":8},{"name":"Rear Delt Flyes","sets":"3","reps":"15-20","rpe":7},{"name":"Barbell Curls","sets":"3","reps":"10-12","rpe":8}]'::jsonb, false),

    (new.id, 6, 'Active Recovery', 'Light Cardio & Mobility', 'low', 30,
     '[{"name":"Light Walking","sets":"1","reps":"20 min","rpe":3},{"name":"Foam Rolling","sets":"1","reps":"10 min","rpe":2}]'::jsonb, true),

    (new.id, 0, 'Rest Day', 'Full Rest', 'low', 0, '[]'::jsonb, true);

    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_seed on public.profiles;
create trigger on_profile_created_seed
  after insert on public.profiles
  for each row execute procedure public.seed_new_user_defaults();

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================

-- Profiles
alter table public.profiles enable row level security;
drop policy if exists "Public Read Profiles" on public.profiles;
create policy "Public Read Profiles" on public.profiles for select using (true);
drop policy if exists "Owner Update Profile" on public.profiles;
create policy "Owner Update Profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Owner Insert Profile" on public.profiles;
create policy "Owner Insert Profile" on public.profiles for insert with check (auth.uid() = id);

-- XP Ledger (read-only for users)
alter table public.xp_ledger enable row level security;
drop policy if exists "Owner Read Ledger" on public.xp_ledger;
create policy "Owner Read Ledger" on public.xp_ledger for select using (auth.uid() = user_id);

-- Daily Check-ins
alter table public.daily_checkins enable row level security;
drop policy if exists "Owner ALL Checkins" on public.daily_checkins;
create policy "Owner ALL Checkins" on public.daily_checkins for all using (auth.uid() = user_id);

-- Workout Plans
alter table public.workout_plans enable row level security;
drop policy if exists "Owner Manage Plans" on public.workout_plans;
create policy "Owner Manage Plans" on public.workout_plans for all using (auth.uid() = user_id);

-- Workout Logs
alter table public.workout_logs enable row level security;
drop policy if exists "Owner Manage Logs" on public.workout_logs;
create policy "Owner Manage Logs" on public.workout_logs for all using (auth.uid() = user_id);

-- Personal Records
alter table public.personal_records enable row level security;
drop policy if exists "Owner Manage PRs" on public.personal_records;
create policy "Owner Manage PRs" on public.personal_records for all using (auth.uid() = user_id);

-- Nutrition Targets
alter table public.nutrition_targets enable row level security;
drop policy if exists "Owner Manage Nutrition" on public.nutrition_targets;
create policy "Owner Manage Nutrition" on public.nutrition_targets for all using (auth.uid() = user_id);

-- Meal Logs
alter table public.meal_logs enable row level security;
drop policy if exists "Owner Manage Meals" on public.meal_logs;
create policy "Owner Manage Meals" on public.meal_logs for all using (auth.uid() = user_id);

-- Water Logs
alter table public.water_logs enable row level security;
drop policy if exists "Owner Manage Water" on public.water_logs;
create policy "Owner Manage Water" on public.water_logs for all using (auth.uid() = user_id);

-- Recovery Logs
alter table public.recovery_logs enable row level security;
drop policy if exists "Owner Manage Recovery" on public.recovery_logs;
create policy "Owner Manage Recovery" on public.recovery_logs for all using (auth.uid() = user_id);

-- Community Posts (public read, owner write)
alter table public.community_posts enable row level security;
drop policy if exists "Public Read Posts" on public.community_posts;
create policy "Public Read Posts" on public.community_posts for select using (true);
drop policy if exists "Owner Insert Posts" on public.community_posts;
create policy "Owner Insert Posts" on public.community_posts for insert with check (auth.uid() = user_id);
drop policy if exists "Owner Delete Posts" on public.community_posts;
create policy "Owner Delete Posts" on public.community_posts for delete using (auth.uid() = user_id);

-- Post Likes
alter table public.post_likes enable row level security;
drop policy if exists "Public Read Likes" on public.post_likes;
create policy "Public Read Likes" on public.post_likes for select using (true);
drop policy if exists "Owner Manage Likes" on public.post_likes;
create policy "Owner Manage Likes" on public.post_likes for insert with check (auth.uid() = user_id);
drop policy if exists "Owner Delete Likes" on public.post_likes;
create policy "Owner Delete Likes" on public.post_likes for delete using (auth.uid() = user_id);

-- Post Comments
alter table public.post_comments enable row level security;
drop policy if exists "Public Read Comments" on public.post_comments;
create policy "Public Read Comments" on public.post_comments for select using (true);
drop policy if exists "Owner Insert Comments" on public.post_comments;
create policy "Owner Insert Comments" on public.post_comments for insert with check (auth.uid() = user_id);

-- ============================================================
-- 11. LEADERBOARD MATERIALIZED VIEW
-- ============================================================

drop materialized view if exists public.leaderboard_global;
create materialized view public.leaderboard_global as
select
    row_number() over (order by current_xp desc) as rank,
    id as user_id,
    username,
    display_name,
    avatar_url,
    current_level,
    current_xp,
    streak_current
from public.profiles;

create unique index if not exists idx_leaderboard_user on public.leaderboard_global (user_id);

create or replace function refresh_leaderboard()
returns void language sql security definer
as $$
  refresh materialized view concurrently public.leaderboard_global;
$$;
