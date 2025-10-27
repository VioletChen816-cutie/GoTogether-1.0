import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Ride } from '../types';
import { LOCATIONS } from '../constants';

interface PostARideProps {
  onPostRide: (newRide: Omit<Ride, 'id' | 'driver' | 'passengers'>) => Promise<boolean>;
  onPostRideSuccess: (success: boolean) => void;
}

const PostARide: React.FC<PostARideProps> = ({ onPostRide, onPostRideSuccess }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [seatsAvailable, setSeatsAvailable] = useState(1);
  const [price, setPrice] = useState(10);
  const [isFree, setIsFree] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearForm = () => {
    setFrom('');
    setTo('');
    setDepartureTime('');
    setSeatsAvailable(1);
    setPrice(10);
    setIsFree(false);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setError('');
    setSuccess('');

    if (!from || !to) {
        setError('Please provide a start and end location.');
        return;
    }
    if (!departureTime) {
        setError('Please select a departure date and time.');
        return;
    }
    if (from === to) {
        setError('Start and end locations cannot be the same.');
        return;
    }

    setIsLoading(true);

    const ridePosted = await onPostRide({
      from,
      to,
      departureTime: new Date(departureTime),
      seatsAvailable,
      price
    });
    
    setIsLoading(false);
    if (ridePosted) {
      setSuccess('Ride posted successfully!');
      clearForm();
      setTimeout(() => onPostRideSuccess(true), 1000);
    }
  };
  
  const handleFreeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsFree(checked);
    if (checked) {
      setPrice(0);
    } else {
      setPrice(10); // Reset to a default value when unchecked
    }
  };

  const inputBaseClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-50 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg disabled:bg-slate-200 disabled:cursor-not-allowed";

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Post a New Ride</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="post-from" className="block text-sm font-medium text-slate-600">From</label>
            <select
              id="post-from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputBaseClasses}
              required
            >
              <option value="" disabled>Select a location</option>
              {LOCATIONS.map(loc => <option key={`from-${loc}`} value={loc}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="post-to" className="block text-sm font-medium text-slate-600">To</label>
            <select
              id="post-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputBaseClasses}
              required
            >
              <option value="" disabled>Select a location</option>
              {LOCATIONS.map(loc => <option key={`to-${loc}`} value={loc}>{loc}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label htmlFor="departure-time" className="block text-sm font-medium text-slate-600">Departure Time</label>
            <input
              type="datetime-local"
              id="departure-time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className={`${inputBaseClasses} py-[7px]`}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="seats" className="block text-sm font-medium text-slate-600">Seats Available</label>
            <input
              type="number"
              id="seats"
              value={seatsAvailable}
              onChange={(e) => setSeatsAvailable(Math.max(1, parseInt(e.target.value, 10)))}
              min="1"
              max="8"
              className={`${inputBaseClasses} py-[7px]`}
            />
          </div>
          <div className="md:col-span-1">
             <div className="flex justify-between items-center">
              <label htmlFor="price" className="block text-sm font-medium text-slate-600">Price per seat ($)</label>
              <div className="flex items-center">
                <input
                  id="is-free"
                  name="is-free"
                  type="checkbox"
                  checked={isFree}
                  onChange={handleFreeChange}
                  className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is-free" className="ml-2 block text-sm font-medium text-slate-700">
                  Free
                </label>
              </div>
            </div>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value, 10)))}
              min="0"
              disabled={isFree}
              className={`${inputBaseClasses} py-[7px]`}
            />
          </div>
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}
        
        <div className="pt-4">
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
            {isLoading ? 'Posting...' : 'Post Ride'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostARide;