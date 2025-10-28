import React from 'react';
import { Driver } from '../types';

interface ProfileModalProps {
  profile: Driver | null;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onClose }) => {
  if (!profile) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xs relative text-center p-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <img
          src={profile.avatar_url || `https://picsum.photos/seed/${profile.id}/100/100`}
          alt={profile.name}
          className="h-24 w-24 rounded-full object-cover mx-auto mb-4 border-4 border-slate-100"
        />

        <h3 className="text-xl font-bold text-slate-800">{profile.name}</h3>

        <div className="mt-2 flex items-center justify-center">
          {profile.rating_count > 0 ? (
            <>
              <svg className="w-5 h-5 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
              <p className="ml-1 text-md text-slate-600">{profile.average_rating.toFixed(1)} Rating ({profile.rating_count} {profile.rating_count === 1 ? 'review' : 'reviews'})</p>
            </>
          ) : (
            <p className="ml-1 text-md text-slate-600">No ratings</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;