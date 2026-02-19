import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthProvider';

export interface CommunityPost {
    id: string;
    user_id: string;
    content: string;
    post_type: string;
    metadata: Record<string, unknown>;
    likes_count: number;
    comments_count: number;
    created_at: string;
    // Joined fields
    display_name?: string;
    avatar_url?: string;
    username?: string;
    liked_by_me?: boolean;
}

export interface PostComment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    display_name?: string;
    avatar_url?: string;
}

// Sample posts so the feed isn't empty
const DEFAULT_POSTS: CommunityPost[] = [
    { id: 'demo-1', user_id: 'demo', content: '🏋️ Just hit a new PR on bench press — 100kg for 5 reps! The grind is paying off.', post_type: 'pr', metadata: {}, likes_count: 12, comments_count: 3, created_at: new Date(Date.now() - 3600000).toISOString(), display_name: 'Alex Iron', avatar_url: undefined, username: 'alex_iron', liked_by_me: false },
    { id: 'demo-2', user_id: 'demo', content: 'Day 30 of my consistency streak! Haven\'t missed a single workout this month. Discipline > Motivation 💪', post_type: 'milestone', metadata: {}, likes_count: 24, comments_count: 7, created_at: new Date(Date.now() - 7200000).toISOString(), display_name: 'Sarah Lift', avatar_url: undefined, username: 'sarah_lift', liked_by_me: false },
    { id: 'demo-3', user_id: 'demo', content: 'Recovery day today. Foam rolling, light stretching, and a cold shower. Your body needs rest to grow. 🧊', post_type: 'general', metadata: {}, likes_count: 8, comments_count: 2, created_at: new Date(Date.now() - 14400000).toISOString(), display_name: 'Mike Grind', avatar_url: undefined, username: 'mike_grind', liked_by_me: false },
];

export function useCommunity() {
    const { user } = useAuthContext();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('community_posts')
                .select(`
                    *,
                    profiles:user_id (display_name, avatar_url, username)
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error || !data || data.length === 0) {
                console.warn('useCommunity: posts query failed or empty, using defaults.', error?.message);
                setPosts(DEFAULT_POSTS);
                setLoading(false);
                return;
            }

            // Check which posts current user has liked
            let likedPostIds: Set<string> = new Set();
            if (user) {
                try {
                    const { data: likes } = await supabase
                        .from('post_likes')
                        .select('post_id')
                        .eq('user_id', user.id);
                    if (likes) likedPostIds = new Set(likes.map(l => l.post_id));
                } catch { /* ignore */ }
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mapped = data.map((p: any) => {
                const prof = p.profiles;
                return {
                    id: p.id,
                    user_id: p.user_id,
                    content: p.content,
                    post_type: p.post_type,
                    metadata: p.metadata || {},
                    likes_count: p.likes_count ?? 0,
                    comments_count: p.comments_count ?? 0,
                    created_at: p.created_at,
                    display_name: prof?.display_name || 'Anonymous',
                    avatar_url: prof?.avatar_url || undefined,
                    username: prof?.username || undefined,
                    liked_by_me: likedPostIds.has(p.id),
                } as CommunityPost;
            });

            setPosts(mapped);
        } catch {
            console.warn('useCommunity: Exception, using defaults.');
            setPosts(DEFAULT_POSTS);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const createPost = useCallback(async (content: string, postType = 'general', metadata = {}) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('community_posts')
                .insert({ user_id: user.id, content, post_type: postType, metadata });
            if (!error) fetchPosts();
            return { error };
        } catch (err) {
            console.warn('createPost failed:', err);
            return { error: { message: String(err) } };
        }
    }, [user, fetchPosts]);

    const toggleLike = useCallback(async (postId: string, currentlyLiked: boolean) => {
        if (!user) return;

        try {
            if (currentlyLiked) {
                await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', postId);
            } else {
                await supabase.from('post_likes').insert({ user_id: user.id, post_id: postId });
            }
        } catch { /* ignore DB errors for likes */ }

        // Update local state optimistically
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    liked_by_me: !currentlyLiked,
                    likes_count: currentlyLiked ? p.likes_count - 1 : p.likes_count + 1,
                };
            }
            return p;
        }));
    }, [user]);

    return { posts, loading, createPost, toggleLike, refetch: fetchPosts };
}
