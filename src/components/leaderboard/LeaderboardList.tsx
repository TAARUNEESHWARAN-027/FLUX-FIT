import { GlassCard } from '@/components/ui/GlassCard';
import { Flame, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface User {
    rank: number;
    name: string;
    xp: number;
    avatar: string;
    streak: number;
    change: 'up' | 'down' | 'same';
}

interface LeaderboardListProps {
    users: User[];
}

export function LeaderboardList({ users }: LeaderboardListProps) {
    return (
        <GlassCard className="max-w-4xl mx-auto p-0 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-6 md:col-span-5">Athlete</div>
                <div className="col-span-2 text-center hidden md:block">Streak</div>
                <div className="col-span-3 md:col-span-2 text-right">XP</div>
                <div className="col-span-2 text-center text-[10px] md:text-xs">Trend</div>
            </div>

            <div className="divide-y divide-white/5">
                {users.map((user, index) => (
                    <motion.div
                        key={user.rank}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                    >
                        <div className="col-span-1 text-center font-bold text-gray-500 group-hover:text-white transition-colors">
                            {user.rank}
                        </div>

                        <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-white truncate">{user.name}</span>
                        </div>

                        <div className="col-span-2 text-center hidden md:flex items-center justify-center gap-1 text-orange-500 font-bold">
                            <Flame className="w-4 h-4 fill-orange-500" />
                            {user.streak}
                        </div>

                        <div className="col-span-3 md:col-span-2 text-right font-mono text-neon-cyan font-bold">
                            {user.xp.toLocaleString()}
                        </div>

                        <div className="col-span-2 flex items-center justify-center">
                            {user.change === 'up' && <ArrowUp className="w-4 h-4 text-green-500" />}
                            {user.change === 'down' && <ArrowDown className="w-4 h-4 text-red-500" />}
                            {user.change === 'same' && <Minus className="w-4 h-4 text-gray-600" />}
                        </div>
                    </motion.div>
                ))}
            </div>
        </GlassCard>
    );
}
