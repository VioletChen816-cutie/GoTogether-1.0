import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserRole, Ride, Request, AppNotification, UserToRate, FeedItem, PassengerRideRequest, NotificationEnumType, RideStatus, RequestStatus } from '../types';
import RoleSwitcher from './RoleSwitcher';
import PassengerView from './PassengerView';
import DriverView from './DriverView.tsx';
import ProfileSettings from './ProfileSettings';
import { useAuth } from '../providers/AuthProvider';
import { useNotification } from '../providers/NotificationProvider';
import { supabase } from '../lib/supabaseClient';
import RideConfirmationModal from './RideConfirmationModal';
import RatingModal from './RatingModal';
import RideCompletionModal from './RideCompletionModal';
import { submitRating } from '../services/rideService';

interface AuthenticatedAppProps {
    feedItems: FeedItem[];
    driverRides: Ride[];
    onPostRide: (newRide: Omit<Ride, 'id' | 'driver' | 'passengers' | 'status' | 'ratings' | 'itemType'>) => Promise<boolean>;
    passengerRequests: Request[];
    myPassengerRequests: PassengerRideRequest[];
    driverRequests: Request[];
    notifications: AppNotification[];
    setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
    refreshData: () => void;
    setView: (view: 'app' | 'profile') => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps & { view: 'app' | 'profile' }> = ({ feedItems, driverRides, onPostRide, passengerRequests, myPassengerRequests, driverRequests, notifications, setNotifications, refreshData, view, setView }) => {
    const [role, setRole] = useState<UserRole>(UserRole.Passenger);
    const { user, profile } = useAuth();
    const { showNotification } = useNotification();
    const [confirmedRequest, setConfirmedRequest] = useState<Request | null>(null);
    const [confirmedRequestExtras, setConfirmedRequestExtras] = useState<{ flexibleTime?: string; notes?: string | null }>({});
    const [rideToShowCompletion, setRideToShowCompletion] = useState<Request | null>(null);

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
                    event: 'INSERT',
                    schema: 'public',
                    table: 'requests',
                    filter: `passenger_id=eq.${user.id}`
                },
                (payload) => {
                    refreshData();
                }
            )
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

    // Check for newly accepted or completed rides to show relevant pop-up modals for both passengers and drivers.
    useEffect(() => {
        if (!user) return;
    
        // --- Passenger Modal Logic ---
        if (role === UserRole.Passenger) {
            // Check for newly accepted rides to show confirmation modal
            const shownConfirmationsKey = `goTogether_shownConfirmationModals_${user.id}`;
            const shownConfirmationIds = JSON.parse(localStorage.getItem(shownConfirmationsKey) || '[]');
            const newlyAcceptedRequest = passengerRequests.find(req =>
                req.status === RequestStatus.Accepted && !shownConfirmationIds.includes(req.id)
            );
    
            if (newlyAcceptedRequest) {
                setTimeout(() => {
                    if (newlyAcceptedRequest.ride.fulfilledFromRequestId) {
                        const originalPassengerRequest = myPassengerRequests.find(prr => prr.id === newlyAcceptedRequest.ride.fulfilledFromRequestId);
                         if (originalPassengerRequest) {
                            setConfirmedRequestExtras({
                                flexibleTime: originalPassengerRequest.flexibleTime,
                                notes: originalPassengerRequest.notes
                            });
                        }
                    }
                    setConfirmedRequest(newlyAcceptedRequest);
                    const newShownIds = [...new Set([...shownConfirmationIds, newlyAcceptedRequest.id])];
                    localStorage.setItem(shownConfirmationsKey, JSON.stringify(newShownIds));
                }, 500);
                return; // Show one modal at a time
            }
    
            // Check for newly completed rides to show rating modal
            const shownCompletionsKey = `goTogether_shownCompletionModals_${user.id}`;
            const shownCompletionIds = JSON.parse(localStorage.getItem(shownCompletionsKey) || '[]');
            const unratedCompletedRequest = passengerRequests.find(req =>
                req.ride.status === 'completed' &&
                !req.ride.ratings.some(r => r.rater_id === user.id && r.ratee_id === req.ride.driver.id) &&
                !shownCompletionIds.includes(req.ride.id)
            );
    
            if (unratedCompletedRequest) {
                setTimeout(() => {
                    setRideToShowCompletion(unratedCompletedRequest);
                    const newShownIds = [...new Set([...shownCompletionIds, unratedCompletedRequest.ride.id])];
                    localStorage.setItem(shownCompletionsKey, JSON.stringify(newShownIds));
                }, 500);
                return; // Show one modal at a time
            }
        }
        
        // --- Driver Modal Logic ---
        if (role === UserRole.Driver) {
            const shownDriverConfirmationsKey = `goTogether_shownDriverConfirmationModals_${user.id}`;
            const shownConfirmationIds = JSON.parse(localStorage.getItem(shownDriverConfirmationsKey) || '[]');
            const newlyAcceptedByPassenger = driverRequests.find(req =>
                req.status === RequestStatus.Accepted &&
                req.ride.fulfilledFromRequestId && // This indicates it was an offer they made
                !shownConfirmationIds.includes(req.id)
            );
    
            if (newlyAcceptedByPassenger) {
                setTimeout(() => {
                    setConfirmedRequest(newlyAcceptedByPassenger);
                    const newShownIds = [...new Set([...shownConfirmationIds, newlyAcceptedByPassenger.id])];
                    localStorage.setItem(shownDriverConfirmationsKey, JSON.stringify(newShownIds));
                }, 500);
            }
        }
    }, [passengerRequests, myPassengerRequests, driverRequests, user, role]);

    if (view === 'profile') {
        return <ProfileSettings backToApp={() => setView('app')} />;
    }

    const handleCloseConfirmation = () => {
        setConfirmedRequest(null);
        setConfirmedRequestExtras({});
    };

    const handleRequestFulfilledByDriver = (newlyCreatedRequest: Request) => {
        // Find the original PassengerRideRequest to get notes/flexibleTime
        const originalRequest = myPassengerRequests.find(prr => prr.id === newlyCreatedRequest.ride.fulfilledFromRequestId);
        if(originalRequest) {
            setConfirmedRequestExtras({
                flexibleTime: originalRequest.flexibleTime,
                notes: originalRequest.notes,
            });
        }
        setConfirmedRequest(newlyCreatedRequest);
    };

    return (
        <div>
            <RoleSwitcher currentRole={role} onRoleChange={setRole} />
             <div className="mt-8">
                {role === UserRole.Passenger ? (
                    <PassengerView
                        feedItems={feedItems}
                        passengerRequests={passengerRequests}
                        myPassengerRequests={myPassengerRequests}
                        notifications={notifications}
                        setNotifications={setNotifications}
                        refreshData={refreshData}
                        onOpenRatingModal={handleOpenRatingModal}
                        onRequestFulfilled={handleRequestFulfilledByDriver}
                    />
                ) : (
                    <DriverView 
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
                currentUserProfile={profile}
                onClose={handleCloseConfirmation}
                flexibleTime={confirmedRequestExtras.flexibleTime}
                notes={confirmedRequestExtras.notes}
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
