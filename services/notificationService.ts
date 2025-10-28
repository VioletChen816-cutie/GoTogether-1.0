import { supabase } from '../lib/supabaseClient';
import { AppNotification, NotificationEnumType } from '../types';

export const getNotificationsForUser = async (): Promise<AppNotification[]> => {
    if (!supabase) throw new Error('Supabase client is not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select(`
            *,
            rides (
                from,
                to
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching notifications:', error.message);
        throw error;
    }

    return data || [];
};

export const markAllAsRead = async (): Promise<void> => {
    if (!supabase) throw new Error('Supabase client is not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking notifications as read:', error.message);
        throw error;
    }
};

export const markRequestNotificationAsRead = async (requestId: string, notificationType: NotificationEnumType): Promise<void> => {
    if (!supabase) throw new Error('Supabase client is not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('request_id', requestId)
        .eq('user_id', user.id)
        .eq('type', notificationType)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking request notification as read:', error.message);
        throw error;
    }
};

export const markNotificationsAsReadByType = async (types: NotificationEnumType[]): Promise<void> => {
    if (!supabase) throw new Error('Supabase client is not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (types.length === 0) return;

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('type', types)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking notifications as read by type:', error.message);
        throw error;
    }
};
