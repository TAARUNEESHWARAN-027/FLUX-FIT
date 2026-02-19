import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { AICoachCard } from '@/components/dashboard/AICoachCard';
import { HealthScoreGauge } from '@/components/dashboard/HealthScoreGauge';
import { LevelProgress } from '@/components/gamification/LevelProgress';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { useAICoach } from '@/hooks/useAICoach';
import { useGamification } from '@/hooks/useGamification';
import { useHealthScore } from '@/hooks/useHealthScore';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AICoachPage() {
    const { recommendations, topRecommendation, loading: aiLoading, submitFeedback, dismiss, refetch } = useAICoach();
    const { level, streakCurrent, streakMultiplier, loading: gamLoading } = useGamification();
    const { score, trend, loading: scoreLoading } = useHealthScore();

    const loading = aiLoading || gamLoading || scoreLoading;

    const typeLabels: Record<string, { icon: string; label: string }> = {
        daily_plan: { icon: '✨', label: 'Daily Plan' },
        nudge: { icon: '⚡', label: 'Nudge' },
        recovery: { icon: '🧊', label: 'Recovery' },
        challenge: { icon: '🎯', label: 'Challenge' },
        insight: { icon: '💡', label: 'Insight' },
        goal_suggestion: { icon: '🎯', label: 'Goal' },
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-neon-violet" />
                            AI Coach
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">Your personalized health intelligence engine</p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Refresh recommendations"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main: AI Recommendations */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Top recommendation (hero) */}
                            {topRecommendation && (
                                <AICoachCard
                                    recommendation={topRecommendation}
                                    onFeedback={submitFeedback}
                                    onDismiss={dismiss}
                                />
                            )}

                            {/* All recommendations list */}
                            <GlassCard>
                                <h3 className="font-bold text-white mb-4 text-sm">All Recommendations</h3>
                                {recommendations.length === 0 ? (
                                    <p className="text-gray-600 text-sm text-center py-8">
                                        No active recommendations. Log more activities to get personalized insights!
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {recommendations.map((rec, i) => {
                                            const tl = typeLabels[rec.type] || { icon: '💡', label: rec.type };
                                            return (
                                                <motion.div
                                                    key={rec.id}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="flex items-start gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors group"
                                                >
                                                    <span className="text-lg mt-0.5">{tl.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-sm font-semibold text-white">{rec.title}</span>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${rec.priority === 'high' ? 'bg-neon-pink/10 text-neon-pink' :
                                                                rec.priority === 'medium' ? 'bg-neon-cyan/10 text-neon-cyan' :
                                                                    'bg-white/5 text-gray-500'
                                                                }`}>
                                                                {rec.priority}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-400 text-xs line-clamp-2">{rec.message}</p>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => submitFeedback(rec.id, 5)}
                                                            className="p-1 rounded text-gray-600 hover:text-green-400 transition-colors"
                                                            title="Helpful"
                                                        >👍</button>
                                                        <button
                                                            onClick={() => dismiss(rec.id)}
                                                            className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors"
                                                            title="Dismiss"
                                                        >✕</button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </GlassCard>
                        </div>

                        {/* Right sidebar */}
                        <div className="space-y-6">
                            <GlassCard className="text-center">
                                <h3 className="font-bold text-white mb-3 text-sm">Health Score</h3>
                                <HealthScoreGauge score={score} trend={trend} size="md" />
                            </GlassCard>

                            <GlassCard className="flex flex-col items-center">
                                <h3 className="font-bold text-white mb-3 text-sm w-full text-center">Level</h3>
                                <LevelProgress level={level} compact />
                            </GlassCard>

                            <GlassCard className="flex flex-col items-center">
                                <h3 className="font-bold text-white mb-3 text-sm w-full text-center">Streak</h3>
                                <StreakFlame streak={streakCurrent} multiplier={streakMultiplier} />
                            </GlassCard>

                            <GlassCard>
                                <h3 className="font-bold text-white mb-2 text-sm">🧠 How It Works</h3>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    Your AI Coach analyzes your workout patterns, sleep quality,
                                    nutrition tracking, mood entries, and streak data to generate
                                    personalized recommendations every day.
                                </p>
                                <p className="text-gray-600 text-xs mt-2">
                                    Give feedback to improve suggestions over time.
                                </p>
                            </GlassCard>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
