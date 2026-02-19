import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MuscleGroup {
    name: string;
    status: 'fresh' | 'recovering' | 'exhausted';
    lastTrained: string;
}

const muscles: MuscleGroup[] = [
    { name: 'Chest', status: 'exhausted', lastTrained: 'Yesterday' },
    { name: 'Back', status: 'fresh', lastTrained: '3 days ago' },
    { name: 'Legs', status: 'fresh', lastTrained: '4 days ago' },
    { name: 'Shoulders', status: 'recovering', lastTrained: 'Yesterday' },
    { name: 'Arms', status: 'recovering', lastTrained: 'Yesterday' },
    { name: 'Core', status: 'fresh', lastTrained: '2 days ago' },
];

export function MuscleStatus() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {muscles.map((muscle) => (
                <div key={muscle.name} className="relative group">
                    <div className={cn(
                        "p-4 rounded-xl border transition-all duration-300",
                        muscle.status === 'fresh' && "bg-green-500/10 border-green-500/20 text-green-400",
                        muscle.status === 'recovering' && "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
                        muscle.status === 'exhausted' && "bg-red-500/10 border-red-500/20 text-red-400"
                    )}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold">{muscle.name}</span>
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                muscle.status === 'fresh' && "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
                                muscle.status === 'recovering' && "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]",
                                muscle.status === 'exhausted' && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                            )} />
                        </div>
                        <div className="text-xs opacity-70">
                            {muscle.lastTrained}
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: muscle.status === 'fresh' ? '100%' : muscle.status === 'recovering' ? '50%' : '10%' }}
                                className={cn(
                                    "h-full rounded-full",
                                    muscle.status === 'fresh' && "bg-green-500",
                                    muscle.status === 'recovering' && "bg-yellow-500",
                                    muscle.status === 'exhausted' && "bg-red-500"
                                )}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
