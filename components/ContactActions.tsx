import React, { useState } from 'react';
import { useNotification } from '../providers/NotificationProvider';

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

interface ContactActionsProps {
  phoneNumber: string | null | undefined;
  userType: 'driver' | 'passenger';
}

const ContactActions: React.FC<ContactActionsProps> = ({ phoneNumber, userType }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { showNotification } = useNotification();
  const sanitizedPhoneNumber = phoneNumber?.replace(/\D/g, '');

  const messageBody = userType === 'driver' 
    ? `Hi! This is your GoTogether driver.` 
    : `Hi! I'm your GoTogether passenger.`;

  const handleCopy = () => {
    if (!phoneNumber) return;
    navigator.clipboard.writeText(phoneNumber).then(() => {
      showNotification({ type: 'success', message: 'Number copied!' });
      setIsCopied(true);
    }).catch(err => {
      console.error('Failed to copy number: ', err);
      showNotification({ type: 'error', message: 'Could not copy number.' });
    });
  };

  if (!phoneNumber) {
    return <span className="text-xs text-slate-400 italic pr-2">No contact info</span>;
  }
  
  if (!isCopied) {
    return (
      <button
        onClick={handleCopy}
        className="px-4 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
      >
        Contact
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <a title="Chat via WhatsApp" href={`https://wa.me/${sanitizedPhoneNumber}?text=${encodeURIComponent(messageBody)}`} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-600 bg-white border border-slate-300 rounded-full hover:bg-slate-100 transition-colors">
        <WhatsAppIcon />
      </a>
      <a title="Message via iPhone" href={`sms:${sanitizedPhoneNumber}&body=${encodeURIComponent(messageBody)}`} className="p-2 text-slate-600 bg-white border border-slate-300 rounded-full hover:bg-slate-100 transition-colors">
        <MessageIcon />
      </a>
    </div>
  );
};

export default ContactActions;
