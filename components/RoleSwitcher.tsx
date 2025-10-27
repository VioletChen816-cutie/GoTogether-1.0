
import React from 'react';
import { UserRole } from '../types';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  const baseClasses = "px-6 py-2 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";
  const activeClasses = "bg-blue-600 text-white shadow-md";
  const inactiveClasses = "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100";
  
  return (
    <div className="flex justify-center items-center space-x-2">
      <span className="text-gray-600 font-medium">View as:</span>
      <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
        <button
          onClick={() => onRoleChange(UserRole.Passenger)}
          className={`${baseClasses} ${currentRole === UserRole.Passenger ? activeClasses : inactiveClasses.replace('border', 'border-transparent')}`}
        >
          Passenger
        </button>
        <button
          onClick={() => onRoleChange(UserRole.Driver)}
          className={`${baseClasses} ${currentRole === UserRole.Driver ? activeClasses : inactiveClasses.replace('border', 'border-transparent')}`}
        >
          Driver
        </button>
      </div>
    </div>
  );
};

export default RoleSwitcher;
