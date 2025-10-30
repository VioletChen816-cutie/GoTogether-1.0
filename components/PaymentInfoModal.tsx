import React from 'react';
import { Driver } from '../types';
import { useNotification } from '../providers/NotificationProvider';

interface PaymentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
}

const ClipboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;

const PaymentInfoModal: React.FC<PaymentInfoModalProps> = ({ isOpen, onClose, driver }) => {
  const { showNotification } = useNotification();
  
  if (!isOpen || !driver || !driver.payment_methods || driver.payment_methods.length === 0) return null;

  const handleCopy = (account: string) => {
    if (!account) return;
    navigator.clipboard.writeText(account).then(() => {
        showNotification({ type: 'success', message: 'Payment account copied!' });
    }).catch(err => {
        console.error('Failed to copy info: ', err);
        showNotification({ type: 'error', message: 'Could not copy info.' });
    });
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
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <img
          src={driver.avatar_url || `https://picsum.photos/seed/${driver.id}/100/100`}
          alt={driver.name}
          className="h-20 w-20 rounded-full object-cover mx-auto mb-4 border-4 border-slate-100"
        />
        <h3 className="text-lg font-semibold text-slate-800">Payment for {driver.name}</h3>
        <p className="text-sm text-slate-500">Copy the driver's payment details below.</p>
        
        <div className="mt-6 space-y-3">
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
        
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfoModal;