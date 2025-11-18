import React, { useState } from 'react';
import { Ride, RequestStatus, Driver, RideStatus, UserToRate } from '../types';
import { useAuth } from '../providers/AuthProvider';
import { requestRide } from '../services/rideService';
import ProfileModal from './ProfileModal';
import PaymentInfoModal from './PaymentInfoModal';
import ContactActions from './ContactActions';
import { DEFAULT_AVATAR_URL } from '../constants';

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
  isHistoryView?: boolean;
}

const VerifiedBadge: React.FC<{className?: string}> = ({className}) => (
    <span className={`ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ${className}`} title="Verified Student (.edu email)">
        <svg className="w-4 h-4 mr-0.5 -ml-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
        Verified
    </span>
);

const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944L12 22l9-1.056A12.02 12.02 0 0021 7.928a11.955 11.955 0 01-5.618-4.016z" /></svg>;
const ShieldExclamationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

const CarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v7a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2zm-1 3V4a1 1 0 112 0v1h-2zM6 8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;

const PassengerList: React.FC<{ 
  ride: Ride, 
  onProfileClick: (profile: Driver) => void,
  onRatePassenger?: (rideId: string, userToRate: UserToRate) => void 
}> = ({ ride, onProfileClick, onRatePassenger }) => {
  const { user } = useAuth();
  const hasConfirmedPassengers = ride.passengers && ride.passengers.length > 0;
  const hasPendingPassengers = ride.pendingPassengers && ride.pendingPassengers.length > 0;

  if (!hasConfirmedPassengers && !hasPendingPassengers) {
    return (
       <div className="text-right">
          <p className="text-sm font-medium text-slate-500">No passengers yet</p>
      </div>
    );
  }

  // Rating UI for completed rides
  if (ride.status === RideStatus.Completed) {
    const alreadyRatedPassengerIds = new Set(
      ride.ratings.filter(r => r.rater_id === user?.id).map(r => r.ratee_id)
    );
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
                            <img className="h-8 w-8 rounded-full object-cover" src={p.avatar_url || DEFAULT_AVATAR_URL} alt={p.name} />
                            <span className="text-sm font-medium text-slate-800">{p.name} {p.username && `(${p.username})`}</span>
                            {p.is_verified_student && <VerifiedBadge className="ml-1" />}
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

  // Contact UI for active rides
  if (ride.status === RideStatus.Active && (hasConfirmedPassengers || hasPendingPassengers)) {
    return (
      <div className="w-full">
          {hasConfirmedPassengers && (
            <>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Confirmed Passengers:</h3>
              <div className="space-y-2">
                  {ride.passengers.map(p => {
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-slate-100/80 p-2 rounded-lg">
                          <button
                            type="button"
                            onClick={() => onProfileClick(p)}
                            className="flex items-center space-x-2 text-left"
                          >
                              <img className="h-8 w-8 rounded-full object-cover" src={p.avatar_url || DEFAULT_AVATAR_URL} alt={p.name} />
                               <div>
                                    <div className="flex items-center">
                                        <span className="text-sm font-medium text-slate-800">{p.name} {p.username && `(${p.username})`}</span>
                                        {p.is_verified_student && <VerifiedBadge className="ml-1" />}
                                    </div>
                                    {p.email && <p className="text-xs text-slate-500">{p.email}</p>}
                                </div>
                          </button>
                          <div className="flex items-center">
                              <ContactActions phoneNumber={p.phone_number} userType="driver" />
                          </div>
                      </div>
                    )
                  })}
              </div>
            </>
          )}

          {hasPendingPassengers && (
            <div className={hasConfirmedPassengers ? 'mt-4' : ''}>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Pending Passengers:</h3>
              <div className="space-y-2">
                  {(ride.pendingPassengers || []).map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-100/80 p-2 rounded-lg opacity-80">
                        <button
                          type="button"
                          onClick={() => onProfileClick(p)}
                          className="flex items-center space-x-2 text-left"
                        >
                            <img className="h-8 w-8 rounded-full object-cover" src={p.avatar_url || DEFAULT_AVATAR_URL} alt={p.name} />
                            <div>
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-slate-800">{p.name} {p.username && `(${p.username})`}</span>
                                    {p.is_verified_student && <VerifiedBadge className="ml-1" />}
                                </div>
                                {p.email && <p className="text-xs text-slate-500">{p.email}</p>}
                            </div>
                        </button>
                        <span className="text-xs font-semibold text-purple-800 bg-purple-100 px-2 py-1 rounded-full">Awaiting Approval</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
      </div>
    )
  }
  
  // Default/Fallback compact UI (for cancelled rides or other edge cases)
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
              src={p.avatar_url || DEFAULT_AVATAR_URL}
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


const RideCard: React.FC<RideCardProps> = ({ ride, requestStatus, refreshData, isDriverView = false, onCancel, onComplete, onRateDriver, onRatePassenger, isProcessing = false, isHistoryView = false }) => {
  const { user, openAuthModal } = useAuth();
  const { from, to, departureTime, seatsAvailable, driver, price, passengers, status, ratings, car } = ride;
  const [isLoading, setIsLoading] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<{ profile: Driver; canViewContactInfo: boolean; } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const isFull = seatsAvailable === 0;
  const isOwnRide = user?.id === ride.driver.id;
  const isPast = ride.departureTime.getTime() < Date.now();

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
      if (status === RideStatus.Active && isPast) {
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
        if (!user) return null;
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

    if (status === RideStatus.Active && isPast) {
      return <span className={`${commonClasses} bg-slate-100 text-slate-800 cursor-default`}>Expired</span>;
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
    if (status === RideStatus.Completed && !isHistoryView) {
      return 'grayscale opacity-60';
    }
    if (status === RideStatus.Cancelled) {
      return 'grayscale opacity-75';
    }
    if (status === RideStatus.Active && isPast && !isDriverView && !isHistoryView) {
      return 'grayscale opacity-70';
    }
    if (isFull && !isDriverView) {
      return 'opacity-80';
    }
    return '';
  };

  const driverAvatar = driver.avatar_url || DEFAULT_AVATAR_URL;

  const shouldShowRatePassengersSection = isDriverView && status === RideStatus.Completed && passengers.length > 0;
  
  const shouldShowDisclaimer = status === RideStatus.Active;
  const shouldShowCopyButton = user && driver.payment_methods && driver.payment_methods.length > 0 && !isDriverView && status === RideStatus.Completed && isHistoryView;

  const handleDriverProfileClick = () => {
    // Passenger can see driver's contact info only if their request is accepted.
    // The driver can see their own info.
    const isCurrentUserAccepted = ride.passengers.some(p => p.id === user?.id);
    const canViewContactInfo = isOwnRide || isCurrentUserAccepted;
    setViewingProfile({ profile: driver, canViewContactInfo });
  };
  
  const handlePassengerProfileClick = (p: Driver) => {
    // Driver can always view passenger's info if they are on their ride.
    setViewingProfile({ profile: p, canViewContactInfo: true });
  };

  return (
    <>
      <div className={`relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/80 divide-y divide-slate-100 ${getCardStyleClasses()}`}>
        <div className="absolute top-4 left-6">
            <span 
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"
                {...(ride.fulfilledFromRequestId && { title: "This offer fulfills a passenger's request." })}
            >
                OFFER
            </span>
        </div>
        <div className="p-6 pt-12">
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
                  <div className="flex items-center space-x-3 mt-1 text-sm text-slate-500">
                    <span>
                      🚗 {car.color ? `${car.color} ` : ''}{car.make} {car.model}
                    </span>
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
                {isDriverView ? (
                    <div></div> // Render an empty div to push passenger list to the right
                ) : (
                    <button
                        type="button"
                        onClick={handleDriverProfileClick}
                        disabled={isOwnRide}
                        className="flex items-center space-x-3 text-left p-1 -m-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-default disabled:hover:bg-transparent hover:bg-slate-100"
                    >
                        <img className="h-10 w-10 rounded-full object-cover" src={driverAvatar} alt={`Driver ${driver.name}`} />
                        <div>
                            <div className="flex items-center">
                                <p className="text-sm font-medium text-slate-900">{driver.name}</p>
                                {driver.is_verified_student && <VerifiedBadge />}
                            </div>
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
                )}
                {isDriverView ? (
                    status !== RideStatus.Completed ? (
                        <PassengerList ride={ride} onProfileClick={handlePassengerProfileClick} onRatePassenger={onRatePassenger} />
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
                                            src={p.avatar_url || DEFAULT_AVATAR_URL}
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
            
            {(shouldShowDisclaimer || shouldShowCopyButton) && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className={`flex flex-col sm:flex-row items-center gap-2 ${shouldShowDisclaimer ? 'justify-between' : 'justify-end'}`}>
                      {shouldShowDisclaimer && (
                          <p className="text-xs text-slate-500 text-center sm:text-left">
                              Final payment to be confirmed with driver.
                          </p>
                      )}
                      {shouldShowCopyButton && (
                          <button 
                              onClick={() => setIsPaymentModalOpen(true)}
                              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-blue-600 border border-slate-300 rounded-full hover:bg-slate-100 transition-colors"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              <span>Copy Payment Info</span>
                          </button>
                      )}
                  </div>
              </div>
            )}

            {shouldShowRatePassengersSection && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <PassengerList ride={ride} onProfileClick={handlePassengerProfileClick} onRatePassenger={onRatePassenger} />
                </div>
            )}
        </div>
      </div>
      <ProfileModal
        profile={viewingProfile?.profile ?? null}
        onClose={() => setViewingProfile(null)}
        canViewContactInfo={viewingProfile?.canViewContactInfo}
      />
      <PaymentInfoModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        driver={driver}
      />
    </>
  );
};

export default RideCard;
