
import React, { useState, useEffect, useCallback } from 'react';
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
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddRide = useCallback(async (newRide: Omit<Ride, 'id' | 'driver'>) => {
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

  if (authLoading || dataLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">Loading your rides...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Header />
        <main className="mt-8">
          {error && <div className="text-center text-red-500 p-4 bg-red-100 rounded-md">{error}</div>}
          {user ? (
            <AuthenticatedApp
              allRides={rides}
              onPostRide={handleAddRide}
              passengerRequests={passengerRequests}
              driverRequests={driverRequests}
              refreshData={fetchData}
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
