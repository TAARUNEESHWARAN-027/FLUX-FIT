import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { MoodSelector } from '@/components/wellness/MoodSelector';
import { HealthScoreGauge } from '@/components/dashboard/HealthScoreGauge';
import { useMoodJournal } from '@/hooks/useMoodJournal';
import { useHealthScore } from '@/hooks/useHealthScore';
import { Heart, Calendar, PenLine, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Wellness() {
    const { todayEntry, entries, weeklyAvg, saveMood, availableTags, loading: moodLoading } = useMoodJournal();
    const { score, trend, loading: scoreLoading } = useHealthScore();

    const [mood, setMood] = useState(todayEntry?.moodScore || 0);
    const [energy, setEnergy] = useState(todayEntry?.energyLevel || 0);
    const [tags, setTags] = useState<string[]>(todayEntry?.tags || []);
    const [journal, setJournal] = useState(todayEntry?.journalEntry || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        if (mood === 0) { toast.error('Please select a mood'); return; }
        setSaving(true);
        const { error } = await saveMood({
            date: new Date().toISOString().split('T')[0],
            moodScore: mood,
            energyLevel: energy || undefined,
            tags,
            journalEntry: journal || undefined,
        });
        setSaving(false);
        if (!error) {
            toast.success('Mood logged!');
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } else {
            toast.error('Saved locally (DB sync pending)');
            setSaved(true);
        }
    };

    const moodEmojis = ['', '😢', '😕', '😐', '🙂', '😊'];

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Heart className="w-6 h-6 text-neon-pink" />
                            Wellness Center
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">Track your mental health, mood, and holistic well-being</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main: Mood Journal */}
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard>
                            <div className="flex items-center gap-2 mb-4">
                                <PenLine className="w-5 h-5 text-neon-violet" />
                                <h2 className="font-bold text-white">Daily Mood Check-In</h2>
                                {todayEntry && (
                                    <span className="ml-auto text-xs bg-neon-teal/10 text-neon-teal px-2 py-0.5 rounded-full">
                                        Logged Today {moodEmojis[todayEntry.moodScore]}
                                    </span>
                                )}
                            </div>

                            <MoodSelector
                                value={mood}
                                energyLevel={energy}
                                onMoodChange={setMood}
                                onEnergyChange={setEnergy}
                                selectedTags={tags}
                                availableTags={availableTags}
                                onTagsChange={setTags}
                            />

                            {/* Journal entry */}
                            <div className="mt-4">
                                <textarea
                                    value={journal}
                                    onChange={e => setJournal(e.target.value)}
                                    placeholder="How are you really feeling? Write freely..."
                                    className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none focus:border-neon-violet/40 focus:outline-none transition-colors"
                                />
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={mood === 0 || saving}
                                className="mt-3 w-full"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : saved ? (
                                    <Check className="w-4 h-4 mr-2" />
                                ) : null}
                                {saving ? 'Saving...' : saved ? 'Saved!' : 'Log Mood'}
                            </Button>
                        </GlassCard>

                        {/* Recent entries */}
                        <GlassCard>
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="w-5 h-5 text-neon-cyan" />
                                <h2 className="font-bold text-white">Recent Entries</h2>
                                <span className="ml-auto text-xs text-gray-500">
                                    Weekly Avg: {weeklyAvg > 0 ? `${weeklyAvg}/5` : 'N/A'}
                                </span>
                            </div>

                            {moodLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                                </div>
                            ) : entries.length === 0 ? (
                                <p className="text-gray-600 text-sm text-center py-8">
                                    No mood entries yet. Start logging above!
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {entries.slice(0, 7).map((entry, i) => (
                                        <motion.div
                                            key={entry.id || i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center gap-3 p-2 rounded-lg bg-white/3 hover:bg-white/5 transition-colors"
                                        >
                                            <span className="text-xl">{moodEmojis[entry.moodScore]}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-white font-medium">
                                                        {new Date(entry.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    {entry.energyLevel && (
                                                        <span className="text-xs text-gray-500">⚡ {entry.energyLevel}/5</span>
                                                    )}
                                                </div>
                                                {entry.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                        {entry.tags.slice(0, 3).map(t => (
                                                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{t}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-8 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${(entry.moodScore / 5) * 100}%`,
                                                        backgroundColor: entry.moodScore >= 4 ? '#00FF9D' : entry.moodScore >= 3 ? '#FFB800' : '#FF4D6A',
                                                    }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </div>

                    {/* Sidebar: Health Score */}
                    <div className="space-y-6">
                        <GlassCard className="text-center">
                            <h3 className="font-bold text-white mb-4">Health Score</h3>
                            {scoreLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                                </div>
                            ) : (
                                <HealthScoreGauge score={score} trend={trend} size="lg" />
                            )}
                        </GlassCard>

                        {/* Wellness tips */}
                        <GlassCard>
                            <h3 className="font-bold text-white mb-3 text-sm">💡 Wellness Insight</h3>
                            <p className="text-gray-400 text-xs leading-relaxed">
                                Regular mood tracking increases self-awareness by 40%.
                                Even a 2-minute journal entry helps you identify patterns
                                and triggers for better mental health management.
                            </p>
                        </GlassCard>

                        <GlassCard>
                            <h3 className="font-bold text-white mb-3 text-sm">🧘 Mindful Moment</h3>
                            <p className="text-gray-400 text-xs leading-relaxed">
                                Take 3 deep breaths right now. Inhale for 4 counts,
                                hold for 4, exhale for 6. This activates your
                                parasympathetic nervous system and reduces stress.
                            </p>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
