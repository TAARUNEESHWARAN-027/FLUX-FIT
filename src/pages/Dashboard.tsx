import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { DailyCheckInModal } from '@/components/dashboard/DailyCheckInModal';
import { AICoachCard } from '@/components/dashboard/AICoachCard';
import { HealthScoreGauge } from '@/components/dashboard/HealthScoreGauge';
import { LevelProgress } from '@/components/gamification/LevelProgress';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { NudgeToast } from '@/components/notifications/NudgeToast';
import { Flame, Activity, Moon, ArrowUpRight, Dumbbell, Calendar, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useStats } from '@/hooks/useStats';
import { useAICoach } from '@/hooks/useAICoach';
import { useHealthScore } from '@/hooks/useHealthScore';
import { useGamification } from '@/hooks/useGamification';

export default function Dashboard() {
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const navigate = useNavigate();
    const { profile } = useProfile();
    const { todayPlan } = useWorkouts();
    const { stats } = useStats();
    const { topRecommendation, nudges, submitFeedback, dismiss } = useAICoach();
    const { score, trend } = useHealthScore();
    const { level, streakCurrent, streakMultiplier } = useGamification();

    const displayName = profile?.display_name || 'Warrior';
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

    return (
        <DashboardLayout>
            <DailyCheckInModal isOpen={isCheckInOpen} onClose={() => setIsCheckInOpen(false)} />
            <NudgeToast nudge={nudges[0] || null} onDismiss={dismiss} />

            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Welcome back, <span className="text-neon-cyan text-glow">{displayName}</span></h1>
                        <p className="text-gray-400">{dateStr} • Day {stats.daysSinceStart} of Discipline</p>
                    </div>
                    <Button variant="neon" size="lg" onClick={() => setIsCheckInOpen(true)}>
                        <Calendar className="w-5 h-5" />
                        Daily Check-in
                    </Button>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassCard className="flex items-center gap-4">
                        <div className="p-3 bg-neon-cyan/20 rounded-xl text-neon-cyan">
                            <Dumbbell className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Workout Compliance</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">{stats.workoutCompliance}%</span>
                                {stats.workoutChange !== 0 && (
                                    <span className={`text-xs flex items-center ${stats.workoutChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        <ArrowUpRight className={`w-3 h-3 ${stats.workoutChange < 0 ? 'rotate-180' : ''}`} />
                                        {stats.workoutChange > 0 ? '+' : ''}{stats.workoutChange}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="flex items-center gap-4">
                        <div className="p-3 bg-neon-violet/20 rounded-xl text-neon-violet">
                            <Flame className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Diet Adherence</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">{stats.dietAdherence}%</span>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="flex items-center gap-4">
                        <div className="p-3 bg-neon-teal/20 rounded-xl text-neon-teal">
                            <Moon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Recovery Score</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">{stats.recoveryScore}</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Today's Plan (Left 2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* AI Coach Card */}
                        <AICoachCard
                            recommendation={topRecommendation}
                            onFeedback={submitFeedback}
                            onDismiss={dismiss}
                        />

                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-neon-cyan" />
                            Today's Protocol
                        </h2>

                        <GlassCard className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl -z-10" />

                            {todayPlan ? (
                                <>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">{todayPlan.name}</h3>
                                            <p className="text-gray-400">{todayPlan.focus}</p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider border border-white/5">
                                            {todayPlan.intensity}
                                        </span>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        {todayPlan.exercises.slice(0, 4).map((exercise, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {i + 1}
                                                    </div>
                                                    <span className="font-medium">{exercise.name}</span>
                                                </div>
                                                <div className="flex gap-4 text-sm text-gray-400">
                                                    <span>{exercise.sets}×{exercise.reps}</span>
                                                    {exercise.rpe && <span className="text-neon-cyan">RPE {exercise.rpe}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-gray-500 text-lg mb-2">Rest Day</p>
                                    <p className="text-gray-600 text-sm">Take it easy — recovery is part of the process.</p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button className="flex-1" onClick={() => navigate('/workouts')}>
                                    <Play className="w-4 h-4 mr-2" />
                                    {todayPlan?.is_rest_day ? 'Active Recovery' : 'Start Workout'}
                                </Button>
                                <Button variant="secondary" onClick={() => navigate('/workouts')}>View Details</Button>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Sidebar / Stats (Right col) */}
                    <div className="space-y-6">
                        {/* Health Score */}
                        <GlassCard className="text-center">
                            <h2 className="text-sm font-bold text-white mb-3">Health Score</h2>
                            <HealthScoreGauge score={score} trend={trend} size="md" />
                        </GlassCard>

                        {/* Level & XP */}
                        <GlassCard>
                            <h2 className="text-sm font-bold text-white mb-3 text-center">Level Progress</h2>
                            <LevelProgress level={level} compact />
                        </GlassCard>

                        {/* Streak */}
                        <GlassCard className="text-center">
                            <StreakFlame streak={streakCurrent} multiplier={streakMultiplier} compact />
                            <div className="mt-2">
                                <ProgressBar label="Streak" progress={Math.min(100, streakCurrent * 10)} color="#8F00FF" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Longest: {profile?.streak_longest || 0} days
                            </p>
                        </GlassCard>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
