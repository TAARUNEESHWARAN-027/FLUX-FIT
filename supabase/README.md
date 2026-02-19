# Supabase Backend Setup

## 1. Prerequisites
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed.
- Docker running (for local development).

## 2. Initialize & Start
```bash
supabase init
supabase start
```

## 3. Apply Schema
```bash
supabase db reset
```
This will apply `supabase/schema.sql` (Note: move schema.sql to `supabase/migrations` or run manually via SQL Editor in Dashboard).

## 4. Deploy Functions
```bash
supabase functions deploy calculate-xp
supabase functions deploy generate-plan
supabase functions deploy generate-insight
```

## 5. Setting Secrets
Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in your remote project.
```bash
supabase secrets set --env-file .env
```
