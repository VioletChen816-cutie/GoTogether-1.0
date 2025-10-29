import React, { useState } from 'react';
import { Request, RequestStatus, Driver } from '../types';
import { updateRequestStatus } from '../services/rideService';
import { useAuth } from '../providers/AuthProvider';
import ProfileModal from './ProfileModal';
import { useNotification } from '../providers/NotificationProvider';

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

// --- SVG Icons for secondary buttons ---
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.891-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.521.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.203 5.076 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
);

const MessageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
    </svg>
);

const TripCompanions: React.FC<{ ride: Request['ride'], currentUser: Driver, onProfileClick: (profile: Driver) => void, status: RequestStatus }> = ({ ride, currentUser, onProfileClick, status }) => {
  const otherPassengers = ride.passengers.filter(p => p.id !== currentUser.id);
  const isPending = status === RequestStatus.Pending;

  // Contact Driver Logic
  const [isNumberCopied, setIsNumberCopied] = useState(false);
  const { showNotification } = useNotification();
  const sanitizedPhoneNumber = ride.driver.phone_number?.replace(/\D/g, '');

  const handleContactClick = () => {
    if (!ride.driver.phone_number) return;
    navigator.clipboard.writeText(ride.driver.phone_number).then(() => {
      showNotification({ type: 'success', message: "Driver's number copied!" });
      setIsNumberCopied(true);
    }).catch(err => {
      console.error('Failed to copy number: ', err);
      showNotification({ type: 'error', message: 'Could not copy number.' });
    });
  };
  
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-600 mb-3">
        Your Trip Companions
      </h3>
      <div className="space-y-2">
        {/* Driver Row */}
        <div className="flex items-center space-x-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => onProfileClick(ride.driver)}
          >
            <img className="h-10 w-10 rounded-full object-cover" src={ride.driver.avatar_url || `https://picsum.photos/seed/${ride.driver.id}/100/100`} alt={ride.driver.name} />
            <div>
              <p className="font-semibold text-sm text-slate-800">{ride.driver.name}</p>
              <p className="text-xs text-slate-500">Driver</p>
            </div>
          </div>
          
          {/* Contact Actions */}
          <div className="flex items-center">
            {ride.driver.phone_number ? (
                <div>
                    {!isNumberCopied ? (
                        <button
                            onClick={handleContactClick}
                            className="px-4 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        >
                            Contact
                        </button>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <a title="Chat via WhatsApp" href={`https://wa.me/${sanitizedPhoneNumber}?text=Hi! I'm your rideshare match.`} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-600 bg-white border border-slate-300 rounded-full hover:bg-slate-100 transition-colors">
                                <WhatsAppIcon />
                            </a>
                            <a title="Message via iPhone" href={`sms:${sanitizedPhoneNumber}&body=Hi! I'm your rideshare match.`} className="p-2 text-slate-600 bg-white border border-slate-300 rounded-full hover:bg-slate-100 transition-colors">
                                <MessageIcon />
                            </a>
                        </div>
                    )}
                </div>
            ) : (
                 <span className="text-xs text-slate-400 italic pr-2">No contact</span>
            )}
          </div>
        </div>
        
        {/* Other Passengers List */}
        {!isPending && otherPassengers.map(p => (
           <div key={p.id} 
              className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-colors"
              onClick={() => onProfileClick(p)}
           >
            <img className="h-10 w-10 rounded-full object-cover" src={p.avatar_url || `https://picsum.photos/seed/${p.id}/100/100`} alt={p.name} />
            <div>
              <p className="text-sm font-medium text-slate-900">{p.name}</p>
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