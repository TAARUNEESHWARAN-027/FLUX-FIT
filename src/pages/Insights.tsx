import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActivityHeatmap } from '@/components/insights/ActivityHeatmap';
import { LevelProgress } from '@/components/gamification/LevelProgress';
import { AchievementBadge } from '@/components/gamification/AchievementBadge';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { useGamification } from '@/hooks/useGamification';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useHealthScore } from '@/hooks/useHealthScore';
import { HealthScoreGauge } from '@/components/dashboard/HealthScoreGauge';
import { BarChart3, Trophy, TrendingUp, Loader2, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Insights() {
    const { level, streakCurrent, streakMultiplier, habitStrength, achievements, loading: gamLoading } = useGamification();
    const { heatmap, trends, summary, loading: analyticsLoading } = useAnalytics();
    const { score, trend, loading: scoreLoading } = useHealthScore();

    const loading = gamLoading || analyticsLoading || scoreLoading;

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-neon-cyan" />
                        Insights & Progress
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Your behavioral analytics, achievements, and growth metrics</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                    </div>
                ) : (
                    <>
                        {/* Top row: Key metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <GlassCard className="text-center">
                                <StreakFlame streak={streakCurrent} multiplier={streakMultiplier} compact />
                                <p className="text-xs text-gray-500 mt-1">Current Streak</p>
                            </GlassCard>
                            <GlassCard className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Target className="w-4 h-4 text-neon-violet" />
                                    <span className="text-xl font-bold text-white">{habitStrength}</span>
                                </div>
                                <p className="text-xs text-gray-500">Habit Strength</p>
                            </GlassCard>
                            <GlassCard className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Zap className="w-4 h-4 text-neon-teal" />
                                    <span className="text-xl font-bold text-white">{level.currentXp.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-gray-500">Total XP</p>
                            </GlassCard>
                            <GlassCard className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Trophy className="w-4 h-4 text-amber-400" />
                                    <span className="text-xl font-bold text-white">
                                        {summary ? `${summary.achievementsUnlocked}/${summary.totalAchievements}` : '0'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">Achievements</p>
                            </GlassCard>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left column: Heatmap + Trends */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Activity Heatmap */}
                                <GlassCard>
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-neon-cyan" />
                                        Activity Map
                                    </h3>
                                    <ActivityHeatmap data={heatmap} />
                                </GlassCard>

                                {/* Weekly Trends */}
                                <GlassCard>
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-neon-teal" />
                                        Weekly Trends
                                    </h3>
                                    {trends.length === 0 ? (
                                        <p className="text-gray-600 text-sm text-center py-6">Not enough data for trends yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {trends.slice(-4).map((t, i) => (
                                                <motion.div
                                                    key={t.weekStart}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="flex items-center gap-3 p-2 rounded-lg bg-white/3"
                                                >
                                                    <span className="text-xs text-gray-500 w-20">
                                                        {new Date(t.weekStart).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                                                        <div>
                                                            <span className="text-sm font-medium text-white">{t.workouts}</span>
                                                            <span className="text-xs text-gray-600 block">workouts</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-white">{t.avgSleep || '—'}</span>
                                                            <span className="text-xs text-gray-600 block">avg sleep</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-white">{t.healthScore || '—'}</span>
                                                            <span className="text-xs text-gray-600 block">score</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </GlassCard>

                                {/* Summary stats */}
                                {summary && (
                                    <GlassCard>
                                        <h3 className="font-bold text-white mb-4">📊 Lifetime Stats</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { label: 'Total Workouts', value: summary.totalWorkouts, icon: '💪' },
                                                { label: 'Workout Minutes', value: summary.totalWorkoutMinutes.toLocaleString(), icon: '⏱️' },
                                                { label: 'Avg/Week', value: summary.avgWorkoutsPerWeek, icon: '📅' },
                                                { label: 'Best Streak', value: `${summary.bestStreak} days`, icon: '🔥' },
                                                { label: 'XP Earned', value: summary.totalXpEarned.toLocaleString(), icon: '⚡' },
                                                { label: 'Mood Trend', value: summary.moodTrend === 'up' ? '📈 Up' : summary.moodTrend === 'down' ? '📉 Down' : '➡️ Stable', icon: '' },
                                            ].map(s => (
                                                <div key={s.label} className="text-center p-2">
                                                    <span className="text-lg">{s.icon}</span>
                                                    <p className="font-bold text-white text-lg">{s.value}</p>
                                                    <p className="text-xs text-gray-500">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </GlassCard>
                                )}
                            </div>

                            {/* Right column: Level + Achievements */}
                            <div className="space-y-6">
                                {/* Health Score */}
                                <GlassCard className="text-center">
                                    <h3 className="font-bold text-white mb-3 text-sm">Health Score</h3>
                                    <HealthScoreGauge score={score} trend={trend} size="md" />
                                </GlassCard>

                                {/* Level Progress */}
                                <GlassCard>
                                    <h3 className="font-bold text-white mb-4 text-sm text-center">Level Progress</h3>
                                    <LevelProgress level={level} />
                                </GlassCard>

                                {/* Achievements */}
                                <GlassCard>
                                    <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-amber-400" />
                                        Achievements
                                    </h3>
                                    {achievements.length === 0 ? (
                                        <p className="text-gray-600 text-sm text-center py-4">No achievements defined yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-2">
                                            {achievements.slice(0, 16).map(a => (
                                                <AchievementBadge key={a.id || a.code} achievement={a} size="sm" />
                                            ))}
                                        </div>
                                    )}
                                </GlassCard>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
