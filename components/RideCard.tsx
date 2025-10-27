
import React, { useState } from 'react';
import { Ride, RequestStatus } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { requestRide } from '../services/rideService';

interface RideCardProps {
  ride: Ride;
  requestStatus?: RequestStatus;
  refreshData?: () => void;
  isDriverView?: boolean;
}

const RideCard: React.FC<RideCardProps> = ({ ride, requestStatus, refreshData, isDriverView = false }) => {
  const { user, openAuthModal } = useAuth();
  const { from, to, departureTime, seatsAvailable, driver, price } = ride;
  const [isLoading, setIsLoading] = useState(false);

  const formattedDate = departureTime.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = departureTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleRequest = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setIsLoading(true);
    try {
      await requestRide(ride.id);
      refreshData?.();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonState = () => {
    if (isDriverView) return null;
    if (user?.id === ride.driver.id) return <span className="text-sm font-semibold text-slate-500 px-5 py-2">Your Ride</span>

    const commonClasses = "px-5 py-2 rounded-full font-semibold transition-colors duration-200 whitespace-nowrap text-sm";
    
    switch (requestStatus) {
      case RequestStatus.Pending:
        return <button disabled className={`${commonClasses} bg-yellow-100 text-yellow-800 cursor-not-allowed`}>Requested</button>;
      case RequestStatus.Accepted:
        return <button disabled className={`${commonClasses} bg-green-100 text-green-800 cursor-not-allowed`}>Accepted</button>;
      case RequestStatus.Rejected:
        return <button disabled className={`${commonClasses} bg-red-100 text-red-800 cursor-not-allowed`}>Rejected</button>;
      default:
        return (
          <button 
            onClick={handleRequest}
            disabled={isLoading}
            className={`${commonClasses} bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300`}
          >
            {isLoading ? 'Requesting...' : 'Request to Join'}
          </button>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/80 divide-y divide-slate-100">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center space-x-4">
             <div className="text-center w-20">
                  <div className="text-lg font-semibold text-blue-500">{formattedTime}</div>
                  <div className="text-xs text-slate-500">{formattedDate}</div>
              </div>
            <div className="border-l border-slate-200 pl-4">
              <p className="font-bold text-xl text-slate-800">{from}</p>
              <p className="text-slate-500 text-sm">to</p>
              <p className="font-bold text-xl text-slate-800">{to}</p>
            </div>
          </div>

          <div className="w-full md:w-auto mt-4 md:mt-0 flex flex-row md:flex-col items-center justify-between">
             <div className="text-center md:mb-4">
                <p className="text-3xl font-bold text-blue-500">${price}</p>
                <p className="text-sm text-slate-500 -mt-1">per seat</p>
             </div>
             {getButtonState()}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 flex justify-between items-center bg-slate-50/50 rounded-b-2xl">
        <div className="flex items-center space-x-3">
          <img className="h-10 w-10 rounded-full object-cover" src={driver.avatar} alt={`Driver ${driver.name}`} />
          <div>
            <p className="text-sm font-medium text-slate-900">{driver.name}</p>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
              <p className="ml-1 text-sm text-slate-500">{driver.rating.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end" title={`${seatsAvailable} seat${seatsAvailable > 1 ? 's' : ''} left`} aria-label={`${seatsAvailable} seats left`}>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(seatsAvailable, 4) }).map((_, index) => (
                <svg key={index} className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
              ))}
              {seatsAvailable > 4 && (
                <span className="pl-1 text-sm font-semibold text-slate-600">+{seatsAvailable - 4}</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">seats left</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideCard;