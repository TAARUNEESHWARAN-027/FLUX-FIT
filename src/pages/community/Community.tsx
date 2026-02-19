import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Search, Bell, Heart, MessageCircle, Send } from 'lucide-react';
import { useCommunity } from '@/hooks/useCommunity';
import { useProfile } from '@/hooks/useProfile';
import { useState } from 'react';

export default function Community() {
    const { posts, loading, createPost, toggleLike } = useCommunity();
    const { profile } = useProfile();
    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);

    const handlePost = async () => {
        if (!newPostContent.trim()) return;
        setPosting(true);
        await createPost(newPostContent.trim());
        setNewPostContent('');
        setPosting(false);
    };

    const displayInitials = (name: string | null | undefined) => {
        return (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Community <span className="text-neon-pink text-glow">Feed</span></h1>
                        <p className="text-gray-400">Connect, share, and grow together.</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input type="text" placeholder="Search athletes, groups..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-pink/50 transition-colors" />
                        </div>
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl border border-white/10 hover:bg-white/5 relative">
                            <Bell className="w-5 h-5 text-gray-400" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                        </Button>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Feed Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* New Post Input */}
                        <GlassCard className="p-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-cyan to-blue-500 shrink-0 flex items-center justify-center text-xs font-bold">
                                    {displayInitials(profile?.display_name)}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        placeholder="Share your latest achievement..."
                                        className="w-full bg-transparent border-none focus:outline-none text-white placeholder:text-gray-500 resize-none"
                                        rows={2}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <Button
                                            variant="neon"
                                            size="sm"
                                            onClick={handlePost}
                                            disabled={posting || !newPostContent.trim()}
                                            className="gap-2 bg-neon-pink border-neon-pink hover:bg-neon-pink/80 text-white"
                                        >
                                            <Send className="w-4 h-4" /> Post
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Posts Feed */}
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-neon-pink border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : posts.length > 0 ? (
                            posts.map((post) => (
                                <GlassCard key={post.id} className="p-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-violet to-purple-500 shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden">
                                            {post.avatar_url ? (
                                                <img src={post.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                displayInitials(post.display_name)
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-white">{post.display_name}</span>
                                                {post.post_type !== 'general' && (
                                                    <span className="px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs capitalize">{post.post_type}</span>
                                                )}
                                                <span className="text-xs text-gray-500">{timeAgo(post.created_at)}</span>
                                            </div>
                                            <p className="text-gray-300 text-sm leading-relaxed mb-3">{post.content}</p>
                                            <div className="flex gap-6">
                                                <button
                                                    onClick={() => toggleLike(post.id, !!post.liked_by_me)}
                                                    className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked_by_me ? 'text-neon-pink' : 'text-gray-500 hover:text-neon-pink'}`}
                                                >
                                                    <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
                                                    {post.likes_count}
                                                </button>
                                                <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-neon-cyan transition-colors">
                                                    <MessageCircle className="w-4 h-4" />
                                                    {post.comments_count}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <GlassCard className="p-12 text-center">
                                <p className="text-gray-500 text-lg mb-2">No posts yet</p>
                                <p className="text-gray-600 text-sm">Be the first to share your journey!</p>
                            </GlassCard>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <GlassCard>
                            <h3 className="font-bold mb-4 text-white">Your Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Level</span>
                                    <span className="font-bold text-neon-cyan">{profile?.current_level || 1}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Total XP</span>
                                    <span className="font-bold text-neon-violet">{(profile?.current_xp || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Streak</span>
                                    <span className="font-bold text-yellow-400">{profile?.streak_current || 0} days 🔥</span>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="bg-gradient-to-br from-neon-pink/10 to-transparent border-neon-pink/20">
                            <h3 className="font-bold text-white mb-2">Weekly Challenge</h3>
                            <p className="text-sm text-gray-300 mb-4">
                                <strong className="text-neon-pink">100k Steps Challenge.</strong> Join others in hitting 100k steps this week!
                            </p>
                            <Button size="sm" className="w-full bg-neon-pink hover:bg-neon-pink/80 text-white border-0">
                                Join Challenge
                            </Button>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
