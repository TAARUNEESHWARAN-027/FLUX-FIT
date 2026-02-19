
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock LLM Call
async function interpretData(logs: any[], streak: number, apiKey: string) {
    // This would be the "Coach" persona analyzing the data
    return {
        summary: "Solid consistency this week! You hit 5/7 workouts.",
        achievements: ["Perfect Diet Streak (3 days)", "Squat PR"],
        recommendations: ["Increase water intake", "Prioritize sleep on leg days"],
        flags: []
    };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { user_id, start_date, end_date } = await req.json();
        if (!user_id) throw new Error("Missing user_id");

        // 1. Fetch Weekly Logs
        const { data: logs } = await supabaseClient
            .from('checkin_logs') // or join daily_checkins
            .select(`
            *,
            workout_logs(*),
            diet_logs(*),
            recovery_logs(*)
        `)
            .eq('user_id', user_id)
            .gte('date', start_date)
            .lte('date', end_date);

        // 2. Fetch Profile for context
        const { data: profile } = await supabaseClient.from('profiles').select('streak_current').eq('id', user_id).single();

        // 3. Generate Insight (AI)
        const openAiKey = Deno.env.get('OPENAI_API_KEY') || 'mock';
        const insights = await interpretData(logs || [], profile?.streak_current || 0, openAiKey);

        // 4. Save Report
        const { error } = await supabaseClient.from('ai_insight_reports').insert({
            user_id,
            week_start: start_date,
            summary_text: insights.summary,
            key_achievements: insights.achievements,
            recommendations: insights.recommendations
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, insights }), {
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
