-- ============================================================================
-- Flux Fit — Database Schema
-- Run against your Supabase project via the SQL Editor or CLI migrations.
-- ============================================================================

-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── ENUM types ─────────────────────────────────────────────────────────────
do $$ begin
  create type muscle_group as enum (
    'chest','back','shoulders','biceps','triceps',
    'quadriceps','hamstrings','glutes','calves','core','forearms','full_body'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type difficulty as enum ('beginner','intermediate','advanced');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type xp_event_type as enum (
    'workout_completed','streak_bonus','checkin_completed',
    'personal_record','challenge_won','level_up_bonus'
  );
exception when duplicate_object then null;
end $$;

-- ─── Profiles ───────────────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text,
  avatar_url    text,
  xp            int  not null default 0,
  level         int  not null default 1,
  streak        int  not null default 0,
  longest_streak int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Exercises (library) ────────────────────────────────────────────────────
create table if not exists exercises (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  muscle_group  muscle_group not null,
  equipment     text,
  demo_url      text,
  created_at    timestamptz not null default now()
);

alter table exercises enable row level security;

-- Exercises are readable by everyone (global library)
create policy "Exercises are viewable by authenticated users"
  on exercises for select using (auth.role() = 'authenticated');

-- ─── Workouts (templates) ───────────────────────────────────────────────────
create table if not exists workouts (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references profiles(id) on delete cascade,
  name              text not null,
  description       text,
  difficulty        difficulty not null default 'intermediate',
  estimated_minutes int not null default 60,
  is_template       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table workouts enable row level security;

create policy "Users can CRUD own workouts"
  on workouts for all using (auth.uid() = user_id);

-- ─── Workout ↔ Exercises (join) ─────────────────────────────────────────────
create table if not exists workout_exercises (
  id              uuid primary key default uuid_generate_v4(),
  workout_id      uuid not null references workouts(id) on delete cascade,
  exercise_id     uuid not null references exercises(id) on delete cascade,
  order_index     int not null default 0,
  target_sets     int not null default 3,
  target_reps_min int not null default 8,
  target_reps_max int not null default 12,
  target_rpe      numeric(3,1),
  rest_seconds    int not null default 90,
  notes           text
);

alter table workout_exercises enable row level security;

create policy "Users can CRUD own workout_exercises"
  on workout_exercises for all
  using (
    exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

-- ─── Workout Logs (completed sessions) ──────────────────────────────────────
create table if not exists workout_logs (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references profiles(id) on delete cascade,
  workout_id       uuid references workouts(id) on delete set null,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  duration_seconds int,
  notes            text,
  xp_earned        int not null default 0,
  created_at       timestamptz not null default now()
);

alter table workout_logs enable row level security;

create policy "Users can CRUD own workout_logs"
  on workout_logs for all using (auth.uid() = user_id);

-- ─── Exercise Logs (per-set data) ───────────────────────────────────────────
create table if not exists exercise_logs (
  id                uuid primary key default uuid_generate_v4(),
  workout_log_id    uuid not null references workout_logs(id) on delete cascade,
  exercise_id       uuid not null references exercises(id) on delete cascade,
  set_number        int not null,
  weight_kg         numeric(6,2),
  reps              int not null,
  rpe               numeric(3,1),
  is_personal_record boolean not null default false,
  notes             text,
  created_at        timestamptz not null default now()
);

alter table exercise_logs enable row level security;

create policy "Users can CRUD own exercise_logs"
  on exercise_logs for all
  using (
    exists (select 1 from workout_logs wl where wl.id = workout_log_id and wl.user_id = auth.uid())
  );

-- ─── Daily Check-ins ────────────────────────────────────────────────────────
create table if not exists daily_checkins (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  date          date not null default current_date,
  mood          int not null check (mood between 1 and 5),
  sleep_hours   numeric(3,1),
  sleep_quality int check (sleep_quality between 1 and 5),
  soreness      int check (soreness between 1 and 5),
  energy        int check (energy between 1 and 5),
  notes         text,
  created_at    timestamptz not null default now(),
  unique (user_id, date)
);

alter table daily_checkins enable row level security;

create policy "Users can CRUD own daily_checkins"
  on daily_checkins for all using (auth.uid() = user_id);

-- ─── XP Ledger ──────────────────────────────────────────────────────────────
create table if not exists xp_ledger (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  event_type    xp_event_type not null,
  amount        int not null,
  reference_id  uuid,
  created_at    timestamptz not null default now()
);

alter table xp_ledger enable row level security;

create policy "Users can view own xp_ledger"
  on xp_ledger for select using (auth.uid() = user_id);

create policy "Users can insert own xp_ledger"
  on xp_ledger for insert with check (auth.uid() = user_id);

-- ─── XP / Level Helper ─────────────────────────────────────────────────────
-- XP thresholds: level N requires N * 500 total XP  (Level 2 = 1000, Level 3 = 1500 …)
create or replace function increment_xp(p_user_id uuid, p_amount int)
returns void as $$
declare
  v_new_xp int;
  v_new_level int;
begin
  update profiles
    set xp = xp + p_amount,
        updated_at = now()
    where id = p_user_id
    returning xp into v_new_xp;

  v_new_level := greatest(1, floor(v_new_xp / 500.0)::int);

  update profiles
    set level = v_new_level,
        updated_at = now()
    where id = p_user_id and level <> v_new_level;
end;
$$ language plpgsql security definer;

-- ─── Indexes ────────────────────────────────────────────────────────────────
create index if not exists idx_workouts_user     on workouts(user_id);
create index if not exists idx_workout_logs_user on workout_logs(user_id);
create index if not exists idx_exercise_logs_wl  on exercise_logs(workout_log_id);
create index if not exists idx_checkins_user     on daily_checkins(user_id, date);
create index if not exists idx_xp_ledger_user    on xp_ledger(user_id);
