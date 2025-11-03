import React, { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { updateProfile, uploadAvatar, getCarsForUser, addCar, updateCar, deleteCar, setDefaultCar } from '../services/profileService';
import { Car, PaymentMethodInfo } from '../types';
import CarFormModal from './CarFormModal';
import { DEFAULT_AVATAR_URL } from '../constants';

type PaymentMethodType = 'venmo' | 'zelle' | 'cashapp';

const VenmoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2 flex-shrink-0">
        <circle cx="12" cy="12" r="12" fill="#3D95CE"/>
        <path d="M11.9999 5.25C11.9999 5.25 8.24219 16.793 6.98438 18.75H9.89297L11.4586 16.5117C11.4586 16.5117 12.5625 10.3125 12.5625 10.3125C12.5625 10.3125 13.6266 16.4906 13.6266 16.4906L15.1523 18.75H17.5781C16.3203 16.793 11.9999 5.25 11.9999 5.25Z" fill="white"/>
    </svg>
);

const ZelleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2 flex-shrink-0">
        <circle cx="12" cy="12" r="12" fill="#6D3582"/>
        <path d="M7.5 7.5H16.5V9H10.5L16.5 15V16.5H7.5V15H13.5L7.5 9V7.5Z" fill="white"/>
    </svg>
);

const CashAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2 flex-shrink-0">
        <circle cx="12" cy="12" r="12" fill="#00D632"/>
        <path d="M12 6.5C10.65 6.5 9.5 7.65 9.5 9V9.5H8.5V11H9.5V13H8.5V14.5H9.5V15C9.5 16.35 10.65 17.5 12 17.5C13.35 17.5 14.5 16.35 14.5 15V14.5H15.5V13H14.5V11H15.5V9.5H14.5V9C14.5 7.65 13.35 6.5 12 6.5ZM11 8H13C13.55 8 14 8.45 14 9V15C14 15.55 13.55 16 13 16H11C10.45 16 10 15.55 10 15V9C10 8.45 10.45 8 11 8Z" fill="white"/>
        <path d="M12 5V6.5M12 17.5V19" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);


const paymentOptions: { id: PaymentMethodType, name: string, placeholder: string, icon: React.ReactElement }[] = [
    { id: 'venmo', name: 'Venmo', placeholder: 'Enter your Venmo username or link', icon: <VenmoIcon /> },
    { id: 'zelle', name: 'Zelle', placeholder: 'Enter your registered email or phone', icon: <ZelleIcon /> },
    { id: 'cashapp', name: 'Cash App', placeholder: 'Enter your $Cashtag or link', icon: <CashAppIcon /> },
];

const CarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.383 6.634A.5.5 0 0 1 19 7v9a3 3 0 0 1-6 0v-1h-4v1a3 3 0 0 1-6 0V7a.5.5 0 0 1 .617-.492L5 7.15V4.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v2.65l1.383-.617zM5.5 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm12 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
</svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944L12 22l9-1.056A12.02 12.02 0 0021 7.928a11.955 11.955 0 01-5.618-4.016z" /></svg>;
const ShieldExclamationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const VerifiedIcon = () => <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>;

