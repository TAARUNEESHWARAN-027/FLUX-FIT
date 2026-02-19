import { motion } from 'framer-motion';

interface StreakFlameProps {
    streak: number;
    multiplier: number;
    compact?: boolean;
}

function getFlameColor(streak: number): string {
    if (streak >= 30) return '#FFD700';  // gold
    if (streak >= 14) return '#FF6B00';  // deep orange
    if (streak >= 7) return '#FF4D6A';   // hot pink
    return '#FF8C00';                     // orange
}

export function StreakFlame({ streak, multiplier, compact = false }: StreakFlameProps) {
    const color = getFlameColor(streak);

    if (compact) {
        return (
            <div className="flex items-center gap-1.5">
                <motion.span
                    className="text-base"
                    animate={streak > 0 ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    {streak > 0 ? '🔥' : '💤'}
                </motion.span>
                <div>
                    <span className="font-bold text-sm" style={{ color: streak > 0 ? color : '#6b7280' }}>
                        {streak}
                    </span>
                    {multiplier > 1 && (
                        <span className="text-xs text-neon-teal ml-1">×{multiplier.toFixed(1)}</span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Animated flame */}
            <div className="relative">
                <motion.div
                    className="text-4xl"
                    animate={streak > 0 ? {
                        scale: [1, 1.15, 1],
                        rotate: [0, -3, 3, 0],
                    } : {}}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                >
                    {streak > 0 ? '🔥' : '💤'}
                </motion.div>
                {streak > 0 && (
                    <motion.div
                        className="absolute -inset-2 rounded-full"
                        style={{ background: `radial-gradient(circle, ${color}15 0%, transparent 70%)` }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}
            </div>

            {/* Streak count */}
            <div className="text-center">
                <span className="block text-2xl font-bold" style={{ color: streak > 0 ? color : '#6b7280' }}>
                    {streak}
                </span>
                <span className="text-xs text-gray-400">Day Streak</span>
            </div>

            {/* Multiplier badge */}
            {multiplier > 1 && (
                <motion.div
                    className="px-2 py-0.5 rounded-full bg-neon-teal/10 border border-neon-teal/30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                >
                    <span className="text-xs font-semibold text-neon-teal">
                        ×{multiplier.toFixed(1)} Multiplier
                    </span>
                </motion.div>
            )}
        </div>
    );
}
