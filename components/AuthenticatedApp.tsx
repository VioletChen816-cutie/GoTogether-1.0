import React, { useState, useEffect } from 'react';
import { UserRole, Ride, Request, AppNotification } from '../types';
import RoleSwitcher from './RoleSwitcher';
import PassengerView from './PassengerView';
import DriverDashboard from './DriverView';
import ProfileSettings from './ProfileSettings';
import { useAuth } from '../providers/AuthProvider';
import { useNotification } from '../providers/NotificationProvider';
import { supabase } from '../lib/supabaseClient';
import RideConfirmationModal from './RideConfirmationModal';

interface AuthenticatedAppProps {
    allRides: Ride[];
    driverRides: Ride[];
    onPostRide: (newRide: Omit<Ride, 'id' | 'driver' | 'passengers' | 'status' | 'ratings'>) => Promise<boolean>;
    passengerRequests: Request[];
    driverRequests: Request[];
    notifications: AppNotification[];
    setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
    refreshData: () => void;
    setView: (view: 'app' | 'profile') => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps & { view: 'app' | 'profile' }> = ({ allRides, driverRides, onPostRide, passengerRequests, driverRequests, notifications, setNotifications, refreshData, view, setView }) => {
    const [role, setRole] = useState<UserRole>(UserRole.Passenger);
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [confirmedRequest, setConfirmedRequest] = useState<Request | null>(null);

    const userPostedRides = driverRides;
    
    useEffect(() => {
        if (!user || !supabase) return;

        const channel = supabase.channel(`requests-for-user-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'requests',
                    filter: `passenger_id=eq.${user.id}`
                },
                (payload) => {
                    const newStatus = payload.new.status;
                    const oldStatus = payload.old.status;

                    if (newStatus !== oldStatus) {
                        if (newStatus === 'accepted') {
                            // This popup is now handled by the notification system, but we can still show the confirmation modal
                            const confirmedReq = passengerRequests.find(r => r.id === payload.new.id) || 
                                                 driverRequests.find(r => r.id === payload.new.id)?.ride.passengers.some(p => p.id === user.id) && driverRequests.find(r => r.id === payload.new.id);
                            
                            const fullRequest = passengerRequests.find(r => r.id === payload.new.id);

                            if (fullRequest) {
                                setConfirmedRequest(fullRequest);
                            }
                        }
                        // Refresh data to update UI state immediately
                        refreshData();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, showNotification, refreshData, passengerRequests, driverRequests]);

    if (view === 'profile') {
        return <ProfileSettings backToApp={() => setView('app')} />;
    }

    const handleCloseConfirmation = () => {
        setConfirmedRequest(null);
    };

    return (
        <div>
            <RoleSwitcher currentRole={role} onRoleChange={setRole} />
             <div className="mt-8">
                {role === UserRole.Passenger ? (
                    <PassengerView allRides={allRides} passengerRequests={passengerRequests} notifications={notifications} setNotifications={setNotifications} refreshData={refreshData} />
                ) : (
                    <DriverDashboard 
                        onPostRide={onPostRide}
                        postedRides={userPostedRides}
                        driverRequests={driverRequests}
                        notifications={notifications}
                        refreshData={refreshData}
                        onAcceptRequest={setConfirmedRequest}
                    />
                )}
            </div>
            <RideConfirmationModal 
                request={confirmedRequest}
                // FIX: Type 'UserRole' is not assignable to type '"driver" | "passenger"'.
                userRole={role === UserRole.Driver ? 'driver' : 'passenger'}
                onClose={handleCloseConfirmation}
            />
        </div>
    );
};

export default AuthenticatedApp;