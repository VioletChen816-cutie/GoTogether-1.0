import React from 'react';
import { Request, UserToRate } from '../types';
import { useNotification } from '../providers/NotificationProvider';

// Re-using some components/styles for consistency
const InfoRow: React.FC<{ icon: React.ReactElement, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-5 h-5 mt-1 text-slate-400">{icon}</div>
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-semibold text-slate-800">{value}</p>
        </div>
    </div>
);

const ClipboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;


interface RideCompletionModalProps {
  request: Request | null;
  onClose: () => void;
  onRateDriver: (rideId: string, userToRate: UserToRate) => void;
}

const RideCompletionModal: React.FC<RideCompletionModalProps> = ({ request, onClose, onRateDriver }) => {
  const { showNotification } = useNotification();
  
  if (!request) return null;
  
  const { ride } = request;
  const { driver } = ride;

  const formattedDate = ride.departureTime.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });

  const handleCopy = (account: string) => {
    if (!account) return;
    navigator.clipboard.writeText(account).then(() => {
        showNotification({ type: 'success', message: 'Payment info copied!' });
    }).catch(err => {
        console.error('Failed to copy info: ', err);
        showNotification({ type: 'error', message: 'Could not copy info.' });
    });
  };

  const handleRateClick = () => {
    onRateDriver(ride.id, { id: driver.id, name: driver.name, avatar_url: driver.avatar_url });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative p-8 transform transition-all text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
            <span className="inline-block p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <h2 className="text-2xl font-bold text-slate-800 mt-4">Ride Complete!</h2>
            <p className="text-slate-500">Your ride with {driver.name} from {ride.from} to {ride.to} on {formattedDate} is complete.</p>
        </div>

        <div className="mt-6 border-t pt-6">
             <h3 className="text-lg font-semibold text-slate-800">Please Pay Your Driver</h3>
             <p className="text-sm text-slate-500 mb-4">Total due: <span className="font-bold text-blue-500 text-lg">${ride.price}</span></p>

            {driver.payment_methods && driver.payment_methods.length > 0 ? (
                <div className="space-y-3">
                    {driver.payment_methods.map((pm, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500 text-left capitalize">{pm.method}</p>
                            <div className="flex items-center justify-between mt-1">
                                <p className="font-semibold text-slate-800 text-lg break-all">{pm.handle}</p>
                                <button
                                    onClick={() => handleCopy(pm.handle)}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-blue-600 border border-slate-300 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    <ClipboardIcon />
                                    <span>Copy</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm bg-yellow-100 text-yellow-800 p-3 rounded-lg">The driver hasn't provided payment info. Please coordinate with them directly.</p>
            )}
        </div>
        
        <div className="mt-8 flex flex-col space-y-3">
           <button
            onClick={handleRateClick}
            className="w-full px-6 py-3 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Rate {driver.name}
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideCompletionModal;
