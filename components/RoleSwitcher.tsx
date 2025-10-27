import React from 'react';
import { UserRole } from '../types';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  const baseClasses = "px-6 py-2 rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm";
  const activeClasses = "bg-white text-blue-600 shadow-sm";
  const inactiveClasses = "bg-transparent text-slate-600 hover:text-blue-600";
  
  return (
    <div className="flex justify-center items-center space-x-2">
      <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
        <button
          onClick={() => onRoleChange(UserRole.Passenger)}
          className={`${baseClasses} ${currentRole === UserRole.Passenger ? activeClasses : inactiveClasses}`}
        >
          Passenger
        </button>
        <button
          onClick={() => onRoleChange(UserRole.Driver)}
          className={`${baseClasses} ${currentRole === UserRole.Driver ? activeClasses : inactiveClasses}`}
        >
          Driver
        </button>
      </div>
    </div>
  );
};

export default RoleSwitcher;