
// supabase/functions/checkin-processor/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Initialize Supabase (Service Role)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 2. Parse Payload
        const payload = await req.json();
        const { user_id, date, workout, diet, recovery, notes } = payload;

        if (!user_id || !date) throw new Error("Missing critical check-in data");

        // 3. Insert Check-in & Logs (Atomic or Sequential)
        // Note: In real prod, wrap in RPC transaction if possible, or careful order.
        // Here we insert Checkin first.
        const { data: checkin, error: checkinError } = await supabaseClient
            .from('daily_checkins')
            .insert({ user_id, date, notes, status: 'PROCESSED' })
            .select()
            .single();

        if (checkinError) {
            // Idempotency: If duplicate key error, maybe we just update or return existing?
            if (checkinError.code === '23505') { // Unique violation
                return new Response(JSON.stringify({ error: "Check-in already exists for this date." }), { status: 409, headers: corsHeaders });
            }
            throw checkinError;
        }

        // 4. Calculate Scores (Deterministic Engine)
        // Fetch weights
        const { data: config } = await supabaseClient.from('scoring_config').select('*').single();
        const WEIGHTS = config || { workout_weight: 100, diet_weight: 50, recovery_weight: 30 };

        let totalXP = 0;

        // Workout Logic
        if (workout && workout.completed) {
            // Calculate based on adherence to plan
            const score = Math.min(workout.adherence || 0, 1.0);
            totalXP += Math.floor(score * WEIGHTS.workout_weight);

            await supabaseClient.from('workout_logs').insert({
                checkin_id: checkin.id,
                user_id,
                ...workout
            });
        }

        // Diet Logic
        if (diet) {
            const score = Math.min(diet.adherence || 0, 1.0);
            totalXP += Math.floor(score * WEIGHTS.diet_weight);
            await supabaseClient.from('diet_logs').insert({
                checkin_id: checkin.id,
                user_id,
                ...diet
            });
        }

        // Recovery Logic
        if (recovery) {
            // Simple fixed bonus for now
            totalXP += Math.floor(WEIGHTS.recovery_weight);
            await supabaseClient.from('recovery_logs').insert({
                checkin_id: checkin.id,
                user_id,
                ...recovery
            });
        }

        // 5. Commit XP Transaction (Stored Procedure)
        // This handles Anti-Cheating, Ledger Insertion, and Profile Updates atomically
        const { data: txResult, error: txError } = await supabaseClient
            .rpc('commit_xp_transaction', {
                p_user_id: user_id,
                p_amount: totalXP,
                p_source_type: 'WORKOUT_LOG', // Simplification: aggregating all into one txn source or loop
                p_reference_id: checkin.id,
                p_metadata: { weights: WEIGHTS, date: date }
            });

        if (txError) throw txError;

        // 6. Refresh Leaderboard (Async/Fire-and-forget)
        // supabaseClient.rpc('refresh_leaderboard'); 

        return new Response(JSON.stringify({
            success: true,
            xp_earned: totalXP,
            new_state: txResult
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
