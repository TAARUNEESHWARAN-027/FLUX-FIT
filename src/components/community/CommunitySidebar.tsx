import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Users, Target, ArrowRight } from 'lucide-react';

export function CommunityGroups() {
    const groups = [
        { name: "Morning Crew ☀️", members: 1240, active: true },
        { name: "Powerlifters Unite", members: 850, active: false },
        { name: "Keto Warriors", members: 2300, active: true },
    ];

    return (
        <GlassCard>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-neon-violet" />
                    Your Groups
                </h3>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-neon-violet">See All</Button>
            </div>

            <div className="space-y-3">
                {groups.map((group) => (
                    <div key={group.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-lg font-bold">
                                {group.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-medium text-sm text-white group-hover:text-neon-violet transition-colors">{group.name}</div>
                                <div className="text-xs text-gray-500">{group.members.toLocaleString()} members</div>
                            </div>
                        </div>
                        {group.active && (
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                        )}
                    </div>
                ))}
            </div>

            <Button className="w-full mt-4" variant="secondary">
                <Target className="w-4 h-4 mr-2" /> Find Challenges
            </Button>
        </GlassCard>
    );
}

export function SuggestedFriends() {
    const friends = [
        { name: "Elena Fisher", mutual: 3, avatar: "https://i.pravatar.cc/150?u=4" },
        { name: "Nathan Drake", mutual: 12, avatar: "https://i.pravatar.cc/150?u=5" },
    ];

    return (
        <GlassCard>
            <h3 className="font-bold text-white mb-4">Suggested for you</h3>
            <div className="space-y-4">
                {friends.map((friend) => (
                    <div key={friend.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                                <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-white">{friend.name}</div>
                                <div className="text-xs text-gray-500">{friend.mutual} mutual friends</div>
                            </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full border border-white/20 hover:bg-neon-cyan/20 hover:border-neon-cyan/50 hover:text-neon-cyan">
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
}
