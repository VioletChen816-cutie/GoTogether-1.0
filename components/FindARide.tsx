import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Ride, Request, RequestStatus, RideStatus, UserToRate, FeedItem, PassengerRideRequest } from '../types';
import RideCard from './RideCard';
import { LOCATIONS } from '../constants';
import PostRideRequestModal from './PostRideRequestModal';
import PassengerRideRequestCard from './PassengerRideRequestCard';
import { useAuth } from '../providers/AuthProvider';

interface FindARideProps {
  feedItems: FeedItem[];
  passengerRequests: Request[];
  refreshData: () => void;
  onRateDriver?: (rideId: string, userToRate: UserToRate) => void;
  onRequestFulfilled?: (request: Request) => void;
}

const FindARide: React.FC<FindARideProps> = ({ feedItems, passengerRequests, refreshData, onRateDriver, onRequestFulfilled }) => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'offer' | 'request'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [loginPendingRequestData, setLoginPendingRequestData] = useState<any | null>(null);
  
  const prevUserRef = useRef(user);

  useEffect(() => {
    const prevUser = prevUserRef.current;
    if (!prevUser && user && loginPendingRequestData) {
      setIsRequestModalOpen(true);
    }
    prevUserRef.current = user;
  }, [user, loginPendingRequestData]);
  
  const [activeFilters, setActiveFilters] = useState({
    type: 'all',
    from: '',
    to: '',
    date: ''
  });

  const requestsMap = useMemo(() => {
    const map = new Map<string, RequestStatus>();
    passengerRequests.forEach(req => {
      map.set(req.ride.id, req.status);
    });
    return map;
  }, [passengerRequests]);

  const getItemDate = (item: FeedItem) => {
    return item.itemType === 'offer' ? item.departureTime : item.departureDate;
  }

  const getStatusWeight = (item: FeedItem): number => {
    const now = new Date();
    
    // Ride Offers
    if (item.itemType === 'offer') {
      const isPast = item.departureTime.getTime() < now.getTime();
      switch (item.status) {
        case RideStatus.Active:
          if (isPast) return 4; // Expired active offer
          if (item.seatsAvailable > 0) return 0; // Active, available offer
          return 2; // Active, full offer
        case RideStatus.Completed:
          return 6;
        case RideStatus.Cancelled:
          return 7;
        default:
          return 8;
      }
    }

    // Passenger Requests
    if (item.itemType === 'request') {
      const today = new Date();
      const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const requestDateStr = new Date(item.departureDate).toISOString().split('T')[0];
      const isPast = requestDateStr < todayStr;
      
      switch (item.status) {
        case 'open':
          if (isPast) return 5; // Expired open request
          return 1; // Open request
        case 'pending-passenger-approval':
        case 'fulfilled':
          return 3;
        case 'cancelled':
            return 7;
        default:
          return 8;
      }
    }
    
    return 8; // Should not reach here
  };

  const filteredFeed = useMemo(() => {
    const { type: activeType, from: activeFrom, to: activeTo, date: activeDate } = activeFilters;
    return feedItems.filter(item => {
      const typeMatch = activeType === 'all' || item.itemType === activeType;
      const fromMatch = !activeFrom || item.from === activeFrom;
      const toMatch = !activeTo || item.to === activeTo;
      const dateMatch = !activeDate || getItemDate(item).toISOString().split('T')[0] === activeDate;
      return typeMatch && fromMatch && toMatch && dateMatch;
    }).sort((a, b) => {
      const weightA = getStatusWeight(a);
      const weightB = getStatusWeight(b);
      
      if (weightA !== weightB) {
        return weightA - weightB;
      }

      // For upcoming/active items (weights 0, 1, 2), sort by soonest first
      if (weightA <= 2) {
        return getItemDate(a).getTime() - getItemDate(b).getTime();
      }
      
      // For all other items (fulfilled, past, completed, cancelled), sort by most recent first
      return getItemDate(b).getTime() - getItemDate(a).getTime();
    });
  }, [feedItems, activeFilters]);

  const handleSearch = () => {
    setActiveFilters({
      type: filterType,
      from,
      to,
      date,
    });
  };

  const handleReset = () => {
    setFilterType('all');
    setFrom('');
    setTo('');
    setDate('');
    setActiveFilters({
      type: 'all',
      from: '',
      to: '',
      date: ''
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const inputBaseClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-50 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg";

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-2">
                <label htmlFor="filter-type" className="block text-sm font-medium text-slate-600">Type</label>
                <select
                  id="filter-type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'offer' | 'request')}
                  className={inputBaseClasses}
                >
                  <option value="all">All Types</option>
                  <option value="offer">Offers</option>
                  <option value="request">Requests</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label htmlFor="from-location" className="block text-sm font-medium text-slate-600">From</label>
                <select
                  id="from-location"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className={inputBaseClasses}
                >
                  <option value="">All Locations</option>
                  {LOCATIONS.map(loc => <option key={`from-${loc}`} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div className="md:col-span-3">
                <label htmlFor="to-location" className="block text-sm font-medium text-slate-600">To</label>
                <select
                  id="to-location"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className={inputBaseClasses}
                >
                  <option value="">All Locations</option>
                  {LOCATIONS.map(loc => <option key={`to-${loc}`} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="ride-date" className="block text-sm font-medium text-slate-600">Date</label>
                <input
                  type="date"
                  id="ride-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`${inputBaseClasses} py-[7px]`}
                  min={today}
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-300 transition-colors duration-200 font-semibold text-sm"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  aria-label="Search"
                  className="flex items-center justify-center bg-blue-500 text-white p-2.5 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </div>
            </div>
        </form>
      </div>
      
      <div className="text-center my-6 py-4 bg-slate-100 rounded-xl">
        <p className="text-slate-600 font-medium">Can't find the ride you're looking for?</p>
        <button 
          onClick={() => {
            setLoginPendingRequestData(null);
            setIsRequestModalOpen(true);
          }} 
          className="mt-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-lg transition-colors shadow-sm"
        >
          + Post a Ride Request
        </button>
      </div>

      <div className="mt-8 space-y-4">
        {filteredFeed.length > 0 ? (
          filteredFeed.map(item =>
            item.itemType === 'offer' ? (
              <RideCard
                key={`offer-${item.id}`}
                ride={item}
                requestStatus={requestsMap.get(item.id)}
                refreshData={refreshData}
                onRateDriver={onRateDriver}
              />
            ) : (
              <PassengerRideRequestCard 
                key={`request-${item.id}`}
                request={item}
                refreshData={refreshData}
                onRequestFulfilled={onRequestFulfilled}
              />
            )
          )
        ) : (
          <div className="text-center text-slate-500 py-16">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
            </svg>
            <p className="font-semibold mt-4">No rides or requests found</p>
            <p className="text-sm">Try adjusting your search filters or post a request!</p>
          </div>
        )}
      </div>
      <PostRideRequestModal 
        isOpen={isRequestModalOpen}
        initialData={loginPendingRequestData}
        onClose={() => {
            setIsRequestModalOpen(false);
            setLoginPendingRequestData(null);
        }}
        onSuccess={() => {
            setIsRequestModalOpen(false);
            setLoginPendingRequestData(null);
            refreshData();
        }}
        onSaveForLogin={(data) => {
            setLoginPendingRequestData(data);
            setIsRequestModalOpen(false);
        }}
      />
    </>
  );
};

export default FindARide;