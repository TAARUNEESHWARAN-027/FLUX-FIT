import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthProvider';

export default function ProtectedRoute() {
    const { user, loading } = useAuthContext();

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
