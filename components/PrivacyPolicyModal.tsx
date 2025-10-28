import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Privacy Policy</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-slate-700 space-y-4 text-sm">
            <p className="text-xs text-slate-500">Effective Date: October 26, 2023</p>
            <p>This is a placeholder for the Privacy Policy. A complete policy would detail:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
                <li>What personal information is collected (e.g., name, email, location data, ride history).</li>
                <li>How the information is used (e.g., to connect drivers and passengers, process payments, improve the service).</li>
                <li>How the information is shared (e.g., with other users for a ride, with third-party service providers).</li>
                <li>Data security measures in place.</li>
                <li>User rights regarding their data (e.g., access, correction, deletion).</li>
                <li>Use of cookies and other tracking technologies.</li>
                <li>Contact information for privacy-related inquiries.</li>
            </ul>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right flex-shrink-0">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;