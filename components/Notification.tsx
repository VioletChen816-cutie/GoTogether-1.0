import React from 'react';
import { useNotification } from '../providers/NotificationProvider';

const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const icons = {
  success: <SuccessIcon />,
  info: <InfoIcon />,
  error: <ErrorIcon />,
};

const Notification: React.FC = () => {
  const { notification } = useNotification();
  if (!notification) return null;

  const { message, type, visible } = notification;

  return (
    <div
      className={`fixed top-5 right-5 z-[100] transition-all duration-300 ease-in-out
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}
    >
      <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {icons[type]}
            </div>
            <div className="ml-3 flex-1 pt-0.5">
              <p className="text-sm font-medium text-slate-900">{message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;