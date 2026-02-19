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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { checkin_id, user_id } = await req.json();

        if (!checkin_id || !user_id) {
            throw new Error("Missing checkin_id or user_id");
        }

        // 1. Fetch Logs
        const { data: checkinData, error: checkinError } = await supabaseClient
            .from('daily_checkins')
            .select('*, workout_logs(*), diet_logs(*), recovery_logs(*)')
            .eq('id', checkin_id)
            .single();

        if (checkinError) throw checkinError;

        // 2. Fetch Active Plans
        const { data: workoutPlan } = await supabaseClient
            .from('workout_plans')
            .select('*')
            .eq('user_id', user_id)
            .eq('is_active', true)
            .single();

        // 3. Logic: Compare & Calculate Scores (Simplified for Skeleton)
        // TODO: Implement full deterministic scoring engine here
        const workoutScore = calculateWorkoutScore(checkinData.workout_logs[0], workoutPlan);
        const dietScore = 0.8; // Placeholder
        const recoveryScore = 0.9; // Placeholder

        const totalXP = Math.floor((workoutScore * 100) + (dietScore * 100) + (recoveryScore * 50));

        // 4. Update XP Transactions (Service Role)
        const { error: xpError } = await supabaseClient
            .from('xp_transactions')
            .insert({
                user_id: user_id,
                amount: totalXP,
                source_type: 'Quest', // or specialized type
                source_id: checkin_id,
                running_balance: 0 // specific logic needed for ledger
            });

        if (xpError) throw xpError;

        return new Response(JSON.stringify({
            success: true,
            xp_earned: totalXP,
            breakdown: { workout: workoutScore, diet: dietScore, recovery: recoveryScore }
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

function calculateWorkoutScore(log: any, plan: any): number {
    if (!log || !plan) return 0;
    // Real logic: Compare sets/reps expected vs completed
    // For now return dummy
    return 0.85;
}
