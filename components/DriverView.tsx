
import React, { useState, useMemo } from 'react';
import { Ride, Request } from '../types';
import Tabs from './Tabs';
import PostARide from './PostARide';
import RideCard from './RideCard';
import RequestCard from './RequestCard';

interface DriverViewProps {
  onPostRide: (newRide: Omit<Ride, 'id' | 'driver'>) => Promise<boolean>;
  postedRides: Ride[];
  driverRequests: Request[];
  refreshData: () => void;
}

const DriverView: React.FC<DriverViewProps> = ({ onPostRide, postedRides, driverRequests, refreshData }) => {
  const driverTabs = ['Post a Ride', 'Ride Requests', 'My Posted Rides', 'Ride History'];
  const [activeTab, setActiveTab] = useState(driverTabs[0]);

  const sortedPostedRides = useMemo(() => {
    return [...postedRides].sort((a,b) => a.departureTime.getTime() - b.departureTime.getTime());
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
      <div className="mt-6">
        {activeTab === 'Post a Ride' && <PostARide onPostRideSuccess={handlePostRideSuccess} onPostRide={onPostRide} />}
        
        {activeTab === 'Ride Requests' && (
           <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(req => <RequestCard key={req.id} request={req} viewAs="driver" refreshData={refreshData} />)
            ) : (
              <div className="text-center text-gray-500 p-8 bg-white rounded-lg shadow-sm border">
                <p className="font-semibold">No pending ride requests.</p>
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
              <div className="text-center text-gray-500 p-8 bg-white rounded-lg shadow-sm border">
                <p className="font-semibold">You haven't posted any rides yet.</p>
                <p className="text-sm">Click on "Post a Ride" to get started.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'Ride History' && <div className="text-center text-gray-500 p-8 bg-white rounded-lg shadow-sm border">
            <p className="font-semibold">No past rides</p>
            <p className="text-sm">Your completed rides will be shown here.</p>
        </div>}
      </div>
    </div>
  );
};

export default DriverView;
