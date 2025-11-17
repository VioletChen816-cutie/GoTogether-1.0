import React, { useState, useMemo } from 'react';
import { Ride, Request, UserToRate, AppNotification, NotificationEnumType, FeedItem, PassengerRideRequest, RequestStatus, RideStatus } from '../types';
import Tabs from './Tabs';
import FindARide from './FindARide';
import RequestCard from './RequestCard';
import { useNotification } from '../providers/NotificationProvider';
import RideCard from './RideCard';
import { markNotificationsAsReadByType } from '../services/notificationService';
import { useAuth } from '../providers/AuthProvider';
import PassengerRideRequestCard from './PassengerRideRequestCard';

interface PassengerViewProps {
  feedItems: FeedItem[];
  passengerRequests: Request[];
  myPassengerRequests?: PassengerRideRequest[];
  notifications: AppNotification[];
  setNotifications?: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  refreshData: () => void;
  onOpenRatingModal: (rideId: string, userToRate: UserToRate) => void;
  onRequestFulfilled?: (request: Request) => void;
}

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const SuitcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


const PassengerView: React.FC<PassengerViewProps> = ({ feedItems, passengerRequests, myPassengerRequests = [], notifications, setNotifications, refreshData, onOpenRatingModal, onRequestFulfilled }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Find Rides');
  
  const acceptedRequests = passengerRequests.filter(r => r.status === 'accepted' && r.ride.status !== 'completed');
  const historicalRequests = passengerRequests.filter(r => r.ride.status === 'completed');

  const relevantTypesForMyRequests: NotificationEnumType[] = [
      NotificationEnumType.RequestAccepted,
      NotificationEnumType.RequestRejected,
      NotificationEnumType.DriverCancelledRide,
      NotificationEnumType.BookingCancelled,
      NotificationEnumType.PassengerRequestAccepted,
  ];

  const myRequestsBadgeCount = useMemo(() => {
    return notifications.filter(n => !n.is_read && relevantTypesForMyRequests.includes(n.type)).length;
  }, [notifications, relevantTypesForMyRequests]);
  
  const combinedRequests = useMemo(() => {
    // When a driver offers to fulfill a passenger's request, a new `Request` object is created
    // with status 'pending-passenger-approval'. The original `PassengerRideRequest` is also
    // updated to this status. To avoid showing two cards for the same event, we filter out
    // the original `PassengerRideRequest` because the card for the `Request` object contains
    // the necessary "Accept" and "Reject" actions.
    const pendingOfferSourceIds = new Set(
      passengerRequests
        .filter(r => r.status === RequestStatus.PendingPassengerApproval && r.ride.fulfilledFromRequestId)
        .map(r => r.ride.fulfilledFromRequestId)
    );

    const filteredMyPassengerRequests = myPassengerRequests.filter(
      prr => !pendingOfferSourceIds.has(prr.id)
    );

    // Combine the two arrays.
    const allRequests: (Request | PassengerRideRequest)[] = [...passengerRequests, ...filteredMyPassengerRequests];

    const getItemDate = (item: Request | PassengerRideRequest): Date => {
      return 'ride' in item ? item.ride.departureTime : item.departureDate;
    };

    const isActive = (item: Request | PassengerRideRequest): boolean => {
      const now = new Date();
      if ('ride' in item) { // It's a Request to join a driver's ride
        return (item.status === RequestStatus.Pending || item.status === RequestStatus.Accepted || item.status === RequestStatus.PendingPassengerApproval) &&
               item.ride.status === RideStatus.Active &&
               new Date(item.ride.departureTime).getTime() > now.getTime();
      } else { // It's a PassengerRideRequest
        const isActiveStatus = item.status === 'open' || item.status === 'pending-passenger-approval';
        if (!isActiveStatus) {
          return false;
        }
        // Compare dates by ignoring the time part
        const today = new Date();
        const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const requestDateStr = new Date(item.departureDate).toISOString().split('T')[0];
        return requestDateStr >= todayStr;
      }
    };

    allRequests.sort((a, b) => {
      const aIsActive = isActive(a);
      const bIsActive = isActive(b);
      const dateA = getItemDate(a).getTime();
      const dateB = getItemDate(b).getTime();

      // Group active requests before inactive ones
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      // Sort within the active group chronologically (soonest first)
      if (aIsActive) {
        return dateA - dateB;
      } 
      
      // Sort within the inactive group reverse-chronologically (most recent first)
      return dateB - dateA;
    });

    return allRequests;
  }, [passengerRequests, myPassengerRequests]);

  const passengerTabs = useMemo(() => {
    const tabs = [{ name: 'Find Rides', icon: <SearchIcon /> }];
    if (user) {
      tabs.push(
        { name: 'My Requests', icon: <BellIcon />, ...(myRequestsBadgeCount > 0 && { badgeCount: myRequestsBadgeCount }) },
        { name: 'My Trips', icon: <SuitcaseIcon /> },
        { name: 'Ride History', icon: <ClockIcon /> }
      );
    }
    return tabs;
  }, [user, myRequestsBadgeCount]);


  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === 'My Requests' && setNotifications) {
        const notificationsToUpdate = notifications.filter(n =>
            !n.is_read && relevantTypesForMyRequests.includes(n.type)
        );

        if (notificationsToUpdate.length > 0) {
            // Optimistic UI update
            const updatedNotifications = notifications.map(n =>
                notificationsToUpdate.some(u => u.id === n.id) ? { ...n, is_read: true } : n
            );
            setNotifications(updatedNotifications);

            // Update in the background
            markNotificationsAsReadByType(relevantTypesForMyRequests).catch(error => {
                console.error("Failed to mark notifications as read:", error);
                // Optionally revert state or rely on next refreshData call
            });
        }
    }
  };


  return (
    <div>
      <Tabs tabs={passengerTabs} activeTab={activeTab} onTabClick={handleTabClick} />
      <div className="mt-8">
        {activeTab === 'Find Rides' && <FindARide feedItems={feedItems} passengerRequests={passengerRequests} refreshData={refreshData} onRateDriver={onOpenRatingModal} onRequestFulfilled={onRequestFulfilled} />}
        {activeTab === 'My Requests' && (
          <div className="space-y-6">
            {combinedRequests.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-3">All My Requests</h3>
                <div className="space-y-4">
                  {combinedRequests.map(req => {
                    // Type guard to determine which card to render
                    if ('ride' in req) {
                      // This is a Request to join a driver's ride
                      return <RequestCard key={`req-${req.id}`} request={req} viewAs="passenger" refreshData={refreshData}/>;
                    } else {
                      // This is a PassengerRideRequest posted by the user
                      return <PassengerRideRequestCard 
                        key={`prr-${req.id}`} 
                        request={req} 
                        refreshData={refreshData}
                      />;
                    }
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-16">
                  <BellIcon />
                  <p className="font-semibold mt-4">You haven't posted or requested any rides.</p>
                  <p className="text-sm">Use the "Find Rides" tab to get started.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'My Trips' && (
           <div className="space-y-4">
            {acceptedRequests.length > 0 ? (
              acceptedRequests.map(req => <RequestCard key={req.id} request={req} viewAs="passenger" refreshData={refreshData}/>)
            ) : (
              <div className="text-center text-slate-500 py-16">
                <SuitcaseIcon />
                <p className="font-semibold mt-4">You have no upcoming trips.</p>
                <p className="text-sm">Accepted ride requests will appear here.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'Ride History' && (
           <div className="space-y-4">
            {historicalRequests.length > 0 ? (
              historicalRequests.map(req => (
                <RideCard
                  key={req.ride.id}
                  ride={req.ride}
                  onRateDriver={onOpenRatingModal}
                  isHistoryView={true}
                />
              ))
            ) : (
              <div className="text-center text-slate-500 py-16">
                 <ClockIcon />
                <p className="font-semibold mt-4">No ride history.</p>
                <p className="text-sm">Your past trips will be shown here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerView;
