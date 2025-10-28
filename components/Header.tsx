import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { AppNotification } from '../types';
import NotificationButton from './NotificationButton';
import NotificationInbox from './NotificationInbox';
import { markAllAsRead } from '../services/notificationService';

const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zM8 12a6 6 0 00-6 6h12a6 6 0 00-6-6z" clipRule="evenodd" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

interface HeaderProps {
  setView: (view: 'app' | 'profile') => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
}

const Header: React.FC<HeaderProps> = ({ setView, notifications, setNotifications }) => {
  const { user, profile, signOut, openAuthModal } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (inboxRef.current && !inboxRef.current.contains(event.target as Node)) {
        setIsInboxOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setView('profile');
    setIsDropdownOpen(false);
  }
  
  const handleSignOut = async () => {
    await signOut();
    setView('app');
    setIsDropdownOpen(false);
  };
  
  const handleToggleInbox = () => {
    setIsInboxOpen(prev => !prev);
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(current => current.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center">
      <div className="text-center sm:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 cursor-pointer" onClick={() => setView('app')}>
          Go<span className="text-blue-500">Together</span>
        </h1>
        <p className="mt-1 text-lg text-slate-500">Your friendly ridesharing community.</p>
      </div>
      <div className="mt-4 sm:mt-0">
        {user ? (
          <div className="flex items-center space-x-2">
            <div className="relative" ref={inboxRef}>
              <NotificationButton unreadCount={unreadCount} onClick={handleToggleInbox} />
              <NotificationInbox 
                isOpen={isInboxOpen}
                notifications={notifications}
                onClose={() => setIsInboxOpen(false)}
                onMarkAllRead={handleMarkAllRead}
              />
            </div>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-3 p-1 rounded-full hover:bg-slate-100 transition-colors">
                <span className="text-sm text-slate-600 hidden sm:inline">{profile?.full_name || user.email}</span>
                <img className="h-9 w-9 rounded-full object-cover" src={profile?.avatar_url || `https://picsum.photos/seed/${user.id}/100/100`} alt="Your avatar" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-slate-100">
                  <div className="py-1">
                    <button onClick={handleProfileClick} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                      <UserIcon />
                      <span>Profile</span>
                    </button>
                    <button onClick={handleSignOut} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                      <LogoutIcon />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="px-5 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Login / Sign Up
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;