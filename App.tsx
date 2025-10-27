import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ride, Request } from './types';
import { getRides, addRide, getPassengerRequests, getDriverRequests } from './services/rideService';
import Header from './components/Header';
import PassengerView from './components/PassengerView';
import AuthenticatedApp from './components/AuthenticatedApp';
import AuthModal from './components/AuthModal';
import { useAuth } from './providers/AuthProvider';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [passengerRequests, setPassengerRequests] = useState<Request[]>([]);
  const [driverRequests, setDriverRequests] = useState<Request[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'app' | 'profile'>('app');
  const isInitialLoad = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [ridesData, pRequests, dRequests] = await Promise.all([
        getRides(),
        user ? getPassengerRequests() : Promise.resolve([]),
        user ? getDriverRequests() : Promise.resolve([])
      ]);
      setRides(ridesData);
      setPassengerRequests(pRequests);
      setDriverRequests(dRequests);
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
    fetchData();
  }, [fetchData]);

  const handleAddRide = useCallback(async (newRide: Omit<Ride, 'id' | 'driver' | 'passengers'>) => {
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Header setView={setView} />
        <main className="mt-8">
          {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
          {user ? (
            <AuthenticatedApp
              allRides={rides}
              onPostRide={handleAddRide}
              passengerRequests={passengerRequests}
              driverRequests={driverRequests}
              refreshData={fetchData}
              view={view}
              setView={setView}
            />
          ) : (
            <PassengerView allRides={rides} passengerRequests={[]} refreshData={fetchData} />
          )}
        </main>
      </div>
      <AuthModal />
    </div>
  );
};

export default App;