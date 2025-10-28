import React, { useState } from 'react';
import { Request, RequestStatus, Driver } from '../types';
import { updateRequestStatus } from '../services/rideService';
import { useAuth } from '../providers/AuthProvider';
import ProfileModal from './ProfileModal';

interface RequestCardProps {
  request: Request;
  viewAs: 'passenger' | 'driver';
  refreshData: () => void;
  onAccept?: (request: Request) => void;
}

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
        Companion Information
      </h3>
      <div className="space-y-3">
        {/* Driver Info */}
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded-lg transition-colors"
          onClick={() => onProfileClick(ride.driver)}
        >
          <img className="h-10 w-10 rounded-full object-cover" src={ride.driver.avatar_url || `https://picsum.photos/seed/${ride.driver.id}/100/100`} alt={ride.driver.name} />
          <div>
            <p className="text-sm font-medium text-slate-900">{ride.driver.name}</p>
            <p className="text-xs text-slate-500">Driver</p>
          </div>
        </div>
        {/* Other Passengers */}
        {!isPending && otherPassengers.map(p => (
           <div key={p.id} 
              className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded-lg transition-colors"
              onClick={() => onProfileClick(p)}
           >
            <img className="h-10 w-10 rounded-full object-cover" src={p.avatar_url || `https://picsum.photos/seed/${p.id}/100/100`} alt={p.name} />
            <div>
              <p className="text-sm font-medium text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-500">Passenger</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


const RequestCard: React.FC<RequestCardProps> = ({ request, viewAs, refreshData, onAccept }) => {
  const { user } = useAuth();
  const { ride, passenger, status } = request;
  const [loadingAction, setLoadingAction] = useState<'accept' | 'reject' | 'cancel' | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Driver | null>(null);

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

  const passengerAvatar = passenger.avatar_url || `https://picsum.photos/seed/${passenger.id}/100/100`;
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
                    {viewAs === 'passenger' ? `Driver: ${ride.driver.name}` : `Passenger: ${passenger.name}`}
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
                    <img className="h-10 w-10 rounded-full object-cover" src={ride.driver.avatar_url || `https://picsum.photos/seed/${ride.driver.id}/100/100`} alt={ride.driver.name} />
                    <div>
                        <p className="text-sm font-medium text-slate-900">{ride.driver.name}</p>
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
                    <p className="text-sm font-medium text-slate-900">{passenger.name}</p>
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
                    <p className="text-sm font-medium text-slate-900">{passenger.name}</p>
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