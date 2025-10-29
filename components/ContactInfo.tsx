import React from 'react';
import { useNotification } from '../providers/NotificationProvider';

// --- Component Props ---
// rideConfirmed: Boolean to check if the ride is confirmed.
// userPhoneNumber: The phone number to display and copy.
interface ContactInfoProps {
  rideConfirmed: boolean;
  userPhoneNumber: string | null | undefined;
}

// --- SVG Icons ---
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.76a11.024 11.024 0 006.292 6.292l.76-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>;
const ClipboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;


const ContactInfo: React.FC<ContactInfoProps> = ({ rideConfirmed, userPhoneNumber }) => {
  // Use existing notification provider to show a toast message.
  const { showNotification } = useNotification();

  // --- Copy to Clipboard Handler ---
  // Uses the browser's Clipboard API to copy the phone number.
  // Shows a success notification upon completion.
  const handleCopyNumber = () => {
    if (!userPhoneNumber) return;
    navigator.clipboard.writeText(userPhoneNumber).then(() => {
      showNotification({ type: 'success', message: 'Number copied!' });
    }).catch(err => {
      console.error('Failed to copy number: ', err);
      showNotification({ type: 'error', message: 'Could not copy number.' });
    });
  };

  // --- Conditional Rendering ---
  // If the ride is not confirmed, show a placeholder message.
  if (!rideConfirmed) {
    return (
      <div className="mt-4 p-4 bg-slate-100 rounded-lg text-center">
          <div className="flex justify-center">
            <LockIcon />
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Contact info will be available once the ride is confirmed.
          </p>
      </div>
    );
  }

  // If the ride is confirmed, render the contact information card.
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-2">Contact Information</h4>
      <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PhoneIcon />
          <span className="font-semibold text-slate-800 tracking-wider">
            {userPhoneNumber || 'Not provided'}
          </span>
        </div>
        {userPhoneNumber && (
            <button
                onClick={handleCopyNumber}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-blue-600 border border-slate-300 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            >
                <ClipboardIcon />
                <span>Copy</span>
            </button>
        )}
      </div>
    </div>
  );
};

export default ContactInfo;
