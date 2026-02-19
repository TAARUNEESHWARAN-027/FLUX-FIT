-- FLUX FIT PRODUCTION SCHEMA
-- "The Discipline Economy"

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. CONFIGURATION
create table public.scoring_config (
    id int primary key default 1,
    workout_weight float default 100.0,
    diet_weight float default 50.0,
    recovery_weight float default 30.0,
    streak_bonus_cap float default 1.5, -- Max 1.5x multiplier
    anti_spike_limit int default 500, -- Max XP per transaction
    constraint singleton check (id = 1)
);

insert into public.scoring_config (id) values (1) on conflict do nothing;

create table public.level_definitions (
    level int primary key,
    xp_required bigint not null,
    title text,
    icon_url text
);

-- Seed levels (Linear-ish for now)
insert into public.level_definitions (level, xp_required, title) values
(1, 0, 'Novice'),
(2, 1000, 'Beginner'),
(3, 2500, 'Consistency Builder'),
(4, 5000, 'Discipline Acolyte'),
(5, 10000, 'Flux Initiate')
on conflict do nothing;

-- 2. PROFILES (Derived State)
create table public.profiles (
    id uuid references auth.users not null primary key,
    username text unique,
    
    -- Derived / Managed State
    current_level int default 1 references public.level_definitions(level),
    current_xp bigint default 0,
    streak_current int default 0,
    streak_longest int default 0,
    
    last_activity_at timestamptz,
    xp_updated_at timestamptz,
    
    -- User Editable
    display_name text,
    avatar_url text,
    bio text,
    
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. THE LEDGER (Immutable)
create type xp_source_type as enum ('WORKOUT_LOG', 'DIET_LOG', 'RECOVERY_LOG', 'STREAK_BONUS', 'LEVEL_UP_BONUS', 'MANUAL_ADJUSTMENT');

create table public.xp_ledger (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    amount int not null check (amount > 0),
    source_type xp_source_type not null,
    reference_id uuid, -- Idempotency key (points to log ID)
    metadata jsonb default '{}'::jsonb, -- Store snapshot of weights/multipliers used
    created_at timestamptz default now()
);

-- Index for summation
create index idx_xp_ledger_user on public.xp_ledger(user_id);
create index idx_xp_ledger_ref on public.xp_ledger(reference_id);

-- 4. ACTIVITY LOGS (The Evidence)
create type checkin_status as enum ('PENDING', 'PROCESSED');

create table public.daily_checkins (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    date date not null,
    status checkin_status default 'PENDING',
    processed_at timestamptz,
    notes text,
    created_at timestamptz default now(),
    unique(user_id, date)
);

-- 5. STORED PROCEDURES (The Bank)

-- A. Commit Transaction
create or replace function public.commit_xp_transaction(
    p_user_id uuid,
    p_amount int,
    p_source_type xp_source_type,
    p_reference_id uuid,
    p_metadata jsonb
)
returns jsonb
language plpgsql
security definer -- Runs as Owner (Bypass RLS)
as $$
declare
    v_new_total bigint;
    v_current_level int;
    v_new_level int;
    v_xp_cap int;
begin
    -- 1. Anti-Cheat: Check Limits
    select anti_spike_limit into v_xp_cap from public.scoring_config where id = 1;
    if p_amount > v_xp_cap then
        raise exception 'XP Amount % exceeds anti-spike limit %', p_amount, v_xp_cap;
    end if;

    -- 2. Idempotency Check
    if exists (select 1 from public.xp_ledger where reference_id = p_reference_id) then
        return jsonb_build_object('status', 'skipped', 'reason', 'duplicate_reference');
    end if;

    -- 3. Insert Ledger Entry
    insert into public.xp_ledger (user_id, amount, source_type, reference_id, metadata)
    values (p_user_id, p_amount, p_source_type, p_reference_id, p_metadata);

    -- 4. Update Profile XP
    update public.profiles
    set current_xp = current_xp + p_amount,
        xp_updated_at = now()
    where id = p_user_id
    returning current_xp, current_level into v_new_total, v_current_level;

    -- 5. Check Level Up
    select level into v_new_level
    from public.level_definitions
    where xp_required <= v_new_total
    order by level desc
    limit 1;

    if v_new_level > v_current_level then
        update public.profiles
        set current_level = v_new_level
        where id = p_user_id;

        -- Recursive Bonus? (Optional, omitted for simplicity)
    end if;

    return jsonb_build_object(
        'status', 'success',
        'new_xp', v_new_total,
        'new_level', v_new_level,
        'leveled_up', (v_new_level > v_current_level)
    );
end;
$$;

-- 6. SECURITY POLICIES (RLS)

alter table public.profiles enable row level security;
alter table public.xp_ledger enable row level security;
alter table public.daily_checkins enable row level security;

-- Profiles
create policy "Public Read Profiles" on public.profiles for select using (true);
create policy "Owner Update Bio" on public.profiles for update using (auth.uid() = id);
-- Note: NO INSERT policy for profiles if created via trigger on auth.users, or specific setup.
create policy "Owner Insert Profile" on public.profiles for insert with check (auth.uid() = id);


-- Ledger
create policy "Owner Read Ledger" on public.xp_ledger for select using (auth.uid() = user_id);
-- CRITICAL: NO INSERT/UPDATE policy for Ledger. Only Service Role or Stored Proc (Security Definer) can write.

-- Checkins
create policy "Owner ALL Checkins" on public.daily_checkins for all using (auth.uid() = user_id);

-- 7. LEADERBOARD VIEW
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

create unique index on public.leaderboard_global (user_id);

-- Helper to refresh
create or replace function refresh_leaderboard()
returns void language sql security definer
as $$
  refresh materialized view concurrently public.leaderboard_global;
$$;
