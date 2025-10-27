import React, { useState } from 'react';
import { Request, RequestStatus } from '../types';
import { updateRequestStatus } from '../services/rideService';

interface RequestCardProps {
  request: Request;
  viewAs: 'passenger' | 'driver';
  refreshData: () => void;
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


const RequestCard: React.FC<RequestCardProps> = ({ request, viewAs, refreshData }) => {
  const { ride, passenger, status } = request;
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateStatus = async (newStatus: RequestStatus) => {
    setIsLoading(true);
    try {
      await updateRequestStatus(request.id, newStatus);
      refreshData();
    } catch (error) {
      alert('Failed to update request status.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = ride.departureTime.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const formattedTime = ride.departureTime.toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const passengerAvatar = passenger.avatar_url || `https://picsum.photos/seed/${passenger.id}/100/100`;

  return (
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
                <p className="text-sm text-slate-500">
                  {viewAs === 'passenger' ? `Driver: ${ride.driver.name}` : `Passenger: ${passenger.name}`}
                </p>
              </div>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Actions for Driver */}
        {viewAs === 'driver' && status === RequestStatus.Pending && (
          <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <img className="h-10 w-10 rounded-full object-cover" src={passengerAvatar} alt={passenger.name} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{passenger.name}</p>
                   <p className="text-sm text-slate-500">Wants to join your ride</p>
                </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleUpdateStatus(RequestStatus.Rejected)}
                disabled={isLoading}
                className="px-4 py-1.5 text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleUpdateStatus(RequestStatus.Accepted)}
                disabled={isLoading}
                className="px-4 py-1.5 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
              >
                Accept
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestCard;