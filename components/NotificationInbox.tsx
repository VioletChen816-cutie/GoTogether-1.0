import React from 'react';
import { AppNotification } from '../types';

interface NotificationInboxProps {
    isOpen: boolean;
    notifications: AppNotification[];
    onClose: () => void;
    onMarkAllRead: () => void;
}

const timeAgo = (date: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
}

const NotificationItem: React.FC<{ notification: AppNotification }> = ({ notification }) => (
    <div className={`p-3 border-l-4 ${notification.is_read ? 'border-transparent' : 'border-blue-500 bg-blue-50/50'}`}>
        <p className="text-sm text-slate-700">{notification.message}</p>
        <p className="text-xs text-slate-500 mt-1">{timeAgo(notification.created_at)}</p>
    </div>
);


const NotificationInbox: React.FC<NotificationInboxProps> = ({ isOpen, notifications, onClose, onMarkAllRead }) => {
    if (!isOpen) return null;

    const hasUnread = notifications.some(n => !n.is_read);

    return (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-20 border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-3 flex justify-between items-center border-b border-slate-200 flex-shrink-0">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {hasUnread && (
                    <button onClick={onMarkAllRead} className="text-xs font-semibold text-blue-500 hover:underline">
                        Mark all as read
                    </button>
                )}
            </div>
            <div className="overflow-y-auto">
                {notifications.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {notifications.map(n => <NotificationItem key={n.id} notification={n} />)}
                    </div>
                ) : (
                    <div className="text-center p-12 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                        <p className="font-semibold mt-4">No new notifications</p>
                        <p className="text-sm">We'll let you know when something new happens.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationInbox;
