import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthProvider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuthContext();

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm">Loading…</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
