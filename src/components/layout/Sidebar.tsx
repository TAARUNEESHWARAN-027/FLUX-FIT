import { Home, Activity, Utensils, Zap, Award, Users, Settings, LogOut, Sparkles, Heart, BarChart3 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Sparkles, label: 'AI Coach', path: '/ai-coach' },
    { icon: Activity, label: 'Workouts', path: '/workouts' },
    { icon: Utensils, label: 'Nutrition', path: '/nutrition' },
    { icon: Zap, label: 'Recovery', path: '/recovery' },
    { icon: Heart, label: 'Wellness', path: '/wellness' },
    { icon: BarChart3, label: 'Insights', path: '/insights' },
    { icon: Award, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Users, label: 'Community', path: '/community' },
];

export function Sidebar() {
    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-zinc-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neon-cyan to-neon-violet animate-pulse" />
                <h1 className="text-2xl font-bold tracking-tighter text-white">
                    FLUX <span className="text-neon-cyan">FIT</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                isActive
                                    ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )
                        }
                    >
                        <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5">
                <NavLink
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                </NavLink>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all mt-1">
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
