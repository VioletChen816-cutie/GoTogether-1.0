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

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const SuitcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M18 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


const PassengerView: React.FC<PassengerViewProps> = ({ allRides, passengerRequests, refreshData }) => {
  const passengerTabs = [
    { name: 'Find Rides', icon: <SearchIcon /> },
    { name: 'My Requests', icon: <BellIcon /> },
    { name: 'My Trips', icon: <SuitcaseIcon /> },
    { name: 'Ride History', icon: <ClockIcon /> }
  ];
  const [activeTab, setActiveTab] = useState(passengerTabs[0].name);

  const acceptedRequests = passengerRequests.filter(r => r.status === 'accepted');

  return (
    <div>
      <Tabs tabs={passengerTabs} activeTab={activeTab} onTabClick={setActiveTab} />
      <div className="mt-8">
        {activeTab === 'Find Rides' && <FindARide rides={allRides} passengerRequests={passengerRequests} refreshData={refreshData} />}
        {activeTab === 'My Requests' && (
          <div className="space-y-4">
            {passengerRequests.length > 0 ? (
              passengerRequests.map(req => <RequestCard key={req.id} request={req} viewAs="passenger" refreshData={refreshData}/>)
            ) : (
              <div className="text-center text-slate-500 py-16">
                  <BellIcon />
                  <p className="font-semibold mt-4">You haven't requested any rides.</p>
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
        {activeTab === 'Ride History' && <div className="text-center text-slate-500 py-16">
            <ClockIcon />
            <p className="font-semibold mt-4">No ride history.</p>
            <p className="text-sm">Your past trips will be shown here.</p>
        </div>}
      </div>
    </div>
  );
};

export default PassengerView;