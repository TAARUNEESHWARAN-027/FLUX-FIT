import { Bell, Search, LogOut } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuthContext } from '@/context/AuthProvider';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
    const { profile } = useProfile();
    const { signOut } = useAuthContext();
    const navigate = useNavigate();

    const displayName = profile?.display_name || 'User';
    const initials = displayName
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <header className="h-20 fixed top-0 right-0 left-64 z-40 px-8 flex items-center justify-between bg-zinc-950/50 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-4 w-96">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search plans, workouts, friends..."
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all placeholder:text-gray-600"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-neon-pink rounded-full animate-ping" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-neon-pink rounded-full" />
                </button>

                <div className="h-8 w-[1px] bg-white/10" />

                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-white group-hover:text-neon-cyan transition-colors">{displayName}</p>
                        <p className="text-xs text-gray-500">Level {profile?.current_level || 1} • {profile?.current_xp || 0} XP</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-bold">{initials}</span>
                        )}
                    </div>
                </div>

                <button
                    onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    title="Sign Out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}
