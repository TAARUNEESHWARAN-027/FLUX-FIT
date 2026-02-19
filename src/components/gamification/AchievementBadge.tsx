import { motion } from 'framer-motion';
import type { Achievement } from '@/hooks/useGamification';

interface AchievementBadgeProps {
    achievement: Achievement;
    size?: 'sm' | 'md' | 'lg';
}

const rarityColors: Record<string, { bg: string; border: string; glow: string }> = {
    common: { bg: 'bg-gray-700/30', border: 'border-gray-600/30', glow: '' },
    uncommon: { bg: 'bg-green-900/20', border: 'border-green-500/20', glow: '0 0 8px rgba(34,197,94,0.2)' },
    rare: { bg: 'bg-blue-900/20', border: 'border-blue-500/20', glow: '0 0 12px rgba(59,130,246,0.3)' },
    epic: { bg: 'bg-purple-900/20', border: 'border-purple-500/20', glow: '0 0 16px rgba(168,85,247,0.3)' },
    legendary: { bg: 'bg-amber-900/20', border: 'border-amber-400/30', glow: '0 0 20px rgba(251,191,36,0.4)' },
};

const sizeClasses = { sm: 'w-12 h-12 text-lg', md: 'w-16 h-16 text-2xl', lg: 'w-20 h-20 text-3xl' };

export function AchievementBadge({ achievement, size = 'md' }: AchievementBadgeProps) {
    const rarity = rarityColors[achievement.rarity] || rarityColors.common;
    const locked = !achievement.unlocked;

    return (
        <motion.div
            className="flex flex-col items-center gap-1.5 group cursor-default relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            title={`${achievement.title}\n${achievement.description}\n${achievement.rarity.toUpperCase()} • ${achievement.xpReward} XP`}
        >
            <div
                className={`
                    ${sizeClasses[size]} rounded-xl flex items-center justify-center
                    border ${rarity.border} ${rarity.bg}
                    transition-all duration-300
                    ${locked ? 'opacity-30 grayscale' : ''}
                `}
                style={{ boxShadow: locked ? undefined : rarity.glow }}
            >
                <span className={locked ? 'blur-[1px]' : ''}>{achievement.icon}</span>
            </div>
            {size !== 'sm' && (
                <span className={`text-xs text-center max-w-[80px] truncate ${locked ? 'text-gray-600' : 'text-gray-400'}`}>
                    {achievement.title}
                </span>
            )}

            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 pointer-events-none">
                <div className="bg-gray-900/95 backdrop-blur border border-white/10 rounded-lg p-3 shadow-xl min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1">
                        <span>{achievement.icon}</span>
                        <span className="font-bold text-white text-sm">{achievement.title}</span>
                    </div>
                    <p className="text-gray-400 text-xs mb-2">{achievement.description}</p>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500 capitalize">{achievement.rarity}</span>
                        <span className="text-neon-teal">{achievement.xpReward} XP</span>
                    </div>
                    {locked && <p className="text-gray-600 text-xs mt-1 italic">🔒 Locked</p>}
                </div>
            </div>
        </motion.div>
    );
}
