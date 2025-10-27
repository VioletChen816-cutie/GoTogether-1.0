
import React, { useState, useMemo } from 'react';
import { Ride, Request, RequestStatus } from '../types';
import { LOCATIONS } from '../constants';
import RideCard from './RideCard';

interface FindARideProps {
  rides: Ride[];
  passengerRequests: Request[];
  refreshData: () => void;
}

const FindARide: React.FC<FindARideProps> = ({ rides, passengerRequests, refreshData }) => {
  const [from, setFrom] = useState('All Locations');
  const [to, setTo] = useState('All Locations');
  const [date, setDate] = useState('');

  const requestsMap = useMemo(() => {
    const map = new Map<string, RequestStatus>();
    passengerRequests.forEach(req => {
      map.set(req.ride.id, req.status);
    });
    return map;
  }, [passengerRequests]);

  const filteredRides = useMemo(() => {
    return rides.filter(ride => {
      const fromMatch = from === 'All Locations' || ride.from === from;
      const toMatch = to === 'All Locations' || ride.to === to;
      const dateMatch = !date || ride.departureTime.toISOString().split('T')[0] === date;
      return fromMatch && toMatch && dateMatch;
    }).sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());
  }, [rides, from, to, date]);

  const handleClear = () => {
    setFrom('All Locations');
    setTo('All Locations');
    setDate('');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-end">
          <div className="md:col-span-3">
            <label htmlFor="from-location" className="block text-sm font-medium text-gray-700">From</label>
            <select
              id="from-location"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option>All Locations</option>
              {LOCATIONS.map(loc => <option key={`from-${loc}`}>{loc}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <label htmlFor="to-location" className="block text-sm font-medium text-gray-700">To</label>
            <select
              id="to-location"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option>All Locations</option>
              {LOCATIONS.map(loc => <option key={`to-${loc}`}>{loc}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="ride-date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              id="ride-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              min={today}
            />
          </div>
          <div className="md:col-span-1">
            <button
              onClick={handleClear}
              className="w-full bg-slate-700 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors duration-200 font-semibold"
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
            />
          ))
        ) : (
          <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-sm border">
            <p className="font-semibold">No rides found</p>
            <p className="text-sm">Try adjusting your search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindARide;
