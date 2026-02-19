import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { SleepSelector } from '@/components/recovery/SleepSelector';
import { RecoveryChecklist } from '@/components/recovery/RecoveryChecklist';
import { CoreReadiness } from '@/components/recovery/CoreReadiness';
import { Sliders, Activity, Zap, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRecovery } from '@/hooks/useRecovery';

export default function Recovery() {
    const { recoveryLog, saveRecovery } = useRecovery();
    const [sorenessLevel, setSorenessLevel] = useState(3);
    const [stressLevel, setStressLevel] = useState(4);
    const [saved, setSaved] = useState(false);

    // Load existing data
    useEffect(() => {
        if (recoveryLog) {
            setSorenessLevel(recoveryLog.soreness_level || 3);
            setStressLevel(recoveryLog.stress_level || 4);
        }
    }, [recoveryLog]);

    const handleSave = async () => {
        await saveRecovery({
            soreness_level: sorenessLevel,
            stress_level: stressLevel,
            sleep_hours: recoveryLog?.sleep_hours || 7,
            sleep_quality: recoveryLog?.sleep_quality || 3,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Recovery <span className="text-teal-400 text-glow">Lab</span></h1>
                        <p className="text-gray-400">Optimize your rest to maximize your gains.</p>
                    </div>
                    <Button variant="secondary" className="gap-2">
                        <Activity className="w-4 h-4" /> Connect Wearable
                    </Button>
                </div>

                {/* Top Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <CoreReadiness />
                    </div>
                    <div className="lg:col-span-2">
                        <SleepSelector />
                    </div>
                </div>

                {/* Middle Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-neon-cyan/20 rounded-lg text-neon-cyan">
                                    <Sliders className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Daily Wellness Check</h3>
                                    <p className="text-xs text-gray-400">Rate your physical and mental state</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Soreness Slider */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-yellow-400" /> Muscle Soreness
                                        </label>
                                        <span className="text-sm font-bold text-white">{sorenessLevel}/10</span>
                                    </div>
                                    <input type="range" min="1" max="10" value={sorenessLevel}
                                        onChange={(e) => setSorenessLevel(Number(e.target.value))}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                                        <span>Pain Free</span><span>Severe DOMS</span>
                                    </div>
                                </div>

                                {/* Stress Slider */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                            <Brain className="w-4 h-4 text-pink-400" /> Mental Stress
                                        </label>
                                        <span className="text-sm font-bold text-white">{stressLevel}/10</span>
                                    </div>
                                    <input type="range" min="1" max="10" value={stressLevel}
                                        onChange={(e) => setStressLevel(Number(e.target.value))}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-400" />
                                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                                        <span>Zen Mode</span><span>High Stress</span>
                                    </div>
                                </div>

                                <Button variant="neon" className="w-full" onClick={handleSave}>
                                    {saved ? '✓ Saved!' : 'Save Wellness Data'}
                                </Button>
                            </div>
                        </GlassCard>

                        <GlassCard className="bg-gradient-to-r from-teal-500/10 to-transparent border-teal-500/20">
                            <h3 className="font-bold text-white mb-2">AI Recovery Tip</h3>
                            <p className="text-sm text-gray-300">
                                {sorenessLevel >= 7
                                    ? 'Your soreness is high. Consider a full rest day with light stretching and foam rolling.'
                                    : stressLevel >= 7
                                        ? 'Mental stress is elevated. Try a 10-minute meditation or a relaxing walk to lower cortisol levels.'
                                        : 'Your recovery metrics look good! You\'re cleared for high-intensity training today.'
                                }
                            </p>
                            <Button variant="ghost" size="sm" className="mt-4 text-teal-400 hover:text-teal-300 p-0 hover:bg-transparent">
                                View Mobility Routine &rarr;
                            </Button>
                        </GlassCard>
                    </div>

                    <div className="lg:col-span-1">
                        <RecoveryChecklist />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
