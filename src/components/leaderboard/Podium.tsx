import { Crown, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface User {
    rank: number;
    name: string;
    xp: number;
    avatar: string;
    streak: number;
}

interface PodiumProps {
    topThree: User[];
}

export function Podium({ topThree }: PodiumProps) {
    const [first, second, third] = [topThree.find(u => u.rank === 1), topThree.find(u => u.rank === 2), topThree.find(u => u.rank === 3)];

    return (
        <div className="flex justify-center items-end gap-4 md:gap-8 mb-12 min-h-[300px]">
            {/* Second Place */}
            {second && (
                <div className="flex flex-col items-center group">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative"
                    >
                        <div className="w-20 h-20 rounded-full border-4 border-gray-300 overflow-hidden mb-4 shadow-[0_0_20px_rgba(209,213,219,0.3)]">
                            <img src={second.avatar} alt={second.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-black text-xs font-bold px-2 py-0.5 rounded-full border-2 border-zinc-900">
                            2
                        </div>
                    </motion.div>

                    <div className="text-center mb-2">
                        <div className="font-bold text-white mt-4">{second.name}</div>
                        <div className="text-sm text-gray-400">{second.xp.toLocaleString()} XP</div>
                    </div>

                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 120 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-24 bg-gradient-to-t from-gray-500/20 to-gray-400/10 rounded-t-lg border-x border-t border-gray-500/30 backdrop-blur-sm relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gray-400/5 group-hover:bg-gray-400/10 transition-colors" />
                    </motion.div>
                </div>
            )}

            {/* First Place */}
            {first && (
                <div className="flex flex-col items-center z-10 group">
                    <div className="mb-2">
                        <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-bounce" />
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative"
                    >
                        <div className="w-28 h-28 rounded-full border-4 border-yellow-400 overflow-hidden mb-4 shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                            <img src={first.avatar} alt={first.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-sm font-bold px-3 py-1 rounded-full border-2 border-zinc-900">
                            1
                        </div>
                    </motion.div>

                    <div className="text-center mb-2">
                        <div className="font-bold text-xl text-white mt-4">{first.name}</div>
                        <div className="text-sm text-yellow-400 font-bold">{first.xp.toLocaleString()} XP</div>
                    </div>

                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 160 }}
                        transition={{ duration: 0.5 }}
                        className="w-32 bg-gradient-to-t from-yellow-500/20 to-yellow-400/10 rounded-t-lg border-x border-t border-yellow-500/30 backdrop-blur-sm relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-yellow-400/5 group-hover:bg-yellow-400/10 transition-colors" />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                            <Trophy className="w-12 h-12 text-yellow-400/20" />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Third Place */}
            {third && (
                <div className="flex flex-col items-center group">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative"
                    >
                        <div className="w-20 h-20 rounded-full border-4 border-amber-600 overflow-hidden mb-4 shadow-[0_0_20px_rgba(217,119,6,0.3)]">
                            <img src={third.avatar} alt={third.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-black text-xs font-bold px-2 py-0.5 rounded-full border-2 border-zinc-900">
                            3
                        </div>
                    </motion.div>

                    <div className="text-center mb-2">
                        <div className="font-bold text-white mt-4">{third.name}</div>
                        <div className="text-sm text-gray-400">{third.xp.toLocaleString()} XP</div>
                    </div>

                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 90 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="w-24 bg-gradient-to-t from-amber-700/20 to-amber-600/10 rounded-t-lg border-x border-t border-amber-600/30 backdrop-blur-sm relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-amber-600/5 group-hover:bg-amber-600/10 transition-colors" />
                    </motion.div>
                </div>
            )}
        </div>
    );
}
