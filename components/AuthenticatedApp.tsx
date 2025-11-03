import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserRole, Ride, Request, AppNotification, UserToRate } from '../types';
import RoleSwitcher from './RoleSwitcher';
import PassengerView from './PassengerView';
import { default as DriverModeView } from '../DriverView';
import ProfileSettings from './ProfileSettings';
import { useAuth } from '../providers/AuthProvider';
import { useNotification } from '../providers/NotificationProvider';
import { supabase } from '../lib/supabaseClient';
import RideConfirmationModal from './RideConfirmationModal';
import RatingModal from './RatingModal';
import RideCompletionModal from './RideCompletionModal';
import { submitRating } from '../services/rideService';

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
    const [rideToShowCompletion, setRideToShowCompletion] = useState<Request | null>(null);
    const rideCheckedRef = useRef(false);

    // Centralized state for the rating modal
    const [ratingModalState, setRatingModalState] = useState<{ isOpen: boolean; rideId: string; userToRate: UserToRate; } | null>(null);

    const passengerUsernameMap = useMemo(() => {
        const map = new Map<string, string | undefined>();
        driverRequests.forEach(req => {
            if (req.passenger.username) {
                map.set(req.passenger.id, req.passenger.username);
            }
        });
        return map;
    }, [driverRequests]);

    const augmentedDriverRides = useMemo(() => {
        return driverRides.map(ride => ({
            ...ride,
            passengers: ride.passengers.map(p => ({
                ...p,
                username: p.username || passengerUsernameMap.get(p.id)
            }))
        }));
    }, [driverRides, passengerUsernameMap]);

    const handleOpenRatingModal = (rideId: string, userToRate: UserToRate) => {
        setRatingModalState({ isOpen: true, rideId, userToRate });
    };

    const handleRatingSubmit = async (rating: number, comment?: string) => {
        if (!ratingModalState) return;
        try {
            await submitRating({
                rideId: ratingModalState.rideId,
                rateeId: ratingModalState.userToRate.id,
                rating,
                comment,
            });
            showNotification({ type: 'success', message: 'Your rating has been submitted!' });
            refreshData();
        } catch (error) {
            showNotification({ type: 'error', message: 'Failed to submit rating.' });
        } finally {
            setRatingModalState(null);
        }
    };
    
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
                            const fullRequest = passengerRequests.find(r => r.id === payload.new.id);
                            if (fullRequest) {
                                setConfirmedRequest(fullRequest);
                            }
                        }
                        refreshData();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, showNotification, refreshData, passengerRequests, driverRequests]);

    // Check for completed rides to show the post-ride summary modal
    useEffect(() => {
        if (passengerRequests.length > 0 && user && !rideCheckedRef.current && role === UserRole.Passenger) {
            const unratedCompletedRequest = passengerRequests.find(req =>
                req.ride.status === 'completed' &&
                !req.ride.ratings.some(r => r.rater_id === user.id && r.ratee_id === req.ride.driver.id)
            );

            if (unratedCompletedRequest) {
                // Use a short timeout to prevent the modal from flashing aggressively on load
                setTimeout(() => {
                    setRideToShowCompletion(unratedCompletedRequest);
                }, 500);
            }
            rideCheckedRef.current = true; // Mark as checked so it only runs once per session
        }
    }, [passengerRequests, user, role]);

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
                    <PassengerView
                        allRides={allRides}
                        passengerRequests={passengerRequests}
                        notifications={notifications}
                        setNotifications={setNotifications}
                        refreshData={refreshData}
                        onOpenRatingModal={handleOpenRatingModal}
                    />
                ) : (
                    <DriverModeView 
                        onPostRide={onPostRide}
                        postedRides={augmentedDriverRides}
                        driverRequests={driverRequests}
                        notifications={notifications}
                        refreshData={refreshData}
                        onAcceptRequest={setConfirmedRequest}
                        onOpenRatingModal={handleOpenRatingModal}
                    />
                )}
            </div>
            <RideConfirmationModal 
                request={confirmedRequest}
                userRole={role === UserRole.Driver ? 'driver' : 'passenger'}
                onClose={handleCloseConfirmation}
            />
             <RideCompletionModal
                request={rideToShowCompletion}
                onClose={() => setRideToShowCompletion(null)}
                onRateDriver={(rideId, userToRate) => {
                    setRideToShowCompletion(null);
                    handleOpenRatingModal(rideId, userToRate);
                }}
            />
            {ratingModalState?.isOpen && (
                <RatingModal
                    isOpen={ratingModalState.isOpen}
                    userToRate={ratingModalState.userToRate}
                    onClose={() => setRatingModalState(null)}
                    onSubmit={handleRatingSubmit}
                />
            )}
        </div>
    );
};

export default AuthenticatedApp;