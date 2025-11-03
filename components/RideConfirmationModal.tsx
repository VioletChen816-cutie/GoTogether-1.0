import React from 'react';
import { Request } from '../types';
import ContactInfo from './ContactInfo';
import { DEFAULT_AVATAR_URL } from '../constants';

interface RideConfirmationModalProps {
  request: Request | null;
  userRole: 'driver' | 'passenger';
  onClose: () => void;
}

const InfoRow: React.FC<{ icon: React.ReactElement, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-5 h-5 mt-1 text-slate-400">{icon}</div>
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-semibold text-slate-800">{value}</p>
        </div>
    </div>
);

const UserCard: React.FC<{ user: { name: string; avatar_url: string | null; id: string; username?: string, email?: string; }; role: string; }> = ({ user, role }) => {
    return (
        <div className="flex items-center space-x-3">
            <img
                src={user.avatar_url || DEFAULT_AVATAR_URL}
                alt={user.name}
                className="h-12 w-12 rounded-full object-cover"
            />
            <div>
                <p className="text-sm text-slate-500">{role}</p>
                <p className="font-semibold text-lg text-slate-800">
                  {user.name} {user.username && `(${user.username})`}
                </p>
                {user.email && <p className="text-sm text-slate-500">{user.email}</p>}
            </div>
        </div>
    );
};


const RideConfirmationModal: React.FC<RideConfirmationModalProps> = ({ request, userRole, onClose }) => {
  if (!request) return null;

  const { ride, passenger } = request;
  const { from, to, departureTime, car } = ride;

  // Determine which user's contact info to display.
  // If the current user is a passenger, show the driver's number.
  // If the current user is a driver, show the passenger's number.
  const contactUser = userRole === 'passenger' ? ride.driver : passenger;

  const formattedDate = departureTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = departureTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative p-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
            <span className="inline-block p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <h2 className="text-2xl font-bold text-slate-800 mt-4">Ride Confirmed!</h2>
            <p className="text-slate-500">You're all set. Here are the details for your upcoming trip.</p>
        </div>
        
        <div className="mt-6 border-t border-b border-slate-200 divide-y divide-slate-200">
            <div className="py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002 2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>}
                    label="Date"
                    value={formattedDate}
                />
                 <InfoRow 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
                    label="Departure Time"
                    value={formattedTime}
                />
            </div>
             <div className="py-5">
                <InfoRow 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
                    label="Route"
                    value={`${from} to ${to}`}
                />
            </div>
        </div>

        <div className="mt-6">
            {userRole === 'passenger' && <UserCard user={ride.driver} role="Your Driver" />}
            {userRole === 'driver' && <UserCard user={passenger} role="Your Passenger" />}
            
            <div className="mt-4">
              <ContactInfo 
                  rideConfirmed={true}
                  userPhoneNumber={contactUser.phone_number}
              />
            </div>
            
            {car && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Vehicle Information</h4>
                     <div className="grid grid-cols-2 gap-3 text-sm">
                        <p><span className="text-slate-500">Make/Model:</span><br/><span className="font-medium text-slate-800">{car.make} {car.model}</span></p>
                        {car.color && <p><span className="text-slate-500">Color:</span><br/><span className="font-medium text-slate-800">{car.color}</span></p>}
                        {car.year && <p><span className="text-slate-500">Year:</span><br/><span className="font-medium text-slate-800">{car.year}</span></p>}
                        <p><span className="text-slate-500">License Plate:</span><br/><span className="font-medium text-slate-800">{car.license_plate}</span></p>
                    </div>
                </div>
            )}
        </div>

        <div className="mt-8">
            <button
                onClick={onClose}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold"
            >
                Got It!
            </button>
        </div>
      </div>
    </div>
  );
};

export default RideConfirmationModal;