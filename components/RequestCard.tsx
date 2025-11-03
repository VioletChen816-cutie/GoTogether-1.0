import React, { useState } from 'react';
import { Request, RequestStatus, Driver } from '../types';
import { updateRequestStatus } from '../services/rideService';
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
  const statusClasses = {
    [RequestStatus.Pending]: "bg-yellow-100 text-yellow-800",
    [RequestStatus.Accepted]: "bg-green-100 text-green-800",
    [RequestStatus.Rejected]: "bg-red-100 text-red-800",
    [RequestStatus.Cancelled]: "bg-slate-100 text-slate-800",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
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


const RequestCard: React.FC<RequestCardProps> = ({ request, viewAs, refreshData, onAccept }) => {
  const { user } = useAuth();
  const { ride, passenger, status } = request;
  const [loadingAction, setLoadingAction] = useState<'accept' | 'reject' | 'cancel' | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Driver | null>(null);
  const showUsername = status === RequestStatus.Accepted;

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
                  <p className="text-sm text-slate-500">
                    {viewAs === 'passenger' ? `Driver: ${ride.driver.name} ${showUsername && ride.driver.username ? `(${ride.driver.username})` : ''}` : `Passenger: ${passenger.name} ${showUsername && passenger.username ? `(${passenger.username})` : ''}`}
                  </p>
                </div>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Passenger View: Pending Request */}
          {viewAs === 'passenger' && user && status === RequestStatus.Pending && (
            <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
                <div 
                    className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded-lg transition-colors"
                    onClick={() => setViewingProfile(ride.driver)}
                    >
                    <img className="h-10 w-10 rounded-full object-cover" src={ride.driver.avatar_url || DEFAULT_AVATAR_URL} alt={ride.driver.name} />
                    <div>
                        <div className="flex items-center">
                            <p className="text-sm font-medium text-slate-900">{ride.driver.name} {showUsername && ride.driver.username && `(${ride.driver.username})`}</p>
                            {ride.driver.is_verified_student && <VerifiedBadge />}
                        </div>
                        <p className="text-xs text-slate-500">Driver</p>
                    </div>
                </div>
                <button
                    onClick={() => handleUpdateStatus(RequestStatus.Cancelled, 'cancel')}
                    disabled={isLoading}
                    className="px-4 py-1.5 text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    {loadingAction === 'cancel' ? 'Cancelling...' : 'Cancel Request'}
                </button>
             </div>
          )}

          {/* Passenger View: Accepted Trip */}
          {viewAs === 'passenger' && user && status === RequestStatus.Accepted && (
            <div className="border-t border-slate-100 mt-4 pt-4">
              <TripCompanions ride={ride} currentUser={passenger} onProfileClick={setViewingProfile} status={status}/>
            </div>
          )}

          {/* Actions for Driver (Pending) */}
          {viewAs === 'driver' && status === RequestStatus.Pending && (
            <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewingProfile(passenger)}
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
            </div>
          )}
          
          {/* Actions for Driver (Accepted) */}
          {viewAs === 'driver' && status === RequestStatus.Accepted && (
            <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewingProfile(passenger)}
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
      <ProfileModal profile={viewingProfile} onClose={() => setViewingProfile(null)} />
    </>
  );
};

export default RequestCard;