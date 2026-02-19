import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { Battery } from 'lucide-react';
import { useRecovery } from '@/hooks/useRecovery';

export function CoreReadiness() {
    const { recoveryLog } = useRecovery();
    const score = recoveryLog?.readiness_score ?? 75;

    const getStatusColor = (s: number) => {
        if (s >= 80) return "text-green-400";
        if (s >= 60) return "text-yellow-400";
        return "text-red-400";
    };

    const getMessage = (s: number) => {
        if (s >= 80) return "Your nervous system is primed. Great day for a heavy session.";
        if (s >= 60) return "Moderate readiness. Stick to moderate intensity today.";
        return "Low readiness. Consider active recovery or a lighter session.";
    };

    return (
        <GlassCard className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20 text-center py-8">
            <div className="flex flex-col items-center">
                <div className={cn("mb-2 p-2 rounded-full", score >= 80 ? "text-green-400 bg-green-500/10" : score >= 60 ? "text-yellow-400 bg-yellow-500/10" : "text-red-400 bg-red-500/10")}>
                    <Battery className="w-6 h-6" />
                </div>
                <h3 className="text-gray-400 font-medium mb-1">Readiness Score</h3>
                <h2 className={cn("text-6xl font-bold mb-2 text-glow", getStatusColor(score))}>
                    {score}%
                </h2>
                <div className="text-sm text-gray-400 max-w-xs mx-auto">
                    {getMessage(score)}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-sm">
                    <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Sleep</div>
                        <div className="font-bold text-white">{recoveryLog?.sleep_hours ?? '—'}h</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Soreness</div>
                        <div className="font-bold text-white">{recoveryLog?.soreness_level ?? '—'}/10</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Stress</div>
                        <div className="font-bold text-white">{recoveryLog?.stress_level ?? '—'}/10</div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
