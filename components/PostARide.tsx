import React, { useState, FormEvent, ChangeEvent, useEffect, useMemo } from 'react';
import { Ride, Car, CarInfo, PaymentMethodInfo } from '../types';
import { LOCATIONS } from '../constants';
import { getCarsForUser, updateProfile, addCar } from '../services/profileService';
import { useAuth } from '../providers/AuthProvider';

interface PostARideProps {
  onPostRide: (newRide: Omit<Ride, 'id' | 'driver' | 'passengers' | 'status' | 'ratings'>) => Promise<boolean>;
  onPostRideSuccess: (success: boolean) => void;
}

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


type PaymentMethodType = 'venmo' | 'zelle' | 'cashapp';

const paymentOptions: { id: PaymentMethodType, name: string, placeholder: string, icon: React.ReactElement }[] = [
    { id: 'venmo', name: 'Venmo', placeholder: 'Enter your Venmo username or link', icon: <VenmoIcon /> },
    { id: 'zelle', name: 'Zelle', placeholder: 'Enter your registered email or phone', icon: <ZelleIcon /> },
    { id: 'cashapp', name: 'Cash App', placeholder: 'Enter your $Cashtag or link', icon: <CashAppIcon /> },
];


const PostARide: React.FC<PostARideProps> = ({ onPostRide, onPostRideSuccess }) => {
  const { user, profile, refreshProfile } = useAuth();
  
  const getTodayLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureDate, setDepartureDate] = useState(getTodayLocal);
  const [departureTimeValue, setDepartureTimeValue] = useState('');
  const [seatsAvailable, setSeatsAvailable] = useState(1);
  const [price, setPrice] = useState(10);
  const [isFree, setIsFree] = useState(false);
  
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarOption, setSelectedCarOption] = useState('');
  const [customCar, setCustomCar] = useState<CarInfo>({ make: '', model: '', year: new Date().getFullYear(), color: '', license_plate: '', is_insured: false });
  const [saveCustomCar, setSaveCustomCar] = useState(true);

  // Payment State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [forceEditPayments, setForceEditPayments] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasSavedMethods = useMemo(() => profile?.payment_methods && profile.payment_methods.length > 0, [profile]);
  const showPaymentEditor = !hasSavedMethods || forceEditPayments;
  
  const handleCancelEditPayments = () => {
    setForceEditPayments(false);
    if (profile?.payment_methods) {
        setPaymentMethods(profile.payment_methods);
    }
  };

  useEffect(() => {
    const fetchUserCars = async () => {
        if (!user) return;
        const userCars = await getCarsForUser(user.id);
        setCars(userCars);
        const defaultCar = userCars.find(c => c.is_default);
        if (defaultCar) {
            setSelectedCarOption(defaultCar.id);
        } else if (userCars.length > 0) {
            setSelectedCarOption(userCars[0].id);
        } else {
            setSelectedCarOption('custom');
        }
    };
    fetchUserCars();
  }, [user]);

  useEffect(() => {
    if (profile?.payment_methods) {
        setPaymentMethods(profile.payment_methods);
    }
  }, [profile]);
  
  const timeOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        const date = new Date();
        date.setHours(h, m);
        const displayTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const valueTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        options.push({ value: valueTime, label: displayTime });
      }
    }
    return options;
  }, []);

  const filteredTimeOptions = useMemo(() => {
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    if (departureDate !== todayLocal) {
      return timeOptions;
    }

    // Calculate the total number of minutes that have passed today.
    const totalMinutesPassed = now.getHours() * 60 + now.getMinutes();
    
    // Find the index of the current 5-minute interval, and add 1 to get the next one.
    // This ensures we always offer a time in the future.
    const nextIntervalIndex = Math.floor(totalMinutesPassed / 5) + 1;
    
    // Calculate the minutes for the start of the next interval.
    const nextIntervalTotalMinutes = nextIntervalIndex * 5;
    
    const nextAvailableHour = Math.floor(nextIntervalTotalMinutes / 60);
    const nextAvailableMinute = nextIntervalTotalMinutes % 60;
    
    // If the next available time is on the next day, there are no more slots for today.
    if (nextAvailableHour >= 24) {
        return [];
    }

    const firstAvailableTime = `${nextAvailableHour.toString().padStart(2, '0')}:${nextAvailableMinute.toString().padStart(2, '0')}`;

    return timeOptions.filter(option => option.value >= firstAvailableTime);
  }, [departureDate, timeOptions]);

  useEffect(() => {
    const isValidTimeSelected = filteredTimeOptions.some(option => option.value === departureTimeValue);
    if (!isValidTimeSelected) {
      setDepartureTimeValue(filteredTimeOptions.length > 0 ? filteredTimeOptions[0].value : '');
    }
  }, [departureDate, filteredTimeOptions, departureTimeValue]);

  const clearForm = () => {
    setFrom('');
    setTo('');
    setDepartureDate(getTodayLocal());
    setDepartureTimeValue('');
    setSeatsAvailable(1);
    setPrice(10);
    setIsFree(false);
    setError('');
    setSaveCustomCar(true);
    setForceEditPayments(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading || !user || !profile) return;
    
    setError('');
    setSuccess('');

    if (!from || !to || !departureDate || !departureTimeValue) {
        setError('Please fill out all trip details.');
        return;
    }
    if (from === to) {
        setError('Start and end locations cannot be the same.');
        return;
    }

    if (!isFree && paymentMethods.some(pm => !pm.handle.trim())) {
        setError('Please fill in the details for all selected payment methods.');
        return;
    }
     if (!isFree && paymentMethods.length === 0) {
        setError('Please add at least one payment method.');
        return;
    }

    let carInfo: CarInfo | undefined;
    if (selectedCarOption === 'custom') {
        const { make, model, license_plate } = customCar;
        if (!make || !model || !license_plate) {
            setError('Please fill out all required (*) vehicle details.');
            return;
        }
        carInfo = {
            ...customCar,
            year: customCar.year && !isNaN(customCar.year) ? customCar.year : undefined,
            color: customCar.color || undefined
        };
    } else {
        const selectedCar = cars.find(c => c.id === selectedCarOption);
        if (!selectedCar) {
            setError('Please select a vehicle for this ride.');
            return;
        }
        carInfo = selectedCar;
    }

    setIsLoading(true);

    try {
        const originalMethods = profile.payment_methods || [];
        const methodsChanged =
          originalMethods.length !== paymentMethods.length ||
          !originalMethods.every(om =>
            paymentMethods.some(pm => pm.method === om.method && pm.handle === om.handle)
          );

        if (methodsChanged) {
            await updateProfile(user.id, {
                // Pass existing values to avoid overwriting them with null
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                phone_number: profile.phone_number,
                payment_methods: isFree ? [] : paymentMethods,
            });
            await refreshProfile(); // Refresh context
        }

        if (selectedCarOption === 'custom' && saveCustomCar) {
            const savedCar = await addCar(customCar);
            setCars(prev => [...prev, savedCar]);
            setSelectedCarOption(savedCar.id);
            carInfo = savedCar;
        }

        const ridePosted = await onPostRide({
          from,
          to,
          departureTime: new Date(`${departureDate}T${departureTimeValue}`),
          seatsAvailable,
          price,
          car: carInfo,
        });
        
        if (ridePosted) {
          setSuccess('Ride posted successfully!');
          clearForm();
          setTimeout(() => onPostRideSuccess(true), 1000);
        }
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleFreeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsFree(checked);
    if (checked) {
      setPrice(0);
    } else {
      setPrice(10);
    }
  };
  
  const handleCustomCarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCustomCar(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : name === 'year' ? parseInt(value, 10) : value }));
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

  const inputBaseClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-50 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg disabled:bg-slate-200 disabled:cursor-not-allowed";

  const renderCarFields = () => (
    <div className="p-4 bg-slate-50/80 rounded-lg mt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-slate-500">Make <span className="text-red-500">*</span></label><input type="text" name="make" value={customCar.make} onChange={handleCustomCarChange} className={inputBaseClasses} required /></div>
            <div><label className="block text-xs font-medium text-slate-500">Model <span className="text-red-500">*</span></label><input type="text" name="model" value={customCar.model} onChange={handleCustomCarChange} className={inputBaseClasses} required /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-slate-500">Year</label><input type="number" name="year" value={customCar.year} onChange={handleCustomCarChange} className={inputBaseClasses} /></div>
            <div><label className="block text-xs font-medium text-slate-500">Color</label><input type="text" name="color" value={customCar.color} onChange={handleCustomCarChange} className={inputBaseClasses} /></div>
            <div><label className="block text-xs font-medium text-slate-500">License Plate <span className="text-red-500">*</span></label><input type="text" name="license_plate" value={customCar.license_plate} onChange={handleCustomCarChange} className={inputBaseClasses} required /></div>
        </div>
        <div className="flex items-center">
            <input
                id="custom_car_is_insured"
                name="is_insured"
                type="checkbox"
                checked={customCar.is_insured}
                onChange={handleCustomCarChange}
                className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="custom_car_is_insured" className="ml-3 block text-sm font-medium text-slate-700">
                Is this car insured?
            </label>
        </div>
         <div className="flex items-center pt-2">
            <input
                id="save_custom_car"
                name="save_custom_car"
                type="checkbox"
                checked={saveCustomCar}
                onChange={(e) => setSaveCustomCar(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="save_custom_car" className="ml-3 block text-sm font-medium text-slate-700">
                Save this vehicle for future use
            </label>
        </div>
    </div>
  );

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
                                <div className="mt-1 flex">
                                    <input
                                        type="text"
                                        value={pm.handle}
                                        onChange={(e) => handlePaymentHandleChange(pm.method, e.target.value)}
                                        placeholder={option.placeholder}
                                        className="block w-full text-base bg-white border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-l-lg"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePaymentMethod(pm.method)}
                                        className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-semibold"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                     <p className="text-xs text-slate-500 px-1">Changes here will update your profile and be saved for future rides.</p>
                </div>
            )}
            {hasSavedMethods && forceEditPayments && (
                <div className={`pt-4 ${paymentMethods.length > 0 ? 'border-t border-slate-200' : ''} flex justify-end`}>
                    <button
                        type="button"
                        onClick={handleCancelEditPayments}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        Use Saved Methods
                    </button>
                </div>
            )}
        </div>
    );
};

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Post a Ride</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ride Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="post-from" className="block text-sm font-medium text-slate-600">From</label>
            <select id="post-from" value={from} onChange={(e) => setFrom(e.target.value)} className={inputBaseClasses} required>
              <option value="" disabled>Select a location</option>
              {LOCATIONS.map(loc => <option key={`from-${loc}`} value={loc} disabled={loc === to}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="post-to" className="block text-sm font-medium text-slate-600">To</label>
            <select id="post-to" value={to} onChange={(e) => setTo(e.target.value)} className={inputBaseClasses} required>
              <option value="" disabled>Select a location</option>
              {LOCATIONS.map(loc => <option key={`to-${loc}`} value={loc} disabled={loc === from}>{loc}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
          <div className="col-span-1">
            <label htmlFor="departure-date" className="block text-sm font-medium text-slate-600">Date</label>
            <input type="date" id="departure-date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className={`${inputBaseClasses} py-[7px]`} min={getTodayLocal()} required />
          </div>
          <div className="col-span-1">
            <label htmlFor="departure-time-select" className="block text-sm font-medium text-slate-600">Time</label>
            <select id="departure-time-select" value={departureTimeValue} onChange={(e) => setDepartureTimeValue(e.target.value)} className={inputBaseClasses} required>
              <option value="" disabled>Select time</option>
              {filteredTimeOptions.length > 0 ? (
                filteredTimeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
              ) : (
                <option value="" disabled>No times available today</option>
              )}
            </select>
          </div>
          <div className="col-span-1">
            <label htmlFor="seats" className="block text-sm font-medium text-slate-600">Seats</label>
            <input type="number" id="seats" value={seatsAvailable} onChange={(e) => setSeatsAvailable(Math.max(1, parseInt(e.target.value, 10)))} min="1" max="8" className={`${inputBaseClasses} py-[7px]`} />
          </div>
          <div className="col-span-1">
             <div className="flex justify-between items-center">
              <label htmlFor="price" className="block text-sm font-medium text-slate-600">Est. Price per Seat ($)</label>
              <div className="flex items-center">
                <input id="is-free" name="is-free" type="checkbox" checked={isFree} onChange={handleFreeChange} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <label htmlFor="is-free" className="ml-2 block text-sm font-medium text-slate-700">Free</label>
              </div>
            </div>
            <input type="number" id="price" value={price} onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value, 10)))} min="0" disabled={isFree} className={`${inputBaseClasses} py-[7px]`} />
          </div>
        </div>

        {/* Payment Details */}
        {!isFree && (
            <div>
                <h3 className="text-md font-semibold text-slate-700">
                    {showPaymentEditor ? '💰 How do you want passengers to send you the fare?' : '💰 Payment Methods'}
                </h3>
                <div className="mt-2">
                    {showPaymentEditor ? (
                        renderPaymentSelection()
                    ) : (
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-600 mb-3">Using your saved payment methods:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {profile?.payment_methods?.map(pm => {
                                            const option = paymentOptions.find(p => p.id === pm.method);
                                            if (!option) return null;
                                            return (
                                                <div key={pm.method} className="flex items-center p-2 bg-white rounded-md border border-slate-200">
                                                    {option.icon}
                                                    <span className="font-semibold text-slate-700">{option.name}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <button type="button" onClick={() => setForceEditPayments(true)} className="text-sm font-semibold text-blue-500 hover:underline flex-shrink-0 ml-4">
                                    Edit
                                </button>
                            </div>
                             <p className="text-xs text-slate-500 mt-3">Passengers can view these after their request is accepted.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Vehicle Details */}
        <div>
            <label htmlFor="car-select" className="block text-sm font-medium text-slate-600">Vehicle</label>
            {cars.length > 0 ? (
                <select id="car-select" value={selectedCarOption} onChange={(e) => setSelectedCarOption(e.target.value)} className={inputBaseClasses}>
                    {cars.map(car => <option key={car.id} value={car.id}>{car.year} {car.make} {car.model} ({car.license_plate})</option>)}
                    <option value="custom">Use a different car...</option>
                </select>
            ) : <p className="text-sm text-slate-500 mt-1">Add vehicle details for this ride below.</p>}
            
            {selectedCarOption === 'custom' && renderCarFields()}
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}
        
        <div className="pt-4">
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
            {isLoading ? 'Posting...' : 'Post Ride'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostARide;