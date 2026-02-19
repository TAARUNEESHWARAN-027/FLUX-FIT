import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Play, Clock, Dumbbell, BarChart3, ChevronRight } from 'lucide-react';
import { MuscleStatus } from '@/components/workout/MuscleStatus';
import { WeeklySchedule } from '@/components/workout/WeeklySchedule';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useWorkouts } from '@/hooks/useWorkouts';

export default function Workouts() {
    const { todayPlan, recentLogs, personalRecords, loading } = useWorkouts();

    // Build volume data for chart from recent logs
    const volumeData = recentLogs.length > 0
        ? recentLogs.slice().reverse().map(l => l.total_volume_kg || 0)
        : [0, 0, 0, 0, 0, 0, 0];

    const maxVolume = Math.max(...volumeData, 1);

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">My <span className="text-neon-cyan text-glow">Training</span></h1>
                        <p className="text-gray-400">Push yourself, because no one else is going to do it for you.</p>
                    </div>
                    <Button variant="neon" size="lg" className="shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                        <Play className="w-5 h-5 mr-2 fill-current" />
                        Start Session
                    </Button>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Featured Workout Card */}
                        <GlassCard className="relative overflow-hidden group border-neon-cyan/20">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl -z-10 transition-all group-hover:bg-neon-cyan/15" />

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : todayPlan && !todayPlan.is_rest_day ? (
                                <>
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="px-3 py-1 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs font-bold uppercase tracking-wider border border-neon-cyan/20">
                                            Today's Focus
                                        </span>
                                        <span className="text-gray-400 text-sm flex items-center gap-1">
                                            <Clock className="w-4 h-4" /> {todayPlan.estimated_duration_min} min
                                        </span>
                                    </div>

                                    <h2 className="text-3xl font-bold text-white mb-2">{todayPlan.name}</h2>
                                    <p className="text-gray-400 mb-8 max-w-lg">{todayPlan.focus}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="text-gray-400 text-xs mb-1">Exercises</div>
                                            <div className="text-xl font-bold text-white">{todayPlan.exercises.length} Moves</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="text-gray-400 text-xs mb-1">Duration</div>
                                            <div className="text-xl font-bold text-white">{todayPlan.estimated_duration_min} min</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="text-gray-400 text-xs mb-1">Intensity</div>
                                            <div className="text-xl font-bold text-neon-violet capitalize">{todayPlan.intensity}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {todayPlan.exercises.map((ex, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-neon-cyan font-bold">{i + 1}</span>
                                                    <span className="font-medium">{ex.name}</span>
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    {ex.sets} sets × {ex.reps}
                                                </div>
                                            </div>
                                        ))}
                                        <Button variant="ghost" className="w-full mt-4 text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10">
                                            View Full Routine <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 text-center">
                                    <h2 className="text-3xl font-bold text-white mb-2">Rest Day</h2>
                                    <p className="text-gray-400">Recovery is where your gains are made. Stretch, hydrate, and rest.</p>
                                </div>
                            )}
                        </GlassCard>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GlassCard>
                                <h3 className="font-bold flex items-center gap-2 mb-4">
                                    <BarChart3 className="w-5 h-5 text-neon-violet" />
                                    Volume Progression
                                </h3>
                                <div className="h-40 flex items-end gap-2 justify-between px-2">
                                    {volumeData.map((vol, i) => {
                                        const h = maxVolume > 0 ? (vol / maxVolume) * 100 : 5;
                                        return (
                                            <div key={i} className="w-full bg-zinc-800 rounded-t-sm hover:bg-neon-violet transition-colors relative group" style={{ height: `${Math.max(h, 5)}%` }}>
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    {Math.round(vol)}kg
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-gray-500">
                                    <span>Oldest</span>
                                    <span>Recent</span>
                                </div>
                            </GlassCard>

                            <GlassCard>
                                <h3 className="font-bold flex items-center gap-2 mb-4">
                                    <Dumbbell className="w-5 h-5 text-neon-teal" />
                                    Personal Records
                                </h3>
                                <div className="space-y-4">
                                    {personalRecords.length > 0 ? personalRecords.map((pr, i) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                            <div>
                                                <div className="font-medium text-white">{pr.exercise_name}</div>
                                                <div className="text-xs text-gray-500">{new Date(pr.achieved_at).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-xl font-bold text-neon-teal">{pr.weight_kg} kg</div>
                                        </div>
                                    )) : (
                                        <p className="text-gray-500 text-sm text-center py-4">No PRs recorded yet. Start training!</p>
                                    )}
                                </div>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Right Column: Status & Schedule */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold mb-4">Muscle Status</h2>
                            <MuscleStatus />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Weekly Schedule</h2>
                                <button className="text-neon-cyan text-sm hover:underline">Edit Split</button>
                            </div>
                            <WeeklySchedule />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
