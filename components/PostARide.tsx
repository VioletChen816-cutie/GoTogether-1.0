
import React, { useState, FormEvent } from 'react';
import { Ride } from '../types';
import { LOCATIONS } from '../constants';

interface PostARideProps {
  onPostRide: (newRide: Omit<Ride, 'id' | 'driver'>) => Promise<boolean>;
  onPostRideSuccess: (success: boolean) => void;
}

const PostARide: React.FC<PostARideProps> = ({ onPostRide, onPostRideSuccess }) => {
  const [from, setFrom] = useState(LOCATIONS[0]);
  const [to, setTo] = useState(LOCATIONS[1]);
  const [departureTime, setDepartureTime] = useState('');
  const [seatsAvailable, setSeatsAvailable] = useState(1);
  const [price, setPrice] = useState(10);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearForm = () => {
    setFrom(LOCATIONS[0]);
    setTo(LOCATIONS[1]);
    setDepartureTime('');
    setSeatsAvailable(1);
    setPrice(10);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!departureTime) {
        setError('Please select a departure date and time.');
        return;
    }
    if (from === to) {
        setError('Start and end locations cannot be the same.');
        return;
    }
    setError('');
    setIsLoading(true);

    const success = await onPostRide({
      from,
      to,
      departureTime: new Date(departureTime),
      seatsAvailable,
      price
    });
    
    setIsLoading(false);
    if (success) {
      clearForm();
      onPostRideSuccess(true);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Post a New Ride</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="post-from" className="block text-sm font-medium text-gray-700">From</label>
            <select
              id="post-from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {LOCATIONS.map(loc => <option key={`post-from-${loc}`}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="post-to" className="block text-sm font-medium text-gray-700">To</label>
            <select
              id="post-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {LOCATIONS.map(loc => <option key={`post-to-${loc}`}>{loc}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="departure-time" className="block text-sm font-medium text-gray-700">Departure Time</label>
          <input
            type="datetime-local"
            id="departure-time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="mt-1 block w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="seats" className="block text-sm font-medium text-gray-700">Seats Available</label>
              <input
                type="number"
                id="seats"
                value={seatsAvailable}
                onChange={(e) => setSeatsAvailable(Math.max(1, parseInt(e.target.value, 10)))}
                min="1"
                max="8"
                className="mt-1 block w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price per seat ($)</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value, 10)))}
                min="0"
                className="mt-1 block w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              />
            </div>
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <div className="pt-4">
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
            {isLoading ? 'Posting...' : 'Post Ride'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostARide;
