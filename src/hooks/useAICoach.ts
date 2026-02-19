import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthProvider';
import { aiService, type AIRecommendation } from '@/services/aiService';

export function useAICoach() {
    const { user } = useAuthContext();
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecommendations = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        try {
            const recs = await aiService.getRecommendations(user.id);
            setRecommendations(recs);
        } catch (e) {
            console.warn('useAICoach: Failed to fetch recommendations', e);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);

    const submitFeedback = useCallback(async (recId: string, rating: number, note?: string) => {
        await aiService.submitFeedback(recId, rating, note);
        setRecommendations(prev => prev.map(r =>
            r.id === recId ? { ...r, status: 'acted' as const, feedbackRating: rating } : r
        ));
    }, []);

    const dismiss = useCallback(async (recId: string) => {
        await aiService.dismiss(recId);
        setRecommendations(prev => prev.filter(r => r.id !== recId));
    }, []);

    const markSeen = useCallback(async (recId: string) => {
        await aiService.markSeen(recId);
    }, []);

    const topRecommendation = recommendations.find(r => r.status === 'pending') || recommendations[0] || null;
    const nudges = recommendations.filter(r => r.type === 'nudge');
    const insights = recommendations.filter(r => r.type === 'insight');

    return {
        recommendations, topRecommendation, nudges, insights,
        loading, submitFeedback, dismiss, markSeen,
        refetch: fetchRecommendations,
    };
}
