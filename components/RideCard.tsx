import React, { useState } from 'react';
import { Ride, RequestStatus, Driver, RideStatus, UserToRate } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { requestRide } from '../services/rideService';
import ProfileModal from './ProfileModal';

interface RideCardProps {
  ride: Ride;
  requestStatus?: RequestStatus;
  refreshData?: () => void;
  isDriverView?: boolean;
  onCancel?: (rideId: string) => void;
  onComplete?: (rideId: string) => void;
  onRateDriver?: (rideId: string, userToRate: UserToRate) => void;
  onRatePassenger?: (rideId: string, userToRate: UserToRate) => void;
  isProcessing?: boolean;
}

const PassengerList: React.FC<{ 
  ride: Ride, 
  onProfileClick: (profile: Driver) => void,
  onRatePassenger?: (rideId: string, userToRate: UserToRate) => void 
}> = ({ ride, onProfileClick, onRatePassenger }) => {
  const { user } = useAuth();
  if (ride.passengers.length === 0) {
    return (
       <div className="text-right">
          <p className="text-sm font-medium text-slate-500">No passengers yet</p>
      </div>
    );
  }

  const alreadyRatedPassengerIds = new Set(
    ride.ratings.filter(r => r.rater_id === user?.id).map(r => r.ratee_id)
  );
  
  if (ride.status === RideStatus.Completed) {
     return (
        <div className="w-full">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Passengers on this trip:</h3>
            <div className="space-y-2">
                {ride.passengers.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-100/80 p-2 rounded-lg">
                        <button
                          type="button"
                          onClick={() => onProfileClick(p)}
                          className="flex items-center space-x-2 text-left"
                        >
                            <img className="h-8 w-8 rounded-full object-cover" src={p.avatar_url || `https://picsum.photos/seed/${p.id}/100/100`} alt={p.name} />
                            <span className="text-sm font-medium text-slate-800">{p.name}</span>
                        </button>
                        {alreadyRatedPassengerIds.has(p.id) ? (
                            <span className="text-xs font-semibold text-green-600 px-2 py-1">Rated</span>
                        ) : (
                            <button 
                              onClick={() => onRatePassenger?.(ride.id, { id: p.id, name: p.name, avatar_url: p.avatar_url })}
                              className="px-3 py-1 text-xs font-semibold bg-white text-blue-600 border border-slate-300 rounded-full hover:bg-slate-50 transition-colors"
                            >
                              Rate
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
     )
  }
  
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center -space-x-3">
        {ride.passengers.slice(0, 3).map(p => (
           <button
            key={p.id}
            type="button"
            onClick={() => onProfileClick(p)}
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
           >
            <img
              className="h-9 w-9 rounded-full object-cover border-2 border-white"
              src={p.avatar_url || `https://picsum.photos/seed/${p.id}/100/100`}
              alt={p.name}
              title={p.name}
            />
          </button>
        ))}
         {ride.passengers.length > 3 && (
          <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white">
            <span className="text-xs font-semibold text-slate-600">+{ride.passengers.length - 3}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-1">{ride.passengers.length} confirmed</p>
    </div>
  );
};


const RideCard: React.FC<RideCardProps> = ({ ride, requestStatus, refreshData, isDriverView = false, onCancel, onComplete, onRateDriver, onRatePassenger, isProcessing = false }) => {
  const { user, openAuthModal } = useAuth();
  const { from, to, departureTime, seatsAvailable, driver, price, passengers, status, ratings, car } = ride;
  const [isLoading, setIsLoading] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<Driver | null>(null);
  const isFull = seatsAvailable === 0;
  const isOwnRide = user?.id === ride.driver.id;

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
    } catch (error: any)
 {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonState = () => {
    const commonClasses = "px-5 py-2 rounded-full font-semibold whitespace-nowrap text-sm";

    if (isDriverView) {
      const isPastRide = ride.departureTime.getTime() < Date.now();
      if (status === RideStatus.Active && isPastRide) {
        return (
          <button
            onClick={() => onComplete?.(ride.id)}
            disabled={isProcessing}
            className={`${commonClasses} bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-wait`}
          >
            {isProcessing ? 'Completing...' : 'Complete Ride'}
          </button>
        );
      }
      switch(status) {
        case RideStatus.Active:
          return (
            <button
              onClick={() => onCancel?.(ride.id)}
              disabled={isProcessing}
              className={`${commonClasses} bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-wait`}
            >
              {isProcessing ? 'Cancelling...' : 'Cancel Ride'}
            </button>
          );
        case RideStatus.Cancelled:
          return <span className={`${commonClasses} bg-slate-100 text-slate-800 cursor-default`}>Cancelled</span>;
        case RideStatus.Completed:
           return <span className={`${commonClasses} bg-slate-100 text-slate-800 cursor-default`}>Completed</span>;
        default:
          return null;
      }
    };
    if (isOwnRide) return <span className={`${commonClasses} bg-green-100 text-green-800 cursor-default`}>Your Ride</span>;

    if (status === RideStatus.Completed) {
        const hasRated = ratings.some(r => r.rater_id === user?.id && r.ratee_id === driver.id);
        if (hasRated) {
            return <span className={`${commonClasses} bg-green-100 text-green-800 cursor-default`}>Rated</span>
        }
        return (
            <button
              onClick={() => onRateDriver?.(ride.id, { id: driver.id, name: driver.name, avatar_url: driver.avatar_url })}
              className={`${commonClasses} bg-blue-500 text-white hover:bg-blue-600`}
            >
              Rate Driver
            </button>
        )
    }

    if (status === RideStatus.Cancelled) {
      return <button disabled className={`${commonClasses} bg-slate-100 text-slate-800 cursor-not-allowed`}>Cancelled</button>;
    }
    
    switch (requestStatus) {
      case RequestStatus.Pending:
        return <button disabled className={`${commonClasses} bg-yellow-100 text-yellow-800 cursor-not-allowed`}>Requested</button>;
      case RequestStatus.Accepted:
        return <button disabled className={`${commonClasses} bg-green-100 text-green-800 cursor-not-allowed`}>Accepted</button>;
      default:
        return (
          <button 
            onClick={handleRequest}
            disabled={isLoading || isFull}
            className={`${commonClasses} bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Requesting...' : (isFull ? 'Full' : 'Request to Join')}
          </button>
        );
    }
  };
  
  const getCardStyleClasses = () => {
    if (status === RideStatus.Cancelled) {
      return 'grayscale opacity-75';
    }
    if (isFull && !isDriverView && status !== 'completed') {
      return 'opacity-80';
    }
    return '';
  };

  const driverAvatar = driver.avatar_url || `https://picsum.photos/seed/${driver.id}/100/100`;

  const shouldShowRatePassengersSection = isDriverView && status === RideStatus.Completed && passengers.length > 0;

  return (
    <>
      <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/80 divide-y divide-slate-100 ${getCardStyleClasses()}`}>
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
                {car && (
                  <p className="text-sm text-slate-500 mt-1">
                    🚗 {car.color ? `${car.color} ` : ''}{car.make} {car.model}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full md:w-auto mt-4 md:mt-0 flex flex-row md:flex-col items-center justify-between">
               <div className="w-24 text-right md:text-center md:mb-4">
                  <p className="text-3xl font-bold text-blue-500">${price}</p>
                  <p className="text-sm text-slate-500 -mt-1">per seat</p>
               </div>
               {getButtonState()}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 rounded-b-2xl">
            <div className="flex justify-between items-center">
                <button
                    type="button"
                    onClick={() => setViewingProfile(driver)}
                    disabled={isOwnRide}
                    className="flex items-center space-x-3 text-left p-1 -m-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-default disabled:hover:bg-transparent hover:bg-slate-100"
                >
                    <img className="h-10 w-10 rounded-full object-cover" src={driverAvatar} alt={`Driver ${driver.name}`} />
                    <div>
                    <p className="text-sm font-medium text-slate-900">{driver.name}</p>
                    <div className="flex items-center">
                        {driver.rating_count > 0 ? (
                        <>
                            <svg className="w-4 h-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                            <p className="ml-1 text-sm text-slate-500">
                            {driver.average_rating.toFixed(1)}
                            {!isDriverView && ` (${driver.rating_count} ${driver.rating_count === 1 ? 'rating' : 'ratings'})`}
                            </p>
                        </>
                        ) : (
                        <p className="ml-1 text-sm text-slate-500">No ratings</p>
                        )}
                    </div>
                    </div>
                </button>
                {isDriverView ? (
                    status !== RideStatus.Completed ? (
                        <PassengerList ride={ride} onProfileClick={setViewingProfile} onRatePassenger={onRatePassenger} />
                    ) : (
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-700">{passengers.length} Passenger{passengers.length !== 1 ? 's' : ''}</p>
                        </div>
                    )
                ) : (
                    (() => {
                        const seatsTaken = passengers.length;
                        const maxIcons = 5;

                        const passengersToShow = passengers.slice(0, maxIcons);
                        const emptySeatsToShow = Math.max(0, Math.min(seatsAvailable, maxIcons - passengersToShow.length));
                        
                        const hiddenPassengers = Math.max(0, passengers.length - passengersToShow.length);
                        const hiddenEmpty = seatsAvailable - emptySeatsToShow;
                        const remaining = hiddenPassengers + hiddenEmpty;

                        const EmptySeatIcon = () => (
                            <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white" title="Seat available">
                                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                            </div>
                        );

                        return (
                            <div className="text-right">
                                <div className="flex items-center justify-end -space-x-2">
                                    {passengersToShow.map(p => (
                                        <img
                                            key={p.id}
                                            className="h-7 w-7 rounded-full object-cover border-2 border-white"
                                            src={p.avatar_url || `https://picsum.photos/seed/${p.id}/100/100`}
                                            alt={p.name}
                                            title={p.name}
                                        />
                                    ))}
                                    {Array.from({ length: emptySeatsToShow }).map((_, index) => <EmptySeatIcon key={`empty-${index}`} />)}
                                    {remaining > 0 && (
                                        <div className="h-7 w-7 rounded-full bg-slate-300 flex items-center justify-center border-2 border-white">
                                            <span className="text-xs font-semibold text-slate-700">+{remaining}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {seatsTaken > 0 ? `${seatsTaken} taken, ` : ''}
                                    {seatsAvailable} {seatsAvailable === 1 ? 'seat' : 'seats'} left
                                </p>
                            </div>
                        );
                    })()
                )}
            </div>

            {shouldShowRatePassengersSection && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <PassengerList ride={ride} onProfileClick={setViewingProfile} onRatePassenger={onRatePassenger} />
                </div>
            )}
        </div>
      </div>
      <ProfileModal profile={viewingProfile} onClose={() => setViewingProfile(null)} />
    </>
  );
};

export default RideCard;