const ProfileSettings: React.FC<{ backToApp: () => void }> = ({ backToApp }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Payment state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);

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
      setPaymentMethods(profile.payment_methods || []);
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
  
  const handlePhoneNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
    let formattedNumber = '';

    if (input.length > 0) {
      formattedNumber = `(${input.substring(0, 3)}`;
    }
    if (input.length >= 4) {
      formattedNumber += `) ${input.substring(3, 6)}`;
    }
    if (input.length >= 7) {
      formattedNumber += `-${input.substring(6, 10)}`;
    }
    setPhoneNumber(formattedNumber);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!fullName.trim() || !phoneNumber.trim()) {
      setError('Full name and phone number are required.');
      setSuccess('');
      return;
    }

    if (paymentMethods.some(pm => !pm.handle.trim())) {
      setError('Please fill in the details for all selected payment methods or remove them.');
      setSuccess('');
      return;
    }

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
        phone_number: phoneNumber,
        payment_methods: paymentMethods,
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
  
  const handleAddPaymentMethod = (method: PaymentMethodType) => {
    if (paymentMethods.length < 3 && !paymentMethods.some(pm => pm.method === method)) {
        setPaymentMethods(prev => [...prev, { method, handle: '' }]);
    }
  };

  const handleRemovePaymentMethod = (method: PaymentMethodType) => {
      setPaymentMethods(prev => prev.filter(pm => pm.method !== method));
  };

  const handlePaymentHandleChange = (method: PaymentMethodType, handle: string) => {
      setPaymentMethods(prev => prev.map(pm => pm.method === method ? { ...pm, handle } : pm));
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
  
  const renderPaymentSelection = () => {
    const selectedMethodsMap = new Map(paymentMethods.map(pm => [pm.method, pm.handle]));
    const canAddMore = paymentMethods.length < 3;

    return (
        <div className="p-4 bg-slate-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {paymentOptions.map(opt => {
                    const isSelected = selectedMethodsMap.has(opt.id);
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                                if (!isSelected) handleAddPaymentMethod(opt.id);
                            }}
                            className={`flex items-center justify-start p-3 rounded-lg border-2 text-left font-semibold transition-all ${
                                isSelected 
                                ? 'bg-blue-50 border-blue-500 cursor-default' 
                                : canAddMore 
                                    ? 'bg-white border-slate-300 hover:border-blue-400' 
                                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                            disabled={isSelected || !canAddMore}
                            title={!canAddMore && !isSelected ? "You can add up to 3 payment methods" : ""}
                        >
                             {opt.icon}
                             <span className="text-slate-800">{opt.name}</span>
                             {isSelected && <svg className="w-5 h-5 ml-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>}
                             {!isSelected && canAddMore && <span className="ml-auto text-xs font-bold text-blue-500">+ ADD</span>}
                        </button>
                    );
                })}
            </div>
            
            {paymentMethods.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                    {paymentMethods.map(pm => {
                        const option = paymentOptions.find(p => p.id === pm.method);
                        if (!option) return null;
                        return (
                            <div key={pm.method}>
                                <label className="flex items-center text-sm font-medium text-slate-600 capitalize">
                                    {option.icon}
                                    <span>{option.name}</span>
                                </label>
                                <div className="mt-1 flex items-center rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden bg-white">
                                    <input
                                        type="text"
                                        value={pm.handle}
                                        onChange={(e) => handlePaymentHandleChange(pm.method, e.target.value)}
                                        placeholder={option.placeholder}
                                        className="flex-auto w-full text-base bg-transparent sm:text-sm px-3 py-2 focus:outline-none"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePaymentMethod(pm.method)}
                                        className="flex-shrink-0 inline-flex items-center justify-center p-3 text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-slate-100 border-l border-slate-300 transition-colors"
                                        title={`Remove ${option.name}`}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

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
              src={avatarPreview || DEFAULT_AVATAR_URL} 
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
           {profile.is_verified_student ? (
                <p className="mt-1 text-sm text-green-600 flex items-center font-medium">
                    <VerifiedIcon /> Verified Student Email
                </p>
            ) : (
                <p className="mt-1 text-xs text-slate-500">Tip: Use a .edu email to get a verified badge.</p>
            )}
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
          <label htmlFor="phone-number" className="block text-sm font-medium text-slate-600">Phone Number</label>
          <div className="relative mt-1">
              <input
                type="tel"
                id="phone-number"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                maxLength={14}
                className={inputBaseClasses}
                placeholder="e.g., (123) 456-7890"
                required
              />
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-600">My Payment Methods</label>
            <div className="mt-2">
                {renderPaymentSelection()}
            </div>
            <p className="mt-2 text-xs text-slate-500 px-1">This will be shared with passengers to facilitate payment. Only share information you are comfortable with.</p>
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
                            <div className="flex items-center space-x-3 text-sm text-slate-500">
                                <span>{car.color} &middot; {car.license_plate}</span>
                                {car.is_insured ? (
                                    <span className="flex items-center text-green-600" title="Insured">
                                        <ShieldCheckIcon />
                                        <span className="text-xs font-medium ml-1">Insured</span>
                                    </span>
                                ) : (
                                     <span className="flex items-center text-amber-600" title="Not Insured">
                                        <ShieldExclamationIcon />
                                        <span className="text-xs font-medium ml-1">Not Insured</span>
                                    </span>
                                )}
                            </div>
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