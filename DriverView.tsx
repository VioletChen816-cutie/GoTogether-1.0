import React, { useState, useMemo } from 'react';
import { Ride, Request } from './types';
import Tabs from './components/Tabs';
import PostARide from './components/PostARide';
import RideCard from './components/RideCard';
import RequestCard from './components/RequestCard';

interface DriverViewProps {
  onPostRide: (newRide: Omit<Ride, 'id' | 'driver'>) => Promise<boolean>;
  postedRides: Ride[];
  driverRequests: Request[];
  refreshData: () => void;
}

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A10.004 10.004 0 0012 10.5a4 4 0 118 0v6.5a4 4 0 11-8 0" /></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const DriverView: React.FC<DriverViewProps> = ({ onPostRide, postedRides, driverRequests, refreshData }) => {
  const driverTabs = [
    { name: 'Post a Ride', icon: <PlusIcon /> },
    { name: 'Ride Requests', icon: <UsersIcon /> },
    { name: 'My Posted Rides', icon: <ListIcon /> },
    { name: 'Ride History', icon: <ClockIcon /> }
  ];
  const [activeTab, setActiveTab] = useState(driverTabs[0].name);

  const sortedPostedRides = useMemo(() => {
    return [...postedRides].sort((a, b) => {
      // Primary sort: Move full rides (0 seats) to the bottom.
      const aIsFull = a.seatsAvailable === 0;
      const bIsFull = b.seatsAvailable === 0;
  
      if (aIsFull && !bIsFull) {
        return 1; // a comes after b
      }
      if (!aIsFull && bIsFull) {
        return -1; // a comes before b
      }
  
      // Secondary sort: By departure time (earliest first).
      return a.departureTime.getTime() - b.departureTime.getTime();
    });
  }, [postedRides]);

  const handlePostRideSuccess = (success: boolean) => {
    if (success) {
      setActiveTab('My Posted Rides');
    }
  }

  const pendingRequests = useMemo(() => {
    return driverRequests.filter(r => r.status === 'pending');
  }, [driverRequests]);


  return (
    <div>
      <Tabs tabs={driverTabs} activeTab={activeTab} onTabClick={setActiveTab} />
      <div className="mt-8">
        {activeTab === 'Post a Ride' && <PostARide onPostRideSuccess={handlePostRideSuccess} onPostRide={onPostRide} />}
        
        {activeTab === 'Ride Requests' && (
           <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(req => <RequestCard key={req.id} request={req} viewAs="driver" refreshData={refreshData} />)
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
            {sortedPostedRides.length > 0 ? (
              sortedPostedRides.map(ride => <RideCard key={ride.id} ride={ride} isDriverView={true} />)
            ) : (
              <div className="text-center text-slate-500 py-16">
                 <ListIcon />
                <p className="font-semibold mt-4">You haven't posted any rides yet.</p>
                <p className="text-sm">Click on "Post a Ride" to get started.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'Ride History' && <div className="text-center text-slate-500 py-16">
             <ClockIcon />
            <p className="font-semibold mt-4">No past rides</p>
            <p className="text-sm">Your completed rides will be shown here.</p>
        </div>}
      </div>
    </div>
  );
};

export default DriverView;