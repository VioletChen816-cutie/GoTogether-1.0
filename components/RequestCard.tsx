import React, { useState } from 'react';
import { Request, RequestStatus, Driver, RideStatus } from '../types';
import { updateRequestStatus, respondToDriverOffer } from '../services/rideService';
import { useAuth } from '../providers/AuthProvider';
import ProfileModal from './ProfileModal';
import { useNotification } from '../providers/NotificationProvider';
import ContactActions from './ContactActions';
import { DEFAULT_AVATAR_URL } from '../constants';

interface RequestCardProps {
  request: Request;
  viewAs: 'passenger' | 'driver';
  refreshData: () => void;
  onAccept?: (request: Request) => void;
}

const VerifiedBadge: React.FC<{className?: string}> = ({className}) => (
    <span className={`ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ${className}`} title="Verified Student (.edu email)">
        <svg className="w-4 h-4 mr-0.5 -ml-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
        Verified
    </span>
);

const StatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
  const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize";
  const statusText = status.replace(/-/g, ' ');
  const statusClasses = {
    [RequestStatus.Pending]: "bg-yellow-100 text-yellow-800",
    [RequestStatus.Accepted]: "bg-green-100 text-green-800",
    [RequestStatus.Rejected]: "bg-red-100 text-red-800",
    [RequestStatus.Cancelled]: "bg-slate-100 text-slate-800",
    [RequestStatus.PendingPassengerApproval]: "bg-purple-100 text-purple-800",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{statusText}</span>;
};

