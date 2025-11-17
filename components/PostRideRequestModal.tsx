import React, { useState, FormEvent, useEffect, useMemo } from 'react';
import { PassengerRideRequest } from '../types';
import { LOCATIONS } from '../constants';
import { addPassengerRideRequest } from '../services/rideService';
import { useNotification } from '../providers/NotificationProvider';
import { useAuth } from '../providers/AuthProvider';

interface PostRideRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any | null;
  onSaveForLogin?: (data: any) => void;
}

const PostRideRequestModal: React.FC<PostRideRequestModalProps> = ({ isOpen, onClose, onSuccess, initialData, onSaveForLogin }) => {
  const { user, openAuthModal } = useAuth();
  const { showNotification } = useNotification();
  
  const getTodayLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureDate, setDepartureDate] = useState(getTodayLocal());
  const [flexibleTime, setFlexibleTime] = useState('Anytime');
  const [specificTime, setSpecificTime] = useState('');
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [notes, setNotes] = useState('');
  const [willingToSplitFuel, setWillingToSplitFuel] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const dataToLoad = initialData || {};
      setFrom(dataToLoad.from || '');
      setTo(dataToLoad.to || '');
      setDepartureDate(dataToLoad.departureDate || getTodayLocal());
      setFlexibleTime(dataToLoad.flexibleTime || 'Anytime');
      setSpecificTime(dataToLoad.specificTime || '');
      setSeatsNeeded(dataToLoad.seatsNeeded || 1);
      setNotes(dataToLoad.notes || '');
      setWillingToSplitFuel(dataToLoad.willingToSplitFuel || false);
      setError('');
      setIsLoading(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setError('');

    if (from === to) {
        setError('Start and end locations cannot be the same.');
        return;
    }
    
    if (flexibleTime === 'Specific Time...' && !specificTime) {
      setError('Please enter a specific time.');
      return;
    }

    const formatTime = (time24: string): string => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours, 10);
        const m = parseInt(minutes, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 === 0 ? 12 : h % 12;
        const formattedMinutes = m.toString().padStart(2, '0');
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    };

    const finalFlexibleTime = flexibleTime === 'Specific Time...' ? formatTime(specificTime) : flexibleTime;

    const requestFormData = {
        from,
        to,
        departureDate,
        flexibleTime,
        specificTime,
        seatsNeeded,
        notes,
        willingToSplitFuel,
    };
    
    const requestPayload = {
        from,
        to,
        departureDate: new Date(departureDate.replace(/-/g, '/')),
        flexibleTime: finalFlexibleTime,
        seatsNeeded,
        notes,
        willingToSplitFuel,
    };

    if (user) {
        setIsLoading(true);
        try {
            await addPassengerRideRequest(requestPayload);
            showNotification({ type: 'success', message: 'Your ride request has been posted!' });
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    } else {
        if (onSaveForLogin) {
            onSaveForLogin(requestFormData);
        }
        openAuthModal();
    }
  };
  
  const inputBaseClasses = "mt-1 block w-full pl-3 py-2 text-base bg-slate-50 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg";
  const timePreferences = ['Morning (6am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-10pm)', 'Anytime', 'Specific Time...'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Post a Ride Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="req-from" className="block text-sm font-medium text-slate-600">From</label>
                    <select id="req-from" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputBaseClasses} pr-10`} required>
                    <option value="" disabled>Select a location</option>
                    {LOCATIONS.map(loc => <option key={`from-${loc}`} value={loc} disabled={loc === to}>{loc}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="req-to" className="block text-sm font-medium text-slate-600">To</label>
                    <select id="req-to" value={to} onChange={(e) => setTo(e.target.value)} className={`${inputBaseClasses} pr-10`} required>
                    <option value="" disabled>Select a location</option>
                    {LOCATIONS.map(loc => <option key={`to-${loc}`} value={loc} disabled={loc === from}>{loc}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="req-date" className="block text-sm font-medium text-slate-600">Date</label>
                    <input type="date" id="req-date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className={`${inputBaseClasses} pr-4 py-[7px]`} min={getTodayLocal()} required />
                </div>
                 <div>
                    <label htmlFor="req-time" className="block text-sm font-medium text-slate-600">Time Preference</label>
                    <select id="req-time" value={flexibleTime} onChange={(e) => setFlexibleTime(e.target.value)} className={`${inputBaseClasses} pr-10`} required>
                        {timePreferences.map(time => <option key={time} value={time}>{time}</option>)}
                    </select>
                     {flexibleTime === 'Specific Time...' && (
                        <input
                            type="time"
                            id="specific-time"
                            value={specificTime}
                            onChange={(e) => setSpecificTime(e.target.value)}
                            className={`${inputBaseClasses} mt-2 py-[7px]`}
                            required
                        />
                    )}
                </div>
                <div>
                    <label htmlFor="req-seats" className="block text-sm font-medium text-slate-600">Seats Needed</label>
                    <input type="number" id="req-seats" value={seatsNeeded} onChange={(e) => setSeatsNeeded(Math.max(1, parseInt(e.target.value, 10)))} min="1" max="8" className={`${inputBaseClasses} pr-4 py-[7px]`} />
                </div>
            </div>

            <div>
                <label htmlFor="req-notes" className="block text-sm font-medium text-slate-600">Optional Notes</label>
                <textarea
                    id="req-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${inputBaseClasses} pr-3`}
                    rows={2}
                    placeholder="e.g., I have one large suitcase."
                />
            </div>

            <div>
                <div className="flex items-center">
                    <input
                        id="req-split-fuel"
                        name="req-split-fuel"
                        type="checkbox"
                        checked={willingToSplitFuel}
                        onChange={(e) => setWillingToSplitFuel(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="req-split-fuel" className="ml-3 block text-sm font-medium text-slate-700">
                        Willing to split fuel costs
                    </label>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={onClose} disabled={isLoading} className="px-5 py-2 text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50">
                    Cancel
                </button>
                <button type="submit" disabled={isLoading} className="px-5 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300">
                    {isLoading ? 'Posting...' : 'Post Request'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default PostRideRequestModal;