import React from 'react';

interface NotificationButtonProps {
    unreadCount: number;
    onClick: () => void;
}

const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

const NotificationButton: React.FC<NotificationButtonProps> = ({ unreadCount, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="relative p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label={`You have ${unreadCount} unread notifications.`}
        >
            <BellIcon />
            {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationButton;