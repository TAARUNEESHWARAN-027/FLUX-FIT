import { motion } from 'framer-motion';
import type { LevelInfo } from '@/hooks/useGamification';

interface LevelProgressProps {
    level: LevelInfo;
    compact?: boolean;
}

function getLevelColor(level: number): string {
    if (level >= 15) return '#FFD700';   // gold
    if (level >= 10) return '#00FF9D';   // teal
    if (level >= 5) return '#8F00FF';    // violet
    return '#00F0FF';                     // cyan
}

export function LevelProgress({ level, compact = false }: LevelProgressProps) {
    const color = getLevelColor(level.level);
    const xpInLevel = level.currentXp - level.xpForCurrentLevel;
    const xpNeeded = level.xpForNextLevel - level.xpForCurrentLevel;

    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2"
                    style={{ borderColor: color, color, boxShadow: `0 0 12px ${color}30` }}
                >
                    {level.level}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-medium text-gray-400">{level.title}</span>
                        <span className="text-xs text-gray-500">
                            {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${level.progressPct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Level badge */}
            <div className="relative">
                <motion.div
                    className="w-24 h-24 rounded-full flex items-center justify-center relative"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                >
                    <svg className="w-full h-full absolute top-0 left-0 -rotate-90">
                        <circle
                            cx={48} cy={48} r={42}
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth={4} fill="transparent"
                        />
                        <motion.circle
                            cx={48} cy={48} r={42}
                            stroke={color}
                            strokeWidth={4} fill="transparent"
                            strokeLinecap="round"
                            strokeDasharray={264}
                            initial={{ strokeDashoffset: 264 }}
                            animate={{ strokeDashoffset: 264 - (level.progressPct / 100) * 264 }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                            style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}
                        />
                    </svg>
                    <div className="text-center z-10">
                        <span className="block text-2xl font-bold" style={{ color }}>
                            {level.level}
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Title */}
            <div className="text-center">
                <p className="font-bold text-white">{level.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                    {level.currentXp.toLocaleString()} XP Total
                </p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-[200px]">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Lvl {level.level}</span>
                    <span>Lvl {level.level + 1}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${level.progressPct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>
                <p className="text-center text-xs text-gray-500 mt-1">
                    {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
                </p>
            </div>
        </div>
    );
}
