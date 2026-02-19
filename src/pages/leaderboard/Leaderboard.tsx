import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Podium } from '@/components/leaderboard/Podium';
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList';
import { Users, Globe, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuthContext } from '@/context/AuthProvider';

export default function Leaderboard() {
    const [timeframe, setTimeframe] = useState<'weekly' | 'allTime'>('weekly');
    const { entries, loading } = useLeaderboard();
    const { user } = useAuthContext();

    // Transform entries to the format expected by Podium and LeaderboardList
    const transformedUsers = entries.map((e, _i) => ({
        rank: Number(e.rank),
        name: e.display_name || e.username || 'Anonymous',
        xp: Number(e.current_xp),
        streak: e.streak_current,
        avatar: e.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${e.display_name || 'U'}`,
        change: 'same' as const,
        isCurrentUser: user?.id === e.user_id,
    }));

    const topThree = transformedUsers.slice(0, 3);
    const rest = transformedUsers.slice(3);

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold mb-2">Global <span className="text-yellow-400 text-glow">Rankings</span></h1>
                        <p className="text-gray-400">Compete with the best. Rise to the top.</p>
                    </div>

                    <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setTimeframe('weekly')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeframe === 'weekly' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => setTimeframe('allTime')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeframe === 'allTime' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            All Time
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Podium */}
                        <div className="py-8">
                            <Podium topThree={topThree} />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 max-w-4xl mx-auto overflow-x-auto pb-2">
                            <Button size="sm" variant="neon" className="rounded-full">
                                <Globe className="w-4 h-4 mr-2" /> Global
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-full bg-white/5 border border-white/5 hover:bg-white/10">
                                <Users className="w-4 h-4 mr-2" /> Friends
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-full bg-white/5 border border-white/5 hover:bg-white/10">
                                <UserCircle2 className="w-4 h-4 mr-2" /> Regional
                            </Button>
                        </div>

                        {/* List */}
                        {rest.length > 0 ? (
                            <LeaderboardList users={rest} />
                        ) : topThree.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg mb-2">No users yet</p>
                                <p className="text-sm">Be the first to claim the top spot!</p>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
