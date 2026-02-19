import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Sparkles, ThumbsUp, ThumbsDown, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AIRecommendation } from '@/services/aiService';

interface AICoachCardProps {
    recommendation: AIRecommendation | null;
    onFeedback?: (id: string, rating: number) => void;
    onDismiss?: (id: string) => void;
}

const typeIcons: Record<string, string> = {
    daily_plan: '✨', nudge: '⚡', recovery: '🧊',
    challenge: '🎯', insight: '💡', goal_suggestion: '🎯',
};

const priorityColors: Record<string, string> = {
    high: 'border-neon-pink/30 bg-neon-pink/5',
    medium: 'border-neon-cyan/20 bg-neon-cyan/5',
    low: 'border-white/10 bg-white/5',
};

export function AICoachCard({ recommendation, onFeedback, onDismiss }: AICoachCardProps) {
    const navigate = useNavigate();

    if (!recommendation) {
        return (
            <GlassCard className="relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-neon-violet" />
                    <h3 className="font-bold text-white">AI Coach</h3>
                </div>
                <p className="text-gray-500 text-sm">No recommendations right now. Keep logging your activities!</p>
            </GlassCard>
        );
    }

    const rec = recommendation;
    const icon = typeIcons[rec.type] || '💡';

    return (
        <GlassCard className={`relative overflow-hidden border ${priorityColors[rec.priority]}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-violet/5 rounded-full blur-3xl -z-10" />

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-neon-violet" />
                            <span className="text-xs font-medium text-neon-violet uppercase tracking-wider">AI Coach</span>
                        </div>
                        <h3 className="font-bold text-white text-sm mt-0.5">{rec.title}</h3>
                    </div>
                </div>
                {onDismiss && (
                    <button
                        onClick={() => onDismiss(rec.id)}
                        className="text-gray-600 hover:text-gray-400 transition-colors p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Message */}
            <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-line">
                {rec.message}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between">
                {rec.actionLabel && rec.actionRoute && (
                    <Button
                        size="sm"
                        onClick={() => navigate(rec.actionRoute!)}
                        className="text-xs"
                    >
                        {rec.actionLabel}
                        <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                )}

                {onFeedback && (
                    <div className="flex items-center gap-1 ml-auto">
                        <button
                            onClick={() => onFeedback(rec.id, 5)}
                            className="p-1.5 rounded-lg hover:bg-green-500/10 text-gray-500 hover:text-green-400 transition-colors"
                            title="Helpful"
                        >
                            <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onFeedback(rec.id, 1)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                            title="Not helpful"
                        >
                            <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
