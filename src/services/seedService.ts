import { supabase } from '@/lib/supabase';

export const seedService = {
    async seedUserData(userId: string) {
        const today = new Date();
        const logs: any[] = [];
        const recoveryLogs: any[] = [];
        const healthScoreLogs: any[] = [];
        const moodLogs: any[] = [];
        const mealLogs: any[] = [];

        // 0. Clear existing data to prevent conflicts
        await supabase.from('recovery_logs').delete().eq('user_id', userId);
        await supabase.from('health_scores').delete().eq('user_id', userId);
        await supabase.from('mood_journal').delete().eq('user_id', userId);
        await supabase.from('workout_logs').delete().eq('user_id', userId);
        await supabase.from('meal_logs').delete().eq('user_id', userId);
        await supabase.from('user_achievements').delete().eq('user_id', userId);
        await supabase.from('ai_recommendations').delete().eq('user_id', userId);

        // 1. Update Profile (Level 5, ~23k XP, Harini)
        await supabase.from('profiles').update({
            display_name: 'Harini',
            current_level: 5,
            current_xp: 23450,
            streak_current: 12,
            streak_longest: 12,
            fitness_goal: 'muscle_building',
            bio: 'Determined to build strength and consistency!',
            height_cm: 165,
            weight_kg: 60,
        }).eq('id', userId);

        // 2. Generate 30 days of history
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

            // Recovery (Daily)
            const sleep = 6.5 + Math.random() * 2;
            const recoveryScore = Math.floor(60 + Math.random() * 35); // 60-95
            recoveryLogs.push({
                user_id: userId,
                date: dateStr,
                sleep_hours: parseFloat(sleep.toFixed(1)),
                sleep_quality: sleep > 7.5 ? 'Good' : 'Fair',
                resting_heart_rate: 60 + Math.floor(Math.random() * 10),
                hrv: 40 + Math.floor(Math.random() * 40),
                recovery_score: recoveryScore,
                readiness_score: Math.min(100, Math.floor(recoveryScore * 0.9 + sleep * 2)),
                soreness_level: Math.floor(Math.random() * 4) + 1, // 1-5
                stress_level: Math.floor(Math.random() * 3) + 1,   // 1-3
            });

            // Mood (Daily)
            let mood = dayOfWeek === 1 ? 3 : (Math.random() > 0.3 ? 4 : 5);
            if (Math.random() > 0.8) mood = 3;
            moodLogs.push({
                user_id: userId,
                date: dateStr,
                mood_score: mood,
                energy_level: Math.floor(Math.random() * 2) + 3, // 3-5
                tags: mood === 5 ? ['Energetic', 'Focused'] : ['Tired', 'Okay'],
                note: mood === 5 ? 'Great session today!' : 'Feeling a bit slow.',
            });

            // Workouts (4 days/week)
            if ([1, 2, 4, 6].includes(dayOfWeek)) {
                const planName =
                    dayOfWeek === 1 ? 'Leg Day Hypertrophy' :
                        dayOfWeek === 2 ? 'Push Power' :
                            dayOfWeek === 4 ? 'Pull & Core' : 'Full Body Metcon';

                const duration = 45 + Math.floor(Math.random() * 30);

                logs.push({
                    user_id: userId,
                    date: dateStr,
                    duration_minutes: duration,
                    workout_name: planName,
                    calories_burned: duration * 6 + Math.floor(Math.random() * 100),
                    difficulty_rating: 7,
                    notes: 'Felt strong!',
                    xp_earned: 150 + Math.floor(Math.random() * 50),
                });
            }

            // Meals (Random adherence)
            if (Math.random() > 0.2) {
                mealLogs.push({
                    user_id: userId,
                    date: dateStr,
                    meal_type: 'breakfast',
                    name: 'Oats & Berries',
                    calories: 450,
                    protein_g: 20,
                    carbs_g: 60,
                    fats_g: 10,
                });
            }

            // Health Score (Daily)
            const workoutScore = [1, 2, 4, 6].includes(dayOfWeek) ? 100 : 0;
            const ws = 80 + Math.floor(Math.random() * 20);
            const ns = Math.random() > 0.2 ? 90 : 40;
            const ss = Math.min(100, (sleep / 8) * 100);
            const ms = (mood / 5) * 100;
            const rs = recoveryScore;

            const composite = Math.round(
                ws * 0.25 +
                ns * 0.25 +
                ss * 0.20 +
                ms * 0.15 +
                rs * 0.15
            );

            healthScoreLogs.push({
                user_id: userId,
                date: dateStr,
                composite_score: composite,
                workout_score: ws,
                nutrition_score: ns,
                sleep_score: ss,
                mood_score: ms,
                recovery_score: rs,
                breakdown: { workout: ws, nutrition: ns, sleep: ss, mood: ms, recovery: rs, composite }
            });
        }

        // Batch insert
        if (recoveryLogs.length) await supabase.from('recovery_logs').insert(recoveryLogs);
        if (healthScoreLogs.length) await supabase.from('health_scores').insert(healthScoreLogs);
        if (moodLogs.length) await supabase.from('mood_journal').insert(moodLogs);
        if (logs.length) await supabase.from('workout_logs').insert(logs);
        if (mealLogs.length) await supabase.from('meal_logs').insert(mealLogs);

        // 3. Achievements
        const achievements = [
            { code: 'first_workout', unlocked_at: new Date(Date.now() - 30 * 86400000).toISOString() },
            { code: 'week_streak', unlocked_at: new Date(Date.now() - 7 * 86400000).toISOString() },
            { code: 'early_bird', unlocked_at: new Date(Date.now() - 15 * 86400000).toISOString() },
        ];

        for (const ach of achievements) {
            const { data: achDef } = await supabase.from('achievements').select('id').eq('code', ach.code).single();
            if (achDef) {
                await supabase.from('user_achievements').upsert({
                    user_id: userId,
                    achievement_id: achDef.id,
                    unlocked_at: ach.unlocked_at
                }, { onConflict: 'user_id,achievement_id' });
            }
        }

        return { success: true };
    }
};
