import { GlassCard } from '@/components/ui/GlassCard';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Meal {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

interface MealSectionProps {
    title: string;
    meals: Meal[];
    recommendedCalories: number;
}

export function MealSection({ title, meals, recommendedCalories }: MealSectionProps) {
    const totalCalories = meals.reduce((acc, meal) => acc + meal.calories, 0);

    return (
        <GlassCard className="space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-3 -mx-6 -mt-6 border-b border-white/5">
                <div>
                    <h3 className="font-bold text-white text-lg">{title}</h3>
                    <p className="text-xs text-gray-400">
                        {totalCalories} / {recommendedCalories} kcal
                    </p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full bg-white/5 hover:bg-neon-cyan/20 hover:text-neon-cyan">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-1">
                {meals.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm italic">
                        No food logged yet
                    </div>
                ) : (
                    meals.map((meal, index) => (
                        <div key={index} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors group">
                            <div>
                                <div className="font-medium text-white">{meal.name}</div>
                                <div className="text-xs text-gray-500 flex gap-2">
                                    <span>{meal.calories} kcal</span>
                                    <span>•</span>
                                    <span className="text-neon-violet">{meal.protein}g P</span>
                                    <span className="text-neon-cyan">{meal.carbs}g C</span>
                                    <span className="text-neon-teal">{meal.fat}g F</span>
                                </div>
                            </div>
                            <button className="text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    );
}
