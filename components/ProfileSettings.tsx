import React, { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { updateProfile, uploadAvatar, getCarsForUser, addCar, updateCar, deleteCar, setDefaultCar } from '../services/profileService';
import { Car } from '../types';
import CarFormModal from './CarFormModal';

const CarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v7a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2zm-1 3V4a1 1 0 112 0v1h-2zM6 8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>;

const ProfileSettings: React.FC<{ backToApp: () => void }> = ({ backToApp }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Car state
  const [cars, setCars] = useState<Car[]>([]);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [carToEdit, setCarToEdit] = useState<Car | null>(null);

  const fetchCars = useCallback(async () => {
    if (user) {
      const userCars = await getCarsForUser(user.id);
      setCars(userCars);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');
      setAvatarPreview(profile.avatar_url || null);
    }
    fetchCars();
  }, [profile, fetchCars]);

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

      await updateProfile(user.id, { 
        full_name: fullName, 
        avatar_url: avatarUrl, 
        phone_number: phoneNumber 
      });
      await refreshProfile();
      setSuccess('Profile updated successfully!');

    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
      setAvatarFile(null);
    }
  };

  const handleCarSubmit = async (carData: Omit<Car, 'id' | 'owner_id' | 'is_default'>) => {
    try {
      if (carToEdit) {
        await updateCar(carToEdit.id, carData);
      } else {
        await addCar(carData);
      }
      await fetchCars();
      setIsCarModalOpen(false);
      setCarToEdit(null);
    } catch (err: any) {
      const action = carToEdit ? 'updating' : 'adding';
      // The service layer now throws a standard Error object, so we can safely access err.message
      alert(`Error ${action} car: ${err.message || 'An unknown error occurred.'}`);
    }
  };
  
  const handleSetDefault = async (carId: string) => {
    try {
        await setDefaultCar(carId);
        await fetchCars();
    } catch (err: any) {
        alert(err.message || 'Failed to set default car.');
    }
  };
  
  const handleDeleteCar = async (carId: string) => {
    if (window.confirm('Are you sure you want to delete this car?')) {
        try {
            await deleteCar(carId);
            await fetchCars();
        } catch (err: any) {
            alert(err.message || 'Failed to delete car.');
        }
    }
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }
  
  const inputBaseClasses = "mt-1 block w-full px-3 py-2 text-base bg-slate-50 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg";

  return (
    <>
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
        
        <div>
          <label htmlFor="phone-number" className="block text-sm font-medium text-slate-600">Phone Number (Optional)</label>
          <input
            type="tel"
            id="phone-number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className={inputBaseClasses}
            placeholder="e.g., (123) 456-7890"
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

      {/* Rating Section */}
      <div className="border-t border-slate-200 mt-6 pt-6">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">My Rating</h3>
        <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-center text-center">
          {profile.rating_count > 0 ? (
            <div className="flex items-center space-x-2">
               <svg className="w-5 h-5 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
              <p className="text-lg font-semibold text-slate-800">{profile.average_rating.toFixed(1)}</p>
              <p className="text-slate-500">({profile.rating_count} {profile.rating_count === 1 ? 'rating' : 'ratings'})</p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">You haven't received any ratings yet.</p>
          )}
        </div>
      </div>
      
      {/* Car Management Section */}
      <div className="border-t border-slate-200 mt-6 pt-6">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">My Cars</h3>
        <div className="space-y-3">
            {cars.map(car => (
                <div key={car.id} className="bg-slate-50 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <CarIcon />
                        <div>
                            <p className="font-semibold text-slate-800">{car.year} {car.make} {car.model}</p>
                            <p className="text-sm text-slate-500">{car.color} &middot; {car.license_plate}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {car.is_default ? (
                            <span className="text-xs font-bold text-green-600 px-2 py-0.5 bg-green-100 rounded-full">Default</span>
                        ) : (
                            <button onClick={() => handleSetDefault(car.id)} className="text-xs font-semibold text-blue-600 hover:underline">Set as default</button>
                        )}
                         <button onClick={() => { setCarToEdit(car); setIsCarModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded-md"><EditIcon /></button>
                         <button onClick={() => handleDeleteCar(car.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-200 rounded-md"><TrashIcon /></button>
                    </div>
                </div>
            ))}
             {cars.length === 0 && <p className="text-slate-500 text-sm text-center py-4">You haven't added any cars yet.</p>}
        </div>
        <div className="mt-4">
            <button onClick={() => { setCarToEdit(null); setIsCarModalOpen(true); }} className="w-full text-center py-2.5 px-4 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                Add New Car
            </button>
        </div>
      </div>
    </div>
    <CarFormModal 
        isOpen={isCarModalOpen}
        onClose={() => setIsCarModalOpen(false)}
        onSubmit={handleCarSubmit}
        carToEdit={carToEdit}
    />
    </>
  );
};

export default ProfileSettings;