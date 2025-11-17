import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { PassengerRideRequest, Driver, Request, Ride, RideStatus, RequestStatus, Car } from '../types';
import { useAuth } from '../providers/AuthProvider';
import ProfileModal from './ProfileModal';
import { DEFAULT_AVATAR_URL } from '../constants';
import { createRideFromRequest } from '../services/rideService';
import { getCarsForUser } from '../services/profileService';
import { useNotification } from '../providers/NotificationProvider';

interface PassengerRideRequestCardProps {
  request: PassengerRideRequest;
  refreshData: () => void;
  onRequestFulfilled?: (request: Request) => void;
}

const VerifiedBadge: React.FC<{className?: string}> = ({className}) => (
    <span className={`ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ${className}`} title="Verified Student (.edu email)">
        <svg className="w-4 h-4 mr-0.5 -ml-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
        Verified
    </span>
);

const StatusBadge: React.FC<{ status: 'open' | 'fulfilled' | 'cancelled' | 'pending-passenger-approval' }> = ({ status }) => {
  const baseClasses = "px-3 py-1.5 text-sm font-semibold rounded-full capitalize cursor-default whitespace-nowrap";
  const statusClasses = {
    'open': "bg-blue-100 text-blue-800",
    'fulfilled': "bg-green-100 text-green-800",
    'cancelled': "bg-slate-100 text-slate-800",
    'pending-passenger-approval': "bg-purple-100 text-purple-800",
  };
  const statusText = status === 'open' ? 'Searching' : status.replace(/-/g, ' ');
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{statusText}</span>;
};

// --- Fulfill Request Modal ---
interface FulfillRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: PassengerRideRequest;
    onSuccess: () => void;
}

