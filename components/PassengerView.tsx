
import React, { useState } from 'react';
import { Ride, Request } from '../types';
import Tabs from './Tabs';
import FindARide from './FindARide';
import RequestCard from './RequestCard';

interface PassengerViewProps {
  allRides: Ride[];
  passengerRequests: Request[];
  refreshData: () => void;
}

const PassengerView: React.FC<PassengerViewProps> = ({ allRides, passengerRequests, refreshData }) => {
  const passengerTabs = ['Find a Ride', 'My Requests', 'My Trips', 'Ride History'];
  const [activeTab, setActiveTab] = useState(passengerTabs[0]);

  const acceptedRequests = passengerRequests.filter(r => r.status === 'accepted');

  return (
    <div>
      <Tabs tabs={passengerTabs} activeTab={activeTab} onTabClick={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'Find a Ride' && <FindARide rides={allRides} passengerRequests={passengerRequests} refreshData={refreshData} />}
        {activeTab === 'My Requests' && (
          <div className="space-y-4">
            {passengerRequests.length > 0 ? (
              passengerRequests.map(req => <RequestCard key={req.id} request={req} viewAs="passenger" refreshData={refreshData}/>)
            ) : (
              <div className="text-center text-gray-500 p-8 bg-white rounded-lg shadow-sm border">
                  <p className="font-semibold">You haven't requested any rides.</p>
                  <p className="text-sm">Use the "Find a Ride" tab to get started.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'My Trips' && (
           <div className="space-y-4">
            {acceptedRequests.length > 0 ? (
              acceptedRequests.map(req => <RequestCard key={req.id} request={req} viewAs="passenger" refreshData={refreshData}/>)
            ) : (
              <div className="text-center text-gray-500 p-8 bg-white rounded-lg shadow-sm border">
                <p className="font-semibold">You have no upcoming trips.</p>
                <p className="text-sm">Accepted ride requests will appear here.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'Ride History' && <div className="text-center text-gray-500 p-8 bg-white rounded-lg shadow-sm border">Your past trips will be shown here.</div>}
      </div>
    </div>
  );
};

export default PassengerView;