const TripCompanions: React.FC<{ ride: Request['ride'], currentUser: Driver, onProfileClick: (profile: Driver) => void, status: RequestStatus }> = ({ ride, currentUser, onProfileClick, status }) => {
  const otherPassengers = ride.passengers.filter(p => p.id !== currentUser.id);
  const isPending = status === RequestStatus.Pending;
  
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-600 mb-3">
        Your Trip Companions
      </h3>
      <div className="space-y-2">
        {/* Driver Row */}
        <div className="flex items-center justify-between space-x-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => onProfileClick(ride.driver)}
          >
            <img className="h-10 w-10 rounded-full object-cover" src={ride.driver.avatar_url || DEFAULT_AVATAR_URL} alt={ride.driver.name} />
            <div>
              <div className="flex items-center">
                  <p className="font-semibold text-sm text-slate-800">{ride.driver.name} {ride.driver.username && `(${ride.driver.username})`}</p>
                  {ride.driver.is_verified_student && <VerifiedBadge />}
              </div>
              <p className="text-xs text-slate-500">Driver</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <ContactActions phoneNumber={ride.driver.phone_number} userType="passenger" />
          </div>
        </div>
        
        {/* Other Passengers List */}
        {!isPending && otherPassengers.map(p => (
           <div key={p.id} 
              className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-colors"
              onClick={() => onProfileClick(p)}
           >
            <img className="h-10 w-10 rounded-full object-cover" src={p.avatar_url || DEFAULT_AVATAR_URL} alt={p.name} />
            <div>
              <div className="flex items-center">
                <p className="text-sm font-medium text-slate-900">{p.name}</p>
                {p.is_verified_student && <VerifiedBadge />}
              </div>
              <p className="text-xs text-slate-500">Passenger</p>
            </div>
          </div>
        ))}

        {otherPassengers.length === 0 && !isPending && (
          <div className="text-center py-4">
            <p className="text-xs text-slate-500">You are the only passenger so far.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944L12 22l9-1.056A12.02 12.02 0 0021 7.928a11.955 11.955 0 01-5.618-4.016z" /></svg>;
const ShieldExclamationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;


const RequestCard: React.FC<RequestCardProps> = ({ request, viewAs, refreshData, onAccept }) => {
  const { user } = useAuth();
  const { ride, passenger, status } = request;
  const [loadingAction, setLoadingAction] = useState<'accept' | 'reject' | 'cancel' | 'accepted' | 'rejected' | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Driver | null>(null);
  const showUsername = status === RequestStatus.Accepted;
  const isOwnRequestToSelf = user?.id === passenger.id;

  const handleUpdateStatus = async (newStatus: RequestStatus, action: 'reject' | 'cancel') => {
    setLoadingAction(action);
    try {
      await updateRequestStatus(request.id, newStatus);
      refreshData();
    } catch (error) {
      alert('Failed to update request status.');
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePassengerResponse = async (response: 'accepted' | 'rejected') => {
      setLoadingAction(response);
      try {
          await respondToDriverOffer(request.id, response);
          refreshData();
      } catch (error: any) {
          alert(`Failed to ${response} offer: ${error.message}`);
      } finally {
          setLoadingAction(null);
      }
  };
  
  const handleAccept = async () => {
    setLoadingAction('accept');
    if (onAccept) {
        await onAccept(request);
    }
    setLoadingAction(null);
  };

  const formattedDate = ride.departureTime.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const formattedTime = ride.departureTime.toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const passengerAvatar = passenger.avatar_url || DEFAULT_AVATAR_URL;
  const isLoading = !!loadingAction;

  if (viewAs === 'passenger') {
    const { from, to, seatsAvailable, driver, price, passengers, car } = ride;
    const isPast = ride.departureTime.getTime() < Date.now();

    const getCardStyleClasses = () => {
        if (ride.status === RideStatus.Completed || ride.status === RideStatus.Cancelled || status === RequestStatus.Rejected || status === RequestStatus.Cancelled) {
          return 'grayscale opacity-75';
        }
        if (ride.status === RideStatus.Active && isPast) {
          return 'grayscale opacity-70';
        }
        return '';
    };

    const getPassengerActionDisplay = () => {
      const statusCommonClasses = "px-3 py-1.5 text-sm font-semibold rounded-full capitalize cursor-default whitespace-nowrap";

      switch(status) {
        case RequestStatus.Pending:
          return (
            <div className="flex flex-col items-center space-y-2">
               <span className={`${statusCommonClasses} bg-yellow-100 text-yellow-800`}>Requested</span>
               <button
                    onClick={() => handleUpdateStatus(RequestStatus.Cancelled, 'cancel')}
                    disabled={isLoading}
                    className="px-3 py-1 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    {loadingAction === 'cancel' ? 'Cancelling...' : 'Cancel Request'}
                </button>
            </div>
          );
        case RequestStatus.PendingPassengerApproval:
            return (
                <div className="flex flex-col items-center space-y-2">
                    <span className={`${statusCommonClasses} bg-purple-100 text-purple-800`}>Offer Received</span>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePassengerResponse('rejected')}
                            disabled={isLoading}
                            className="px-3 py-1 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded-full hover:bg-slate-200"
                        >
                            {loadingAction === 'rejected' ? '...' : 'Reject'}
                        </button>
                        <button
                            onClick={() => handlePassengerResponse('accepted')}
                            disabled={isLoading}
                            className="px-3 py-1 text-xs font-semibold bg-green-500 text-white border border-green-500 rounded-full hover:bg-green-600"
                        >
                            {loadingAction === 'accepted' ? '...' : 'Accept'}
                        </button>
                    </div>
                </div>
            );
        case RequestStatus.Accepted:
          return <span className={`${statusCommonClasses} bg-green-100 text-green-800`}>Accepted</span>;
        case RequestStatus.Rejected:
           return <span className={`${statusCommonClasses} bg-red-100 text-red-800`}>Rejected</span>;
        case RequestStatus.Cancelled:
            return <span className={`${statusCommonClasses} bg-slate-100 text-slate-800`}>{passenger.id === user?.id ? 'Cancelled by You' : 'Cancelled'}</span>;
        default:
            return null;
      }
    };
    
    return (
      <>
        <div className={`relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/80 divide-y divide-slate-100 ${getCardStyleClasses()}`}>
            <div className="absolute top-4 left-6">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    OFFER
                </span>
            </div>
            <div className="p-6 pt-12">
              <div className="flex flex-col md:flex-row justify-between items-start">
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

                <div className="w-full md:w-auto mt-4 md:mt-0 flex flex-row md:flex-col items-center justify-between md:items-end">
                   <div className="w-24 text-right md:text-center md:mb-4">
                      <p className="text-3xl font-bold text-blue-500">${price}</p>
                      <p className="text-sm text-slate-500 -mt-1">per seat</p>
                   </div>
                   <div className="min-w-[130px] text-center">
                    {getPassengerActionDisplay()}
                   </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/50 rounded-b-2xl">
              {status === RequestStatus.Accepted ? (
                <TripCompanions ride={ride} currentUser={passenger} onProfileClick={setViewingProfile} status={status}/>
              ) : (
                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => setViewingProfile(driver)}
                        className="flex items-center space-x-3 text-left p-1 -m-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-default disabled:hover:bg-transparent hover:bg-slate-100"
                    >
                        <img className="h-10 w-10 rounded-full object-cover" src={driver.avatar_url || DEFAULT_AVATAR_URL} alt={`Driver ${driver.name}`} />
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
                                      {` (${driver.rating_count} ${driver.rating_count === 1 ? 'rating' : 'ratings'})`}
                                    </p>
                                </>
                                ) : (
                                <p className="ml-1 text-sm text-slate-500">No ratings</p>
                                )}
                            </div>
                        </div>
                    </button>
                    {(() => {
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
                    })()}
                </div>
              )}
            </div>
        </div>
        <ProfileModal
            profile={viewingProfile}
            onClose={() => setViewingProfile(null)}
            canViewContactInfo={status === RequestStatus.Accepted || status === RequestStatus.PendingPassengerApproval}
        />
      </>
    );
  }

  // --- DRIVER VIEW ---
  const handlePassengerProfileClick = () => {
    // Pass the full passenger object; modal will determine if contact info is visible.
    setViewingProfile(passenger);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
        <div className="p-6">
          {/* Ride Info */}
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3">
                <div className="text-center w-16">
                  <div className="font-semibold text-blue-500">{formattedTime}</div>
                  <div className="text-xs text-slate-500">{formattedDate}</div>
                </div>
                <div className="pl-3 border-l border-slate-200">
                  <p className="font-bold text-slate-800">{ride.from} to {ride.to}</p>
                  {ride.car && (
                     <p className="text-sm text-slate-500">
                        🚗 {ride.car.make} {ride.car.model}
                     </p>
                  )}
                  {/* FIX: In the driver view, `viewAs` is 'driver', so the previous ternary was always false and caused a type error. This is simplified to always show the passenger's name. */}
                  <p className="text-sm text-slate-500">
                    Passenger: {passenger.name} {showUsername && passenger.username ? `(${passenger.username})` : ''}
                  </p>
                </div>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Actions for Driver (Pending) */}
          {viewAs === 'driver' && status === RequestStatus.Pending && (
            <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePassengerProfileClick}
                className="flex items-center space-x-3 text-left p-1 -m-1 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                  <img className="h-10 w-10 rounded-full object-cover" src={passengerAvatar} alt={passenger.name} />
                  <div>
                    <div className="flex items-center">
                        <p className="text-sm font-medium text-slate-900">{passenger.name} {showUsername && passenger.username && `(${passenger.username})`}</p>
                        {passenger.is_verified_student && <VerifiedBadge />}
                    </div>
                    <p className="text-sm text-slate-500">Wants to join your ride</p>
                  </div>
              </button>
              {isOwnRequestToSelf ? (
                <span className="text-sm font-semibold text-slate-500 px-4 py-1.5">Cannot act on own request</span>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateStatus(RequestStatus.Rejected, 'reject')}
                    disabled={isLoading}
                    className="px-4 py-1.5 text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    {loadingAction === 'reject' ? 'Rejecting...' : 'Reject'}
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={isLoading}
                    className="px-4 py-1.5 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                  >
                    {loadingAction === 'accept' ? 'Accepting...' : 'Accept'}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Actions for Driver (Accepted) */}
          {viewAs === 'driver' && status === RequestStatus.Accepted && (
            <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePassengerProfileClick}
                className="flex items-center space-x-3 text-left p-1 -m-1 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                  <img className="h-10 w-10 rounded-full object-cover" src={passengerAvatar} alt={passenger.name} />
                  <div>
                    <div className="flex items-center">
                        <p className="text-sm font-medium text-slate-900">{passenger.name} {showUsername && passenger.username && `(${passenger.username})`}</p>
                        {passenger.is_verified_student && <VerifiedBadge />}
                    </div>
                    <p className="text-sm text-green-600 font-medium">Is joining your ride</p>
                  </div>
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUpdateStatus(RequestStatus.Cancelled, 'cancel')}
                  disabled={isLoading}
                  className="px-4 py-1.5 text-sm font-semibold bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {loadingAction === 'cancel' ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ProfileModal
        profile={viewingProfile}
        onClose={() => setViewingProfile(null)}
        canViewContactInfo={status === RequestStatus.Accepted || status === RequestStatus.Pending}
      />
    </>
  );
};

export default RequestCard;
