import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Utensils, ScanBarcode, ChevronLeft, ChevronRight } from 'lucide-react';
import { MacroRing } from '@/components/nutrition/MacroRing';
import { MealSection } from '@/components/nutrition/MealSection';
import { WaterTracker } from '@/components/nutrition/WaterTracker';
import { useNutrition } from '@/hooks/useNutrition';
import { useState } from 'react';

export default function Nutrition() {
    const [dateOffset, setDateOffset] = useState(0);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dateOffset);
    const dateStr = targetDate.toISOString().split('T')[0];
    const dateLabel = dateOffset === 0 ? 'Today' : targetDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

    const { targets, meals, consumed, loading } = useNutrition(dateStr);

    const dailyTarget = {
        calories: targets.calories,
        protein: targets.protein_g,
        carbs: targets.carbs_g,
        fat: targets.fat_g,
        fiber: targets.fiber_g,
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-8 h-8 border-4 border-neon-violet border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Nutrition <span className="text-neon-violet text-glow">Tracker</span></h1>
                        <p className="text-gray-400">Fuel your body, fuel your performance.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-1 pr-4 rounded-xl border border-white/5">
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-gray-400 hover:text-white" onClick={() => setDateOffset(d => d - 1)}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="text-center">
                            <span className="block text-sm font-bold text-white">{dateLabel}</span>
                            <span className="block text-xs text-gray-500">{targetDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-gray-400 hover:text-white" onClick={() => setDateOffset(d => Math.min(d + 1, 0))}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Meal Logs */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Meal Log</h2>
                            <Button variant="neon" className="gap-2">
                                <ScanBarcode className="w-4 h-4" /> Scan Food
                            </Button>
                        </div>

                        <MealSection title="Breakfast" meals={meals.breakfast.map(m => ({ name: m.name, calories: m.calories, protein: m.protein_g, carbs: m.carbs_g, fat: m.fat_g }))} recommendedCalories={Math.round(dailyTarget.calories * 0.3)} />
                        <MealSection title="Lunch" meals={meals.lunch.map(m => ({ name: m.name, calories: m.calories, protein: m.protein_g, carbs: m.carbs_g, fat: m.fat_g }))} recommendedCalories={Math.round(dailyTarget.calories * 0.35)} />
                        <MealSection title="Dinner" meals={meals.dinner.map(m => ({ name: m.name, calories: m.calories, protein: m.protein_g, carbs: m.carbs_g, fat: m.fat_g }))} recommendedCalories={Math.round(dailyTarget.calories * 0.25)} />
                        <MealSection title="Snacks" meals={meals.snacks.map(m => ({ name: m.name, calories: m.calories, protein: m.protein_g, carbs: m.carbs_g, fat: m.fat_g }))} recommendedCalories={Math.round(dailyTarget.calories * 0.1)} />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <WaterTracker />

                        <GlassCard className="bg-gradient-to-br from-neon-violet/10 to-transparent border-neon-violet/20">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-neon-violet/20 rounded-lg text-neon-violet mt-1">
                                    <Utensils className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-2">Diet Insights</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                                        {consumed.calories === 0
                                            ? "No meals logged yet today. Start by adding your breakfast!"
                                            : consumed.protein >= dailyTarget.protein * 0.7
                                                ? "Great protein intake! Keep it up and focus on hitting your remaining macros."
                                                : `You've consumed ${consumed.protein}g of ${dailyTarget.protein}g protein. Try adding a high-protein meal next.`
                                        }
                                    </p>
                                    <Button variant="secondary" size="sm" className="w-full">
                                        View Suggestions
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* Macro Overview */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">Daily Summary</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Calories Main Card */}
                        <GlassCard className="lg:col-span-1 flex flex-col justify-center items-center text-center py-8 border-neon-violet/20">
                            <h3 className="text-gray-400 font-medium mb-4">Calories Remaining</h3>
                            <div className="relative mb-4">
                                <svg className="w-40 h-40 rotate-[-90deg]">
                                    <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="transparent" />
                                    <circle cx="80" cy="80" r="70" stroke="#8F00FF" strokeWidth="12" fill="transparent"
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (consumed.calories / dailyTarget.calories) * 440}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col justify-center items-center">
                                    <span className="text-4xl font-bold text-white">{Math.max(0, dailyTarget.calories - consumed.calories)}</span>
                                    <span className="text-xs text-gray-400">Kcal Left</span>
                                </div>
                            </div>
                            <div className="flex justify-between w-full px-4 text-sm">
                                <div className="text-left">
                                    <span className="block text-gray-500 text-xs">Consumed</span>
                                    <span className="font-bold text-white">{consumed.calories}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-gray-500 text-xs">Target</span>
                                    <span className="font-bold text-gray-300">{dailyTarget.calories}</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Macros */}
                        <GlassCard className="lg:col-span-3 flex items-center justify-around py-8">
                            <MacroRing label="Protein" current={consumed.protein} target={dailyTarget.protein} color="#8F00FF" />
                            <MacroRing label="Carbs" current={consumed.carbs} target={dailyTarget.carbs} color="#00F0FF" />
                            <MacroRing label="Fats" current={consumed.fat} target={dailyTarget.fat} color="#00FF9D" />
                            <MacroRing label="Fiber" current={consumed.fiber} target={dailyTarget.fiber} color="#ff00e6" />
                        </GlassCard>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
