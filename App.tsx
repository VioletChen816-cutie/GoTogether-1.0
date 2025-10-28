import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ride, Request, AppNotification } from './types';
import { getRides, addRide, getPassengerRequests, getDriverRequests, getDriverRides } from './services/rideService';
import { getNotificationsForUser } from './services/notificationService';
import Header from './components/Header';
import PassengerView from './components/PassengerView';
import AuthenticatedApp from './components/AuthenticatedApp';
import AuthModal from './components/AuthModal';
import { useAuth } from './providers/AuthProvider';
import Notification from './components/Notification';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [driverRides, setDriverRides] = useState<Ride[]>([]);
  const [passengerRequests, setPassengerRequests] = useState<Request[]>([]);
  const [driverRequests, setDriverRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'app' | 'profile'>('app');
  const isInitialLoad = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [ridesData, pRequests, dRequests, driverRidesData, notificationsData] = await Promise.all([
        getRides(),
        user ? getPassengerRequests() : Promise.resolve([]),
        user ? getDriverRequests() : Promise.resolve([]),
        user ? getDriverRides() : Promise.resolve([]),
        user ? getNotificationsForUser() : Promise.resolve([]),
      ]);
      setRides(ridesData);
      setPassengerRequests(pRequests);
      setDriverRequests(dRequests);
      setDriverRides(driverRidesData);
      setNotifications(notificationsData);
      setError(null);
    } catch (err: any) {
      setError('Failed to load data. Please try again later.');
      console.error(err.message || err);
    } finally {
      setDataLoading(false);
      isInitialLoad.current = false;
    }
  }, [user]);

  useEffect(() => {
    // Don't fetch data until we know the user's authentication status
    // to avoid race conditions.
    if (authLoading) return;
    fetchData();
  }, [authLoading, fetchData]);

  // Real-time notification listener
  useEffect(() => {
    if (!user || !supabase) return;

    // FIX: Removed generic type argument from `.on()` to prevent "Untyped function calls may not accept type arguments" error.
    // This is often caused by a missing Supabase client type definition, but the explicit cast of `payload.new` maintains functionality.
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

  const handleAddRide = useCallback(async (newRide: Omit<Ride, 'id' | 'driver' | 'passengers' | 'status' | 'ratings'>) => {
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

  if (authLoading || (dataLoading && isInitialLoad.current)) {
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
            {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
            {user ? (
              <AuthenticatedApp
                allRides={rides}
                driverRides={driverRides}
                onPostRide={handleAddRide}
                passengerRequests={passengerRequests}
                driverRequests={driverRequests}
                notifications={notifications}
                setNotifications={setNotifications}
                refreshData={fetchData}
                view={view}
                setView={setView}
              />
            ) : (
              <PassengerView allRides={rides} passengerRequests={[]} notifications={[]} refreshData={fetchData} />
            )}
          </main>
        </div>
      </div>
      <Notification />
      <AuthModal />
    </>
  );
};

export default App;