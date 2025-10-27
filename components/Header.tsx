import React from 'react';
import { useAuth } from '../providers/AuthProvider';

const Header: React.FC = () => {
  const { user, signOut, openAuthModal } = useAuth();

  return (
    <header className="text-center relative">
      <div className="absolute top-0 right-0">
        {user ? (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 hidden sm:inline">{user.email}</span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm font-semibold bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Login / Sign Up
          </button>
        )}
      </div>
      <div className="pt-12 md:pt-0">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
          Go<span className="text-blue-600">Together</span>
        </h1>
        <p className="mt-2 text-lg text-gray-500">Your friendly ridesharing community.</p>
      </div>
    </header>
  );
};

export default Header;