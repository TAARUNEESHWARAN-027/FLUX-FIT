import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Post {
    id: string;
    user: {
        name: string;
        avatar: string;
        time: string;
    };
    type: 'workout' | 'pr' | 'milestone';
    content: string;
    stats?: {
        label: string;
        value: string;
    }[];
    likes: number;
    comments: number;
}

const posts: Post[] = [
    {
        id: '1',
        user: { name: 'Sarah Connor', avatar: 'https://i.pravatar.cc/150?u=1', time: '2 hours ago' },
        type: 'pr',
        content: 'Finally broke the 100kg barrier on squats! 🏋️‍♀️ Setup felt cleaner than ever.',
        stats: [
            { label: 'Exercise', value: 'Back Squat' },
            { label: 'Weight', value: '100 kg' },
            { label: 'Reps', value: '3' },
        ],
        likes: 24,
        comments: 5
    },
    {
        id: '2',
        user: { name: 'Marcus Fenix', avatar: 'https://i.pravatar.cc/150?u=3', time: '5 hours ago' },
        type: 'workout',
        content: 'Crushed the "Gears of War" HIIT session. My lungs are burning but feeling alive.',
        stats: [
            { label: 'Duration', value: '45 min' },
            { label: 'Avg HR', value: '165 bpm' },
            { label: 'Calories', value: '620' },
        ],
        likes: 18,
        comments: 2
    }
];

export function ActivityFeed() {
    return (
        <div className="space-y-6">
            {posts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
            ))}
        </div>
    );
}

function PostCard({ post, index }: { post: Post; index: number }) {
    const [liked, setLiked] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <GlassCard className="p-0 overflow-hidden">
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                            <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="font-bold text-white text-sm">{post.user.name}</div>
                            <div className="text-xs text-gray-500">{post.user.time}</div>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="px-4 pb-4">
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">{post.content}</p>

                    {post.stats && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {post.stats.map((stat) => (
                                <div key={stat.label} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</div>
                                    <div className="text-sm font-bold text-neon-cyan">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-white/5 border-t border-white/5 flex items-center gap-6">
                    <button
                        onClick={() => setLiked(!liked)}
                        className={cn("flex items-center gap-2 text-sm transition-colors", liked ? "text-pink-500" : "text-gray-400 hover:text-white")}
                    >
                        <Heart className={cn("w-4 h-4", liked && "fill-pink-500")} />
                        {post.likes + (liked ? 1 : 0)}
                    </button>
                    <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments}
                    </button>
                    <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors ml-auto">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </GlassCard>
        </motion.div>
    );
}
