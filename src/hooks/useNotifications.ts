import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthProvider';
import { notificationService, type AppNotification } from '@/services/notificationService';

export type { AppNotification };

export function useNotifications() {
    const { user } = useAuthContext();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        try {
            const [recent, count] = await Promise.all([
                notificationService.getRecent(user.id, 30),
                notificationService.getUnreadCount(user.id),
            ]);
            setNotifications(recent);
            setUnreadCount(count);
        } catch {
            console.warn('useNotifications: failed');
        }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const markRead = useCallback(async (id: string) => {
        await notificationService.markRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllRead = useCallback(async () => {
        if (!user) return;
        await notificationService.markAllRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }, [user]);

    return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications };
}
