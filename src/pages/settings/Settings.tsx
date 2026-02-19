import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Settings as SettingsIcon, User, Mail, Target, Ruler, Weight, LogOut, Terminal } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuthContext } from '@/context/AuthProvider';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { seedService } from '@/services/seedService';

export default function Settings() {
    const { profile, updateProfile, loading } = useProfile();
    const { signOut, user } = useAuthContext();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [fitnessGoal, setFitnessGoal] = useState('general_fitness');
    const [heightCm, setHeightCm] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setBio(profile.bio || '');
            setFitnessGoal(profile.fitness_goal || 'general_fitness');
            setHeightCm(profile.height_cm?.toString() || '');
            setWeightKg(profile.weight_kg?.toString() || '');
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateProfile({
                display_name: displayName,
                bio,
                fitness_goal: fitnessGoal,
                height_cm: heightCm ? parseFloat(heightCm) : null,
                weight_kg: weightKg ? parseFloat(weightKg) : null,
            });
            if (result?.error) {
                console.error('Settings save error:', result.error);
                toast.error('Failed to save: ' + (result.error.message || 'Unknown error'));
            } else {
                toast.success('Settings saved!');
            }
        } catch (err) {
            console.error('Settings save exception:', err);
            toast.error('Failed to save settings');
        }
        setSaving(false);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20 max-w-3xl">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-xl text-white">
                        <SettingsIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-gray-400">Profile & account preferences</p>
                    </div>
                </div>

                {/* Profile Section */}
                <GlassCard>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-neon-cyan" /> Profile
                    </h2>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Email
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                placeholder="Tell us about yourself..."
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-colors resize-none"
                            />
                        </div>
                    </div>
                </GlassCard>

                {/* Fitness Section */}
                <GlassCard>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-neon-violet" /> Fitness Info
                    </h2>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Fitness Goal</label>
                            <select
                                value={fitnessGoal}
                                onChange={(e) => setFitnessGoal(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-violet/50 transition-colors"
                            >
                                <option value="general_fitness">General Fitness</option>
                                <option value="muscle_building">Muscle Building</option>
                                <option value="weight_loss">Weight Loss</option>
                                <option value="strength">Strength Training</option>
                                <option value="endurance">Endurance</option>
                                <option value="flexibility">Flexibility & Mobility</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                                    <Ruler className="w-4 h-4" /> Height (cm)
                                </label>
                                <input
                                    type="number"
                                    value={heightCm}
                                    onChange={(e) => setHeightCm(e.target.value)}
                                    placeholder="175"
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-violet/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
                                    <Weight className="w-4 h-4" /> Weight (kg)
                                </label>
                                <input
                                    type="number"
                                    value={weightKg}
                                    onChange={(e) => setWeightKg(e.target.value)}
                                    placeholder="80"
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-violet/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Developer Zone */}
                <GlassCard className="border-neon-pink/20 bg-neon-pink/5">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-neon-pink">
                        <Terminal className="w-5 h-5" /> Developer Zone
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">
                        Populate your account with realistic demo data (workouts, mood, sleep, achievements) to test the ecosystem.
                        <br /><strong>Warning: This will clear your existing history.</strong>
                    </p>
                    <Button
                        variant="ghost"
                        onClick={async () => {
                            if (!confirm('This will wipe your current data and replace it with demo data. Continue?')) return;
                            setSaving(true);
                            try {
                                if (user?.id) {
                                    await seedService.seedUserData(user.id);
                                    toast.success('Demo data seeded! Refreshing...');
                                    setTimeout(() => window.location.reload(), 1500);
                                }
                            } catch (e) {
                                toast.error('Seeding failed');
                            }
                            setSaving(false);
                        }}
                        className="w-full border-neon-pink/50 text-neon-pink hover:bg-neon-pink/10"
                    >
                        Seed Demo Data (Harini)
                    </Button>
                </GlassCard>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
                    >
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