const FulfillRequestModal: React.FC<FulfillRequestModalProps> = ({ isOpen, onClose, request, onSuccess }) => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [departureTimeValue, setDepartureTimeValue] = useState('12:00');
    const [price, setPrice] = useState(10);
    const [cars, setCars] = useState<Car[]>([]);
    const [selectedCarId, setSelectedCarId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen || !user) return;
    
        const timeRegex = /(\d{1,2}):(\d{2})\s?(AM|PM)/i;
        const match = request.flexibleTime.match(timeRegex);
    
        if (match) {
            let hours = parseInt(match[1], 10);
            let minutes = parseInt(match[2], 10);
            const modifier = match[3].toUpperCase();
    
            if (modifier === 'PM' && hours < 12) {
                hours += 12;
            }
            if (modifier === 'AM' && hours === 12) { // 12 AM is 00 hours
                hours = 0;
            }

            // Round minutes to the nearest 15-minute interval to match the dropdown options
            const roundedMinutes = Math.round(minutes / 15) * 15;
            
            if (roundedMinutes === 60) {
                hours = (hours + 1) % 24; // Increment hour and wrap around if it becomes 24
                minutes = 0;
            } else {
                minutes = roundedMinutes;
            }
            
            const time24h = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            setDepartureTimeValue(time24h);

        } else if (request.flexibleTime === 'Morning (6am-12pm)') {
            setDepartureTimeValue('06:00');
        } else if (request.flexibleTime === 'Afternoon (12pm-5pm)') {
            setDepartureTimeValue('12:00');
        } else if (request.flexibleTime === 'Evening (5pm-10pm)') {
            setDepartureTimeValue('17:00');
        } else { // This handles 'Anytime'
            setDepartureTimeValue('12:00');
        }
    
        const fetchUserCars = async () => {
            const userCars = await getCarsForUser(user.id);
            setCars(userCars);
            const defaultCar = userCars.find(c => c.is_default) || userCars[0];
            if (defaultCar) {
                setSelectedCarId(defaultCar.id);
            }
        };
        fetchUserCars();
    }, [isOpen, user, request.flexibleTime]);

    const timeOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 15) {
                const date = new Date();
                date.setHours(h, m);
                const displayTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const valueTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                options.push({ value: valueTime, label: displayTime });
            }
        }
        return options;
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedCarId) {
            setError('You must select a car. Please add one in your profile if you have none.');
            return;
        }
        setIsLoading(true);
        setError('');

        const departureDateTime = new Date(request.departureDate);
        const [hours, minutes] = departureTimeValue.split(':').map(Number);
        departureDateTime.setHours(hours, minutes, 0, 0);

        try {
            await createRideFromRequest({
                requestId: request.id,
                departureTime: departureDateTime,
                price: price,
                carId: selectedCarId,
            });
            showNotification({ type: 'success', message: 'Offer sent! The passenger has been notified.' });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;
    
    const inputBaseClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-50 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative p-8" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h2 className="text-2xl font-semibold text-slate-800">Fulfill Ride Request</h2>
                <p className="text-sm text-slate-500 mt-1">Set the details for your ride from <span className="font-semibold">{request.from}</span> to <span className="font-semibold">{request.to}</span>.</p>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="departure-time-select" className="block text-sm font-medium text-slate-600">Departure Time</label>
                            <select id="departure-time-select" value={departureTimeValue} onChange={(e) => setDepartureTimeValue(e.target.value)} className={inputBaseClasses} required>
                                {timeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-slate-600">Price per Seat ($)</label>
                            <input type="number" id="price" value={price} onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value, 10)))} min="0" className={`${inputBaseClasses} py-[7px]`} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="car-select" className="block text-sm font-medium text-slate-600">Vehicle</label>
                        {cars.length > 0 ? (
                            <select id="car-select" value={selectedCarId} onChange={(e) => setSelectedCarId(e.target.value)} className={inputBaseClasses} required>
                                <option value="" disabled>Select a vehicle</option>
                                {cars.map(car => <option key={car.id} value={car.id}>{car.year} {car.make} {car.model} ({car.license_plate})</option>)}
                            </select>
                        ) : (
                           <div className="mt-1 text-center p-4 bg-slate-100 rounded-lg text-sm text-slate-600">
                             You have no cars saved. Please add a car in your profile settings.
                           </div>
                        )}
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} disabled={isLoading} className="px-5 py-2 text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading || !selectedCarId} className="px-5 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed">
                            {isLoading ? 'Sending Offer...' : 'Send Offer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const PassengerRideRequestCard: React.FC<PassengerRideRequestCardProps> = ({ request, refreshData, onRequestFulfilled }) => {
  const { user, profile: driverProfile, openAuthModal } = useAuth();
  const { from, to, departureDate, flexibleTime, seatsNeeded, passenger, notes, willingToSplitFuel, status, fulfilled_by } = request;
  const [viewingProfile, setViewingProfile] = useState<Driver | null>(null);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);

  const formattedDate = departureDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const passengerAvatar = passenger.avatar_url || DEFAULT_AVATAR_URL;
  const isOwnRequest = user?.id === passenger.id;
  
  const getCardStyleClasses = () => {
    if (status === 'fulfilled' || status === 'cancelled') {
      return 'grayscale opacity-75';
    }
    
    // Get YYYY-MM-DD string for today in local timezone for robust comparison
    const today = new Date();
    const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    // Get YYYY-MM-DD string for the request date
    const requestDateStr = departureDate.toISOString().split('T')[0];
    
    const isPast = requestDateStr < todayStr;

    if (isPast && status === 'open') {
       return 'grayscale opacity-70';
    }
    return '';
  };

  const handlePassengerProfileClick = () => {
    // Never show passenger contact info from a public request card.
    setViewingProfile({ ...passenger, phone_number: null });
  };
  
  const handleFulfilledByProfileClick = () => {
    if (!fulfilled_by) return;
    // Only the passenger who made the request can see the driver's contact info.
    if (isOwnRequest) {
      setViewingProfile(fulfilled_by);
    } else {
      setViewingProfile({ ...fulfilled_by, phone_number: null });
    }
  };


  return (
    <>
      <div className={`relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/80 divide-y divide-slate-100 ${getCardStyleClasses()}`}>
        <div className="absolute top-4 left-6">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                REQUEST
            </span>
        </div>
        <div className="p-6 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="flex items-center space-x-4">
               <div className="text-center w-20">
                    <div className="text-lg font-semibold text-teal-600">{flexibleTime}</div>
                    <div className="text-xs text-slate-500">{formattedDate}</div>
                </div>
              <div className="border-l border-slate-200 pl-4">
                <p className="font-bold text-xl text-slate-800">{from}</p>
                <p className="text-slate-500 text-sm">to</p>
                <p className="font-bold text-xl text-slate-800">{to}</p>
                {notes && <p className="text-sm text-slate-500 mt-1 italic">Note: {notes}</p>}
              </div>
            </div>

            <div className="w-full md:w-auto mt-4 md:mt-0 flex flex-row md:flex-col items-center justify-between md:items-end">
               <div className="w-24 text-right md:text-center md:mb-4">
                  <p className="text-3xl font-bold text-teal-600">{seatsNeeded}</p>
                  <p className="text-sm text-slate-500 -mt-1">{seatsNeeded === 1 ? 'seat needed' : 'seats needed'}</p>
               </div>
               {isOwnRequest ? (
                    <StatusBadge status={status} />
               ) : status === 'fulfilled' || status === 'pending-passenger-approval' ? (
                    <span className="px-5 py-2 rounded-full font-semibold whitespace-nowrap text-sm bg-slate-100 text-slate-800 cursor-default">
                        Fulfilled
                    </span>
               ) : (
                    <button 
                        onClick={() => user ? setIsFulfillModalOpen(true) : openAuthModal()}
                        className="px-5 py-2 rounded-full font-semibold whitespace-nowrap text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-wait"
                    >
                        Accept Request
                    </button>
               )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 rounded-b-2xl">
            <div className="flex justify-between items-center">
                {status === 'fulfilled' && fulfilled_by ? (
                    <button
                        type="button"
                        onClick={handleFulfilledByProfileClick}
                        className="flex items-center space-x-3 text-left p-1 -m-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-100"
                    >
                        <img className="h-10 w-10 rounded-full object-cover" src={fulfilled_by.avatar_url || DEFAULT_AVATAR_URL} alt={`Driver ${fulfilled_by.name}`} />
                        <div>
                            <p className="text-xs text-slate-500 -mb-0.5">Fulfilled by</p>
                            <div className="flex items-center">
                                <p className="text-sm font-medium text-slate-900">{fulfilled_by.name}</p>
                                {fulfilled_by.is_verified_student && <VerifiedBadge />}
                            </div>
                        </div>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handlePassengerProfileClick}
                        disabled={isOwnRequest}
                        className="flex items-center space-x-3 text-left p-1 -m-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-default disabled:hover:bg-transparent hover:bg-slate-100"
                    >
                        <img className="h-10 w-10 rounded-full object-cover" src={passengerAvatar} alt={`Passenger ${passenger.name}`} />
                        <div>
                            <div className="flex items-center">
                                <p className="text-sm font-medium text-slate-900">{passenger.name}</p>
                                {passenger.is_verified_student && <VerifiedBadge />}
                            </div>
                            <div className="flex items-center">
                                {passenger.rating_count > 0 ? (
                                <>
                                    <svg className="w-4 h-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                                    <p className="ml-1 text-sm text-slate-500">
                                    {passenger.average_rating.toFixed(1)}
                                    {` (${passenger.rating_count} ${passenger.rating_count === 1 ? 'rating' : 'ratings'})`}
                                    </p>
                                </>
                                ) : (
                                <p className="ml-1 text-sm text-slate-500">No ratings</p>
                                )}
                            </div>
                        </div>
                    </button>
                )}
                
                {willingToSplitFuel && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        ⛽ Splits Fuel
                    </span>
                )}
            </div>
        </div>
      </div>
      <ProfileModal profile={viewingProfile} onClose={() => setViewingProfile(null)} />
      <FulfillRequestModal 
        isOpen={isFulfillModalOpen}
        onClose={() => setIsFulfillModalOpen(false)}
        request={request}
        onSuccess={refreshData}
      />
    </>
  );
};

export default PassengerRideRequestCard;