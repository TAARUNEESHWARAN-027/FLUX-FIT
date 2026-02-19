import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { useWorkouts } from '@/hooks/useWorkouts';

export function WeeklySchedule() {
    const { weeklyPlans } = useWorkouts();
    const todayIdx = new Date().getDay(); // 0=Sun
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const schedule = dayNames.map((day, i) => {
        const plan = weeklyPlans.find(p => p.day_of_week === i);
        let status: 'completed' | 'current' | 'upcoming' | 'rest' = 'upcoming';
        if (i < todayIdx) status = 'completed';
        if (i === todayIdx) status = 'current';
        if (plan?.is_rest_day) status = 'rest';

        return {
            day,
            workout: plan?.name || 'Rest',
            duration: plan?.estimated_duration_min ? `${plan.estimated_duration_min}m` : undefined,
            status,
        };
    });

    return (
        <div className="space-y-3">
            {schedule.map((item) => (
                <div
                    key={item.day}
                    className={cn(
                        "flex items-center gap-4 p-3 rounded-xl transition-all border",
                        item.status === 'current'
                            ? "bg-neon-cyan/10 border-neon-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                            : "bg-white/5 border-white/5 hover:bg-white/10"
                    )}
                >
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                        item.status === 'current' ? "bg-neon-cyan text-black" : "bg-white/10 text-gray-400"
                    )}>
                        {item.day}
                    </div>

                    <div className="flex-1">
                        <h4 className={cn(
                            "font-medium",
                            item.status === 'current' ? "text-white" : "text-gray-300"
                        )}>
                            {item.workout}
                        </h4>
                        {item.duration && (
                            <span className="text-xs text-gray-500">{item.status === 'current' ? `Est. ${item.duration}` : item.duration}</span>
                        )}
                    </div>

                    <div className="pr-2">
                        {item.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                        {item.status === 'current' && <Circle className="w-5 h-5 text-neon-cyan animate-pulse" />}
                        {item.status === 'upcoming' && <Lock className="w-4 h-4 text-gray-600" />}
                        {item.status === 'rest' && <span className="text-xs text-gray-500 font-medium">REST</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}
