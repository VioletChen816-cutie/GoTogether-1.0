import { supabase } from '../lib/supabaseClient';
import { AppNotification, NotificationEnumType } from '../types';

export const getNotificationsForUser = async (): Promise<AppNotification[]> => {
    if (!supabase) throw new Error('Supabase client is not initialized');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Step 1: Fetch notifications without the problematic join.
    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching notifications:', error.message);
        throw error;
    }

    if (!notifications || notifications.length === 0) {
        return [];
    }
    
    // Step 2: Collect unique ride IDs from the notifications.
    const rideIds = [...new Set(notifications.map(n => n.ride_id).filter(Boolean))];

    if (rideIds.length === 0) {
        return notifications;
    }

    // Step 3: Fetch the details for only the necessary rides.
    const { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select('id, from, to')
        .in('id', rideIds);

    if (ridesError) {
        // If fetching rides fails, we can still return the notifications without ride details.
        console.error('Error fetching ride details for notifications:', ridesError.message);
        return notifications;
    }

    // Step 4: Create a lookup map for ride details.
    const ridesMap = new Map(rides.map(r => [r.id, { from: r.from, to: r.to }]));

    // Step 5: Attach ride details to each relevant notification.
    return notifications.map(notification => ({
        ...notification,
        rides: notification.ride_id ? ridesMap.get(notification.ride_id) : undefined,
    }));
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
