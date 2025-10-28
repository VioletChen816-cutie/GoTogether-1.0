import React, { useState, useMemo } from 'react';
// FIX: Added RequestStatus to imports to use the enum.
import { Ride, Request, RideStatus, UserToRate, RequestStatus, AppNotification, NotificationEnumType } from '../types';
import Tabs from './Tabs';
import PostARide from './PostARide';
import RideCard from './RideCard';
import RequestCard from './RequestCard';
import { cancelRide, completeRide, submitRating, updateRequestStatus } from '../services/rideService';
import ConfirmationModal from './ConfirmationModal';
import RatingModal from './RatingModal';
import { useNotification } from '../providers/NotificationProvider';
import { markRequestNotificationAsRead } from '../services/notificationService';

interface DriverViewProps {
  onPostRide: (newRide: Omit<Ride, 'id' | 'driver' | 'passengers' | 'status' | 'ratings'>) => Promise<boolean>;
  postedRides: Ride[];
  driverRequests: Request[];
  notifications: AppNotification[];
  refreshData: () => void;
  onAcceptRequest: (request: Request) => void;
}

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A10.004 10.004 0 0012 10.5a4 4 0 118 0v6.5a4 4 0 11-8 0" /></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const DriverDashboard: React.FC<DriverViewProps> = ({ onPostRide, postedRides, driverRequests, notifications, refreshData, onAcceptRequest }) => {
  const [activeTab, setActiveTab] = useState('Post Ride');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [rideToCancelId, setRideToCancelId] = useState<string | null>(null);
  const [ratingModalState, setRatingModalState] = useState<{ isOpen: boolean; rideId: string; userToRate: UserToRate; } | null>(null);
  const { showNotification } = useNotification();

  const rideRequestsBadgeCount = useMemo(() => {
    const relevantTypes: NotificationEnumType[] = [
        NotificationEnumType.NewRequest,
        NotificationEnumType.PassengerCancelled,
    ];
    return notifications.filter(n => !n.is_read && relevantTypes.includes(n.type)).length;
  }, [notifications]);

  const driverTabs = [
    { name: 'Post Ride', icon: <PlusIcon /> },
    { name: 'Ride Requests', icon: <UsersIcon />, ...(rideRequestsBadgeCount > 0 && { badgeCount: rideRequestsBadgeCount }) },
    { name: 'My Posted Rides', icon: <ListIcon /> },
    { name: 'Ride History', icon: <ClockIcon /> }
  ];

  const activeAndCancelledRides = useMemo(() => {
    return postedRides
      .filter(ride => ride.status === RideStatus.Active || ride.status === RideStatus.Cancelled)
      .sort((a, b) => {
        if (a.status === RideStatus.Active && b.status !== RideStatus.Active) return -1;
        if (a.status !== RideStatus.Active && b.status === RideStatus.Active) return 1;
        return a.departureTime.getTime() - b.departureTime.getTime();
      });
  }, [postedRides]);

  const historicalRides = useMemo(() => {
    return postedRides
      .filter(ride => ride.status === RideStatus.Completed)
      .sort((a, b) => b.departureTime.getTime() - a.departureTime.getTime());
  }, [postedRides]);

  const handlePostRideSuccess = (success: boolean) => {
    if (success) {
      setActiveTab('My Posted Rides');
    }
  }

  const handleAccept = async (request: Request) => {
    try {
      // FIX: Argument of type '"accepted"' is not assignable to parameter of type 'RequestStatus'. Changed to use the enum value.
      await updateRequestStatus(request.id, RequestStatus.Accepted);
      await markRequestNotificationAsRead(request.id, NotificationEnumType.NewRequest);
      onAcceptRequest(request); // Trigger confirmation modal
      refreshData(); // Refresh data in the background
    } catch (error) {
      alert('Failed to accept request. The ride might be full.');
      console.error(error);
    }
  };

  const handleCancelRide = (rideId: string) => {
    if (cancellingId) return;
    setRideToCancelId(rideId);
  };
  
  const confirmCancelRide = async () => {
    if (!rideToCancelId) return;
    setCancellingId(rideToCancelId);
    try {
      await cancelRide(rideToCancelId);
      refreshData();
    } catch (error: any) {
      alert(`Failed to cancel ride: ${error.message}`);
    } finally {
      setCancellingId(null);
      setRideToCancelId(null);
    }
  };
  
  const handleCompleteRide = async (rideId: string) => {
    if (completingId) return;
    setCompletingId(rideId);
    try {
      await completeRide(rideId);
      showNotification({ type: 'success', message: 'Ride marked as completed!' });
      refreshData();
    } catch (error: any) {
      alert(`Failed to complete ride: ${error.message}`);
    } finally {
      setCompletingId(null);
    }
  };
  
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
      showNotification({ type: 'success', message: 'Rating submitted!' });
      refreshData();
    } catch (error) {
      showNotification({ type: 'error', message: 'Failed to submit rating.' });
    } finally {
      setRatingModalState(null);
    }
  };

  const pendingRequests = useMemo(() => {
    return driverRequests.filter(r => r.status === 'pending');
  }, [driverRequests]);


  return (
    <div>
      <Tabs tabs={driverTabs} activeTab={activeTab} onTabClick={setActiveTab} />
      <div className="mt-8">
        {activeTab === 'Post Ride' && <PostARide onPostRideSuccess={handlePostRideSuccess} onPostRide={onPostRide} />}
        
        {activeTab === 'Ride Requests' && (
           <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(req => 
                <RequestCard 
                  key={req.id} 
                  request={req} 
                  viewAs="driver" 
                  refreshData={refreshData}
                  onAccept={handleAccept}
                />
              )
            ) : (
              <div className="text-center text-slate-500 py-16">
                 <UsersIcon />
                <p className="font-semibold mt-4">No pending ride requests.</p>
                <p className="text-sm">New requests from passengers will appear here.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'My Posted Rides' && (
          <div className="space-y-4">
            {activeAndCancelledRides.length > 0 ? (
              activeAndCancelledRides.map(ride => 
                <RideCard 
                  key={ride.id} 
                  ride={ride} 
                  isDriverView={true} 
                  onCancel={handleCancelRide}
                  onComplete={handleCompleteRide}
                  isProcessing={cancellingId === ride.id || completingId === ride.id}
                />
              )
            ) : (
              <div className="text-center text-slate-500 py-16">
                 <ListIcon />
                <p className="font-semibold mt-4">You have no active rides.</p>
                <p className="text-sm">Click on "Post Ride" to get started.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'Ride History' && (
          <div className="space-y-4">
            {historicalRides.length > 0 ? (
              historicalRides.map(ride => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  isDriverView={true}
                  onRatePassenger={handleOpenRatingModal}
                />
              ))
            ) : (
              <div className="text-center text-slate-500 py-16">
                 <ClockIcon />
                <p className="font-semibold mt-4">No completed rides</p>
                <p className="text-sm">Your completed rides will be shown here.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={!!rideToCancelId}
        onClose={() => setRideToCancelId(null)}
        onConfirm={confirmCancelRide}
        title="Confirm Ride Cancellation"
        message="Are you sure you want to cancel this ride? This will notify all affected passengers and cannot be undone."
        confirmText="Yes, Cancel Ride"
        isProcessing={!!cancellingId}
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

export default DriverDashboard;