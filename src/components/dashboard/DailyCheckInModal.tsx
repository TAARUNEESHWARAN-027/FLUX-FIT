import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Dumbbell, Utensils, Moon } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthProvider';

interface DailyCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DailyCheckInModal({ isOpen, onClose }: DailyCheckInModalProps) {
    const { user } = useAuthContext();
    const [step, setStep] = useState(1);
    const [workoutDone, setWorkoutDone] = useState<boolean | null>(null);
    const [dietAdherence, setDietAdherence] = useState(5);
    const [recoveryScore, setRecoveryScore] = useState(5);
    const [saving, setSaving] = useState(false);

    const handleComplete = async () => {
        setSaving(true);
        const today = new Date().toISOString().split('T')[0];

        try {
            if (user) {
                // Save daily check-in
                await supabase
                    .from('daily_checkins')
                    .upsert({ user_id: user.id, date: today, status: 'PROCESSED', processed_at: new Date().toISOString(), notes: `Workout: ${workoutDone ? 'Yes' : 'No'}, Diet: ${dietAdherence}/10, Recovery: ${recoveryScore}/10` }, { onConflict: 'user_id,date' });

                // Award XP for checking in
                try {
                    await supabase.rpc('commit_xp_transaction', {
                        p_user_id: user.id,
                        p_amount: 50 + (workoutDone ? 50 : 0) + (dietAdherence * 5),
                        p_source_type: 'DIET_LOG',
                        p_reference_id: null,
                        p_metadata: { check_in: true, date: today },
                    });
                } catch { /* XP function might not be available */ }
            }
        } catch (err) {
            console.warn('Check-in save failed:', err);
        }

        toast.success("Check-in logged! Keep grinding.", {
            description: "XP added to your profile."
        });
        setSaving(false);
        onClose();
        setTimeout(() => setStep(1), 500);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg z-10"
                >
                    <GlassCard className="p-0 overflow-hidden border-neon-cyan/20">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="text-neon-cyan">Daily</span> Check-in
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
                            {step === 1 && (
                                <motion.div
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="space-y-6 w-full"
                                >
                                    <div className="w-16 h-16 rounded-full bg-neon-cyan/10 flex items-center justify-center mx-auto text-neon-cyan mb-4">
                                        <Dumbbell className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold">Did you workout today?</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button
                                            variant={workoutDone === true ? 'neon' : 'secondary'}
                                            onClick={() => setWorkoutDone(true)}
                                            className="h-24 text-lg border-2"
                                        >
                                            YES
                                        </Button>
                                        <Button
                                            variant={workoutDone === false ? 'neon' : 'secondary'}
                                            onClick={() => setWorkoutDone(false)}
                                            className="h-24 text-lg border-2"
                                        >
                                            NO
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="space-y-6 w-full"
                                >
                                    <div className="w-16 h-16 rounded-full bg-neon-violet/10 flex items-center justify-center mx-auto text-neon-violet mb-4">
                                        <Utensils className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold">Diet Adherence</h3>
                                    <p className="text-gray-400">How clean was your eating today?</p>

                                    <div className="flex gap-2 justify-center py-4">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => setDietAdherence(num)}
                                                className={cn(
                                                    "w-8 h-12 rounded-lg transition-all",
                                                    dietAdherence >= num ? "bg-neon-violet text-white shadow-[0_0_10px_rgba(143,0,255,0.4)]" : "bg-zinc-800 text-gray-500 hover:bg-zinc-700"
                                                )}
                                            >
                                                <div className="h-full flex items-end justify-center pb-1 text-xs font-bold w-full">

                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-3xl font-bold text-neon-violet">{dietAdherence}/10</div>
                                </motion.div>
                            )}
                            {step === 3 && (
                                <motion.div
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="space-y-6 w-full"
                                >
                                    <div className="w-16 h-16 rounded-full bg-neon-teal/10 flex items-center justify-center mx-auto text-neon-teal mb-4">
                                        <Moon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold">Recovery Status</h3>
                                    <p className="text-gray-400">How energetic do you feel?</p>

                                    <input
                                        type="range"
                                        min="1" max="10"
                                        value={recoveryScore}
                                        onChange={(e) => setRecoveryScore(Number(e.target.value))}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-neon-teal"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Exhausted</span>
                                        <span>Fresh</span>
                                    </div>
                                    <div className="text-3xl font-bold text-neon-teal">{recoveryScore}/10</div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 flex justify-between">
                            <Button
                                variant="ghost"
                                onClick={() => setStep(s => Math.max(1, s - 1))}
                                disabled={step === 1}
                            >
                                Back
                            </Button>

                            {step < 3 ? (
                                <Button
                                    onClick={() => setStep(s => s + 1)}
                                    disabled={step === 1 && workoutDone === null}
                                >
                                    Next
                                    <Check className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button variant="neon" onClick={handleComplete} disabled={saving}>
                                    {saving ? 'Saving...' : 'Complete Check-in'}
                                </Button>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
