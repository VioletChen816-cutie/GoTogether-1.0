import React, { useState } from 'react';
import { useNotification } from '../providers/NotificationProvider';

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

// --- Component Props ---
interface ContactDriverProps {
  driverName: string;
  driverPhotoUrl: string | null;
  driverPhoneNumber: string | null | undefined;
  driverId: string;
  rideConfirmed: boolean;
}

const ContactDriver: React.FC<ContactDriverProps> = ({
  driverName,
  driverPhotoUrl,
  driverPhoneNumber,
  driverId,
  rideConfirmed,
}) => {
  // --- State & Hooks ---
  // State to track if the main "Contact" button has been clicked.
  const [isNumberCopied, setIsNumberCopied] = useState(false);
  // Use existing notification provider to show a toast message.
  const { showNotification } = useNotification();

  // --- Phone Number Sanitization ---
  // Removes non-digit characters for clean links (e.g., for WhatsApp).
  const sanitizedPhoneNumber = driverPhoneNumber?.replace(/\D/g, '');

  // --- Event Handler ---
  // Copies the driver's number to the clipboard and reveals secondary contact options.
  const handleContactClick = () => {
    if (!driverPhoneNumber) return;
    navigator.clipboard.writeText(driverPhoneNumber).then(() => {
      showNotification({ type: 'success', message: "Driver's number copied!" });
      // Reveal secondary buttons after a successful copy.
      setIsNumberCopied(true);
    }).catch(err => {
      console.error('Failed to copy number: ', err);
      showNotification({ type: 'error', message: 'Could not copy number.' });
    });
  };

  // --- Conditional Rendering: Ride Not Confirmed ---
  if (!rideConfirmed) {
    return (
      <div className="text-center p-4">
        <p className="text-sm text-slate-500">
          You’ll be able to contact your driver once the ride is confirmed.
        </p>
      </div>
    );
  }
  
  // --- Conditional Rendering: No Phone Number Provided ---
  if (!driverPhoneNumber) {
    return (
      <div className="text-center p-4">
        <p className="text-sm text-slate-500">
          The driver has not provided a contact number.
        </p>
      </div>
    );
  }

  // --- Main Component Render ---
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* Driver Info Header */}
      <div className="flex items-center space-x-3 mb-4">
        <img
          src={driverPhotoUrl || `https://picsum.photos/seed/${driverId}/100/100`}
          alt={driverName}
          className="h-12 w-12 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-slate-800">{driverName}</p>
          <p className="text-sm text-slate-500">Driver</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center space-y-2">
        {/* Primary "Contact" button shows initially */}
        {!isNumberCopied && (
          <button
            onClick={handleContactClick}
            className="w-full px-4 py-2.5 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Contact Driver
          </button>
        )}

        {/* Secondary buttons appear after the number is copied */}
        {isNumberCopied && (
          <div className="w-full text-center">
            <p className="text-sm text-green-600 mb-3 font-medium">✓ Number copied to clipboard!</p>
            <div className="flex justify-center space-x-2">
                <a
                    href={`https://wa.me/${sanitizedPhoneNumber}?text=Hi! I'm your rideshare match.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded-full hover:bg-slate-100 hover:border-slate-400 transition-colors"
                >
                    <WhatsAppIcon />
                    <span>WhatsApp</span>
                </a>
                <a
                    href={`sms:${sanitizedPhoneNumber}&body=Hi! I'm your rideshare match.`}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded-full hover:bg-slate-100 hover:border-slate-400 transition-colors"
                >
                    <MessageIcon />
                    <span>Message</span>
                </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactDriver;
