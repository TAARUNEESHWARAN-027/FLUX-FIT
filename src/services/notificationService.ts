import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = 'nudge' | 'achievement' | 'streak' | 'level_up' | 'system' | 'ai_recommendation';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    actionRoute?: string;
    read: boolean;
    readAt?: string;
    createdAt: string;
    metadata: Record<string, unknown>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const notificationService = {
    /**
     * Get unread notifications.
     */
    async getUnread(userId: string, limit = 20): Promise<AppNotification[]> {
        try {
            const { data, error } = await supabase
                .from('notification_history')
                .select('*')
                .eq('user_id', userId)
                .eq('read', false)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error || !data) return [];
            return data.map(this.mapRow);
        } catch {
            return [];
        }
    },

    /**
     * Get all recent notifications.
     */
    async getRecent(userId: string, limit = 50): Promise<AppNotification[]> {
        try {
            const { data, error } = await supabase
                .from('notification_history')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error || !data) return [];
            return data.map(this.mapRow);
        } catch {
            return [];
        }
    },

    /**
     * Get unread count.
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('notification_history')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('read', false);

            if (error) return 0;
            return count || 0;
        } catch {
            return 0;
        }
    },

    /**
     * Mark a notification as read.
     */
    async markRead(notificationId: string): Promise<void> {
        try {
            await supabase
                .from('notification_history')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('id', notificationId);
        } catch { /* silent */ }
    },

    /**
     * Mark all notifications as read.
     */
    async markAllRead(userId: string): Promise<void> {
        try {
            await supabase
                .from('notification_history')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('user_id', userId)
                .eq('read', false);
        } catch { /* silent */ }
    },

    /**
     * Create a notification.
     */
    async create(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        options?: { actionRoute?: string; metadata?: Record<string, unknown> }
    ): Promise<void> {
        try {
            await supabase
                .from('notification_history')
                .insert({
                    user_id: userId,
                    notification_type: type,
                    title,
                    message,
                    action_route: options?.actionRoute,
                    metadata: options?.metadata || {},
                });
        } catch (e) {
            console.warn('notificationService.create failed:', e);
        }
    },

    /**
     * Send achievement notification.
     */
    async notifyAchievement(userId: string, achievementTitle: string, icon: string): Promise<void> {
        await this.create(userId, 'achievement', `${icon} Achievement Unlocked!`, `You earned: ${achievementTitle}`, {
            actionRoute: '/insights',
            metadata: { achievement: achievementTitle },
        });
    },

    /**
     * Send level up notification.
     */
    async notifyLevelUp(userId: string, newLevel: number, title: string): Promise<void> {
        await this.create(userId, 'level_up', `🎉 Level ${newLevel}!`, `You've reached ${title}! Keep pushing.`, {
            metadata: { level: newLevel, title },
        });
    },

    /**
     * Send streak milestone notification.
     */
    async notifyStreakMilestone(userId: string, days: number): Promise<void> {
        await this.create(userId, 'streak', `🔥 ${days}-Day Streak!`, `Incredible consistency! ${days} days of discipline.`, {
            metadata: { streak: days },
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRow(row: any): AppNotification {
        return {
            id: row.id,
            type: row.notification_type,
            title: row.title,
            message: row.message,
            actionRoute: row.action_route,
            read: row.read,
            readAt: row.read_at,
            createdAt: row.created_at,
            metadata: row.metadata || {},
        };
    },
};
