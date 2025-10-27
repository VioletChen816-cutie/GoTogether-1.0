import React, { useState, useMemo } from 'react';
import { UserRole, Ride, Request } from '../types';
import RoleSwitcher from './RoleSwitcher';
import PassengerView from './PassengerView';
import DriverView from './DriverView';
import ProfileSettings from './ProfileSettings';
import { useAuth } from '../providers/AuthProvider';

interface AuthenticatedAppProps {
    allRides: Ride[];
    onPostRide: (newRide: Omit<Ride, 'id' | 'driver'>) => Promise<boolean>;
    passengerRequests: Request[];
    driverRequests: Request[];
    refreshData: () => void;
    setView: (view: 'app' | 'profile') => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps & { view: 'app' | 'profile' }> = ({ allRides, onPostRide, passengerRequests, driverRequests, refreshData, view, setView }) => {
    const [role, setRole] = useState<UserRole>(UserRole.Passenger);
    const { user } = useAuth();

    const userPostedRides = useMemo(() => {
        if (!user) return [];
        return allRides.filter(r => r.driver?.id === user.id);
    }, [allRides, user]);

    if (view === 'profile') {
        return <ProfileSettings backToApp={() => setView('app')} />;
    }

    return (
        <div>
            <RoleSwitcher currentRole={role} onRoleChange={setRole} />
             <div className="mt-8">
                {role === UserRole.Passenger ? (
                    <PassengerView allRides={allRides} passengerRequests={passengerRequests} refreshData={refreshData} />
                ) : (
                    <DriverView 
                        onPostRide={onPostRide}
                        postedRides={userPostedRides}
                        driverRequests={driverRequests}
                        refreshData={refreshData}
                    />
                )}
            </div>
        </div>
    );
};

export default AuthenticatedApp;