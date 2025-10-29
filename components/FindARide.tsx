import React, { useState, useMemo } from 'react';
import { Ride, Request, RequestStatus, RideStatus, UserToRate } from '../types';
import RideCard from './RideCard';
import { LOCATIONS } from '../constants';

interface FindARideProps {
  rides: Ride[];
  passengerRequests: Request[];
  refreshData: () => void;
  onRateDriver?: (rideId: string, userToRate: UserToRate) => void;
}

const FindARide: React.FC<FindARideProps> = ({ rides, passengerRequests, refreshData, onRateDriver }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');

  const requestsMap = useMemo(() => {
    const map = new Map<string, RequestStatus>();
    passengerRequests.forEach(req => {
      map.set(req.ride.id, req.status);
    });
    return map;
  }, [passengerRequests]);

  const getStatusWeight = (ride: Ride) => {
    const isPast = ride.departureTime.getTime() < Date.now();
    switch (ride.status) {
      case RideStatus.Active:
        if (isPast) return 2; // Expired unmatched ride
        return ride.seatsAvailable === 0 ? 1 : 0; // Upcoming full, then available
      case RideStatus.Cancelled:
        return 3;
      case RideStatus.Completed:
        return 4;
      default:
        return 5; // Should not happen
    }
  };

  const filteredRides = useMemo(() => {
    return rides.filter(ride => {
      const fromMatch = !from || ride.from === from;
      const toMatch = !to || ride.to === to;
      const dateMatch = !date || ride.departureTime.toISOString().split('T')[0] === date;
      return fromMatch && toMatch && dateMatch;
    }).sort((a, b) => {
      const weightA = getStatusWeight(a);
      const weightB = getStatusWeight(b);
      
      if (weightA !== weightB) {
        return weightA - weightB;
      }

      // For all non-upcoming-active rides (weights >= 2), sort by most recent first
      if (weightA >= 2) {
        return b.departureTime.getTime() - a.departureTime.getTime();
      }
      
      // For upcoming active rides (weights 0 and 1), sort by soonest first
      return a.departureTime.getTime() - b.departureTime.getTime();
    });
  }, [rides, from, to, date]);

  const handleClear = () => {
    setFrom('');
    setTo('');
    setDate('');
  };

  const today = new Date().toISOString().split('T')[0];
  const inputBaseClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-50 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg";


  return (
    <div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-end">
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
          <div className="md:col-span-1">
            <button
              onClick={handleClear}
              className="w-full bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors duration-200 font-semibold text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {filteredRides.length > 0 ? (
          filteredRides.map(ride => (
            <RideCard
              key={ride.id}
              ride={ride}
              requestStatus={requestsMap.get(ride.id)}
              refreshData={refreshData}
              onRateDriver={onRateDriver}
            />
          ))
        ) : (
          <div className="text-center text-slate-500 py-16">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
            </svg>
            <p className="font-semibold mt-4">No rides found</p>
            <p className="text-sm">Try adjusting your search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindARide;