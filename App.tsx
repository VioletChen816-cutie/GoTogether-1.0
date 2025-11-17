import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ride, Request, AppNotification, FeedItem, PassengerRideRequest } from './types';
import { getFeedItems, addRide, getPassengerRequests, getDriverRequests, getDriverRides, getMyPassengerRideRequests } from './services/rideService';
import { getNotificationsForUser } from './services/notificationService';
import Header from './components/Header';
import PassengerView from './components/PassengerView';
import AuthenticatedApp from './components/AuthenticatedApp';
import AuthModal from './components/AuthModal';
import { useAuth } from './providers/AuthProvider';
import Notification from './components/Notification';
import { supabase } from './lib/supabaseClient';
import Footer from './components/Footer';
import SetupGuide from './components/SetupGuide';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [driverRides, setDriverRides] = useState<Ride[]>([]);
  const [passengerRequests, setPassengerRequests] = useState<Request[]>([]);
  const [myPassengerRequests, setMyPassengerRequests] = useState<PassengerRideRequest[]>([]);
  const [driverRequests, setDriverRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'app' | 'profile'>('app');
  const [needsDbSetup, setNeedsDbSetup] = useState(!supabase);
  const isInitialLoad = useRef(true);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    setNeedsDbSetup(false);

    if (!supabase) {
        setNeedsDbSetup(true);
        setError('Your Supabase credentials are not configured. Please follow the steps below.');
        setDataLoading(false);
        return;
    }

    const results = await Promise.allSettled([
      getFeedItems(),
      user ? getPassengerRequests() : Promise.resolve([]),
      user ? getDriverRequests() : Promise.resolve([]),
      user ? getDriverRides() : Promise.resolve([]),
      user ? getNotificationsForUser() : Promise.resolve([]),
      user ? getMyPassengerRideRequests() : Promise.resolve([]),
    ]);

    const [
      feedResult,
      pRequestsResult,
      dRequestsResult,
      driverRidesResult,
      notificationsResult,
      myPRequestsResult,
    ] = results;

    let hasError = false;
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        hasError = true;
        console.error(`Failed to fetch data for promise at index ${index}:`, result.reason);
      }
    });

    if (feedResult.status === 'fulfilled') {
      setFeedItems(feedResult.value);
    } else {
      const reason = feedResult.reason as any;
      if (reason?.message?.includes('Could not find the table')) {
        setNeedsDbSetup(true);
        setError('It looks like the database tables are missing. Please follow the steps below to set up your project.');
      } else {
        setError('Failed to load rides. Please try again later.');
      }
    }
    
    if (pRequestsResult.status === 'fulfilled') setPassengerRequests(pRequestsResult.value as Request[]);
    if (dRequestsResult.status === 'fulfilled') setDriverRequests(dRequestsResult.value as Request[]);
    if (driverRidesResult.status === 'fulfilled') setDriverRides(driverRidesResult.value as Ride[]);
    if (notificationsResult.status === 'fulfilled') setNotifications(notificationsResult.value as AppNotification[]);
    if (myPRequestsResult.status === 'fulfilled') setMyPassengerRequests(myPRequestsResult.value as PassengerRideRequest[]);
    
    if (hasError && feedResult.status === 'fulfilled') {
        console.warn('Some user-specific data failed to load, but the main feed is available.');
    }

    setDataLoading(false);
    isInitialLoad.current = false;
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchData();
  }, [authLoading, fetchData]);

  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase.channel(`notifications-for-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(current => [payload.new as AppNotification, ...current]);
        }
      ).on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(current => current.map(n => n.id === payload.new.id ? payload.new as AppNotification : n));
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    }
  }, [user]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel('passenger-ride-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'passenger_ride_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchData();
          } else if (payload.eventType === 'UPDATE') {
            setFeedItems(currentItems =>
              currentItems.map(item => {
                if (item.itemType === 'request' && item.id === payload.new.id) {
                  return {
                    ...item,
                    status: payload.new.status,
                  };
                }
                return item;
              })
            );
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    }
  }, [supabase, fetchData]);


  const handleAddRide = useCallback(async (newRide: Omit<Ride, 'id' | 'driver' | 'passengers' | 'status' | 'ratings' | 'itemType'>) => {
    try {
      await addRide(newRide);
      await fetchData();
      return true;
    } catch (error) {
      console.error("Failed to post ride:", error);
      alert("There was an error posting your ride. Please try again.");
      return false;
    }
  }, [fetchData]);

  if (authLoading || (dataLoading && isInitialLoad.current && !needsDbSetup)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        <div className="flex items-center space-x-3">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading your rides...</span>
        </div>
      </div>
    );
  }

  if (needsDbSetup) {
    return <SetupGuide onRetry={fetchData} error={error} />;
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Header
            setView={setView}
            notifications={notifications}
            setNotifications={setNotifications}
          />
          <main className="mt-8">
            {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md mb-6">{error}</div>}
            {user ? (
              <AuthenticatedApp
                feedItems={feedItems}
                driverRides={driverRides}
                onPostRide={handleAddRide}
                passengerRequests={passengerRequests}
                myPassengerRequests={myPassengerRequests}
                driverRequests={driverRequests}
                notifications={notifications}
                setNotifications={setNotifications}
                refreshData={fetchData}
                view={view}
                setView={setView}
              />
            ) : (
              <PassengerView
                feedItems={feedItems}
                passengerRequests={[]}
                notifications={[]}
                refreshData={fetchData}
                onOpenRatingModal={() => {}}
              />
            )}
          </main>
          <Footer />
        </div>
      </div>
      <Notification />
      <AuthModal />
    </>
  );
};

export default App;