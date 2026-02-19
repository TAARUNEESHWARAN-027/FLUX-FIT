import { useState, useEffect, useCallback } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

interface UseAuthReturn extends AuthState {
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    });

    useEffect(() => {
        let mounted = true;

        // Get the current session on mount
        supabase.auth
            .getSession()
            .then(({ data: { session } }) => {
                if (mounted) {
                    setState({ user: session?.user ?? null, session, loading: false });
                }
            })
            .catch(() => {
                // If Supabase is unreachable, just stop loading with no user
                if (mounted) {
                    setState({ user: null, session: null, loading: false });
                }
            });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setState({ user: session?.user ?? null, session, loading: false });
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    }, []);

    const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName },
            },
        });
        return { error };
    }, []);

    const signOut = useCallback(async () => {
        // Clear state immediately so ProtectedRoute redirects to /login
        setState({ user: null, session: null, loading: false });
        await supabase.auth.signOut();
    }, []);

    return { ...state, signIn, signUp, signOut };
}
