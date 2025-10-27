import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { updateProfile, uploadAvatar } from '../services/profileService';

const ProfileSettings: React.FC<{ backToApp: () => void }> = ({ backToApp }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let avatarUrl = profile?.avatar_url;

      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id, avatarFile);
      }

      await updateProfile(user.id, { full_name: fullName, avatar_url: avatarUrl });
      await refreshProfile();
      setSuccess('Profile updated successfully!');

    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
      setAvatarFile(null);
    }
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }
  
  const inputBaseClasses = "mt-1 block w-full px-3 py-2 text-base bg-slate-50 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg";

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">My Profile</h2>
        <button onClick={backToApp} className="text-sm font-semibold text-blue-500 hover:underline">
          &larr; Back to App
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-600">Profile Picture</label>
          <div className="mt-2 flex items-center space-x-4">
            <img 
              src={avatarPreview || `https://picsum.photos/seed/${user?.id}/100/100`} 
              alt="Profile" 
              className="h-16 w-16 rounded-full object-cover bg-slate-200"
            />
            <label htmlFor="avatar-upload" className="cursor-pointer px-4 py-2 text-sm font-semibold bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
              Change Photo
            </label>
            <input id="avatar-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleAvatarChange} />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-600">Email</label>
          <input
            type="email"
            id="email"
            value={user?.email || ''}
            disabled
            className={`${inputBaseClasses} bg-slate-100 cursor-not-allowed`}
          />
        </div>

        <div>
          <label htmlFor="full-name" className="block text-sm font-medium text-slate-600">Full Name</label>
          <input
            type="text"
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputBaseClasses}
            placeholder="Your full name"
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading} className="flex justify-center py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
