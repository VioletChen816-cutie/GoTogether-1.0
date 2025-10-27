import React from 'react';
import { useAuth } from '../providers/AuthProvider';

const Header: React.FC = () => {
  const { user, signOut, openAuthModal } = useAuth();

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center">
      <div className="text-center sm:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
          Go<span className="text-blue-500">Together</span>
        </h1>
        <p className="mt-1 text-lg text-slate-500">Your friendly ridesharing community.</p>
      </div>
      <div className="mt-4 sm:mt-0">
        {user ? (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-600 hidden sm:inline">{user.email}</span>
            <img className="h-9 w-9 rounded-full" src={`https://picsum.photos/seed/${user.id}/100/100`} alt="Your avatar" />
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm font-semibold bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Logout
            </button>
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