
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock LLM Call (Replace with actual fetch to OpenAI/Anthropic)
async function callLLM(systemPrompt: string, userPrompt: string, apiKey: string) {
    console.log("Mocking LLM Call with prompt:", userPrompt.substring(0, 50) + "...");

    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return dummy structure matching the schema
    return {
        workout_plan: {
            "monday": {
                focus: "Push (Chest/Triceps)",
                exercises: [
                    { name: "Bench Press", sets: 3, reps: "8-12", rpe: 8 },
                    { name: "Overhead Press", sets: 3, reps: "10", rpe: 8 }
                ]
            },
            "tuesday": { focus: "Pull (Back/Biceps)", exercises: [] },
            "wednesday": { focus: "Legs", exercises: [] },
            "thursday": { focus: "Rest", exercises: [] },
            "friday": { focus: "Full Body", exercises: [] },
            "saturday": { focus: "Active Recovery", exercises: [] },
            "sunday": { focus: "Rest", exercises: [] }
        },
        diet_plan: {
            calories: 2500,
            macros: { protein: 180, carbs: 250, fats: 80 },
            meal_structure: {
                breakfast: "Oats + Whey",
                lunch: "Chicken + Rice",
                dinner: "Salmon + Asparagus"
            }
        }
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

        // 1. Get User Context
        const { user_id } = await req.json();
        if (!user_id) throw new Error("Missing user_id");

        // 2. Fetch User Profile & Goals
        const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user_id).single();
        const { data: goals } = await supabaseClient.from('fitness_goals').select('*').eq('user_id', user_id).single();

        if (!profile) throw new Error("Profile not found");

        // 3. Construct Prompt
        const systemPrompt = "You are an elite fitness coach AI. Generate a structured JSON workout and diet plan.";
        const userPrompt = `
        User: ${profile.display_name}
        Goal: ${goals?.primary_goal || 'General Fitness'}
        Experience: Intermediate
        Constraints: None
        
        Output valid JSON with 'workout_plan' and 'diet_plan' keys.
    `;

        // 4. Generate Plan (AI)
        const openAiKey = Deno.env.get('OPENAI_API_KEY') || 'mock-key';
        const planData = await callLLM(systemPrompt, userPrompt, openAiKey);

        // 5. Save to Database (Versioned)
        // Deactivate old plans
        await supabaseClient.from('workout_plans').update({ is_active: false }).eq('user_id', user_id);
        await supabaseClient.from('diet_plans').update({ is_active: false }).eq('user_id', user_id);

        // Insert new
        const { error: wError } = await supabaseClient.from('workout_plans').insert({
            user_id,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
            structure: planData.workout_plan,
            is_active: true
        });

        if (wError) throw wError;

        const { error: dError } = await supabaseClient.from('diet_plans').insert({
            user_id,
            daily_calorie_target: planData.diet_plan.calories,
            macro_split: planData.diet_plan.macros,
            meal_structure: planData.diet_plan.meal_structure,
            is_active: true
        });

        if (dError) throw dError;

        // Log Generation
        await supabaseClient.from('ai_plan_generations').insert({
            user_id,
            prompt_context: { goal: goals?.primary_goal },
            generated_json: planData,
            model_used: 'gpt-4o-mock',
            tokens_used: 100 // dummy
        });

        return new Response(JSON.stringify({ success: true, plan: planData }), {
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
