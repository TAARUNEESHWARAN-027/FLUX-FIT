import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthProvider';

export interface NutritionTarget {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    water_glasses: number;
}

export interface MealEntry {
    id?: string;
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    meal_type: string;
}

export interface MealsByType {
    breakfast: MealEntry[];
    lunch: MealEntry[];
    dinner: MealEntry[];
    snacks: MealEntry[];
}

export interface ConsumedTotals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

const DEFAULT_TARGETS: NutritionTarget = {
    calories: 2500, protein_g: 180, carbs_g: 280, fat_g: 70, fiber_g: 30, water_glasses: 8,
};

export function useNutrition(date?: string) {
    const { user } = useAuthContext();
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [targets, setTargets] = useState<NutritionTarget>(DEFAULT_TARGETS);
    const [meals, setMeals] = useState<MealsByType>({ breakfast: [], lunch: [], dinner: [], snacks: [] });
    const [consumed, setConsumed] = useState<ConsumedTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    const [waterGlasses, setWaterGlasses] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);

        try {
            // Fetch targets
            const { data: t, error: tErr } = await supabase
                .from('nutrition_targets')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!tErr && t) setTargets(t as NutritionTarget);
        } catch {
            console.warn('useNutrition: targets query failed, using defaults.');
        }

        try {
            // Fetch meals for date
            const { data: mealData } = await supabase
                .from('meal_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', targetDate);

            if (mealData) {
                const grouped: MealsByType = { breakfast: [], lunch: [], dinner: [], snacks: [] };
                let cal = 0, pro = 0, carb = 0, fat = 0;

                for (const m of mealData) {
                    const entry = m as MealEntry;
                    const type = entry.meal_type as keyof MealsByType;
                    if (grouped[type]) grouped[type].push(entry);
                    cal += entry.calories;
                    pro += entry.protein_g;
                    carb += entry.carbs_g;
                    fat += entry.fat_g;
                }

                setMeals(grouped);
                setConsumed({ calories: cal, protein: pro, carbs: carb, fat, fiber: 0 });
            }
        } catch {
            console.warn('useNutrition: meals query failed.');
        }

        try {
            // Fetch water
            const { data: w } = await supabase
                .from('water_logs')
                .select('glasses')
                .eq('user_id', user.id)
                .eq('date', targetDate)
                .single();

            if (w) setWaterGlasses(w.glasses);
            else setWaterGlasses(0);
        } catch {
            console.warn('useNutrition: water query failed.');
        }

        setLoading(false);
    }, [user, targetDate]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const logMeal = useCallback(async (meal: Omit<MealEntry, 'id'>) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('meal_logs')
                .insert({ ...meal, user_id: user.id, date: targetDate });
            if (!error) fetchAll();
            return { error };
        } catch (err) {
            console.warn('logMeal failed:', err);
            return { error: { message: String(err) } };
        }
    }, [user, targetDate, fetchAll]);

    const logWater = useCallback(async (glasses: number) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('water_logs')
                .upsert({ user_id: user.id, date: targetDate, glasses, updated_at: new Date().toISOString() },
                    { onConflict: 'user_id,date' });
            if (!error) setWaterGlasses(glasses);
            return { error };
        } catch (err) {
            console.warn('logWater failed:', err);
            return { error: { message: String(err) } };
        }
    }, [user, targetDate]);

    return { targets, meals, consumed, waterGlasses, loading, logMeal, logWater, refetch: fetchAll };
}
