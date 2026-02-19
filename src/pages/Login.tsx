import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Login() {
    const { signIn, signUp } = useAuthContext();
    const navigate = useNavigate();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, displayName || undefined);
                if (error) {
                    setError(error.message);
                } else {
                    setSuccess('Account created! Signing you in...');
                    setTimeout(() => navigate('/', { replace: true }), 500);
                }
            } else {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                } else {
                    navigate('/', { replace: true });
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-neon-violet/15 rounded-full blur-[150px]" />
            <div className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-[150px]" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="p-2 bg-neon-cyan/20 rounded-xl">
                            <Zap className="w-8 h-8 text-neon-cyan" />
                        </div>
                        <span className="text-3xl font-bold tracking-tight">
                            Flux<span className="text-neon-cyan text-glow">Fit</span>
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                        {isSignUp ? 'Create your account to start your journey' : 'Welcome back, warrior'}
                    </p>
                </div>

                <GlassCard className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your name"
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-colors"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                                {success}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? 'Create Account' : 'Sign In'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                                setSuccess(null);
                            }}
                            className="text-sm text-gray-400 hover:text-neon-cyan transition-colors"
                        >
                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </GlassCard>

                <p className="text-center text-gray-600 text-xs mt-6">
                    Powered by Supabase Auth
                </p>
            </div>
        </div>
    );
}
