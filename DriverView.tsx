import React, { useState } from 'react';
import { Ride } from '../types';
import Tabs from './Tabs';
import PostARide from './PostARide';
import RideCard from './RideCard';

interface DriverViewProps {
  onPostRide: (newRide: Omit<Ride, 'id' | 'driver'>) => void;
  postedRides: Ride[];
}

const DriverView: React.FC<DriverViewProps> = ({ onPostRide, postedRides }) => {
  const driverTabs = ['Post a Ride', 'My Posted Rides', 'Ride History'];
  const [activeTab, setActiveTab] = useState(driverTabs[0]);

  return (
    <div>
      <Tabs tabs={driverTabs} activeTab={activeTab} onTabClick={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'Post a Ride' && <PostARide onPostRide={onPostRide} />}
        {activeTab === 'My Posted Rides' && (
          <div className="space-y-4">
            {postedRides.length > 0 ? (
              postedRides.sort((a,b) => a.departureTime.getTime() - b.departureTime.getTime()).map(ride => <RideCard key={ride.id} ride={ride} />)
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