import { GlassCard } from '@/components/ui/GlassCard';
import { Plus, Minus, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useNutrition } from '@/hooks/useNutrition';

export function WaterTracker() {
    const { waterGlasses, targets, logWater } = useNutrition();
    const target = targets.water_glasses || 8;

    const increment = () => logWater(Math.min(target, waterGlasses + 1));
    const decrement = () => logWater(Math.max(0, waterGlasses - 1));

    return (
        <GlassCard className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <Droplets className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-white">Hydration</h3>
                    <p className="text-xs text-gray-400">Daily Goal: {target * 250}ml</p>
                </div>
            </div>

            <div className="flex justify-between items-end mb-4">
                <span className="text-4xl font-bold text-blue-400">{waterGlasses * 250} <span className="text-sm text-gray-500">ml</span></span>
                <span className="text-sm text-gray-400">{waterGlasses} / {target} glasses</span>
            </div>

            {/* Visual Glasses */}
            <div className="flex gap-1 h-12 mb-6">
                {Array.from({ length: target }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex-1 rounded-sm transition-all duration-300 relative overflow-hidden",
                            i < waterGlasses ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-white/5"
                        )}
                    />
                ))}
            </div>

            <div className="flex gap-4">
                <Button
                    variant="ghost"
                    className="flex-1 border border-white/10 hover:bg-white/5"
                    onClick={decrement}
                >
                    <Minus className="w-4 h-4" />
                </Button>
                <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                    onClick={increment}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
        </GlassCard>
    );
}
