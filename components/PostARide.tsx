import React, { useState, FormEvent, ChangeEvent, useEffect, useMemo } from 'react';
import { Ride, Car, CarInfo } from '../types';
import { LOCATIONS } from '../constants';
import { getCarsForUser } from '../services/profileService';
import { useAuth } from '../providers/AuthProvider';

interface PostARideProps {
  onPostRide: (newRide: Omit<Ride, 'id' | 'driver' | 'passengers' | 'status' | 'ratings'>) => Promise<boolean>;
  onPostRideSuccess: (success: boolean) => void;
}

const PostARide: React.FC<PostARideProps> = ({ onPostRide, onPostRideSuccess }) => {
  const { user } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTimeValue, setDepartureTimeValue] = useState('');
  const [seatsAvailable, setSeatsAvailable] = useState(1);
  const [price, setPrice] = useState(10);
  const [isFree, setIsFree] = useState(false);
  
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarOption, setSelectedCarOption] = useState('');
  // FIX: Added `is_insured` to the initial state to match the `CarInfo` type.
  const [customCar, setCustomCar] = useState<CarInfo>({ make: '', model: '', year: new Date().getFullYear(), color: '', license_plate: '', is_insured: false });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserCars = async () => {
        if (!user) return;
        const userCars = await getCarsForUser(user.id);
        setCars(userCars);
        const defaultCar = userCars.find(c => c.is_default);
        if (defaultCar) {
            setSelectedCarOption(defaultCar.id);
        } else if (userCars.length > 0) {
            setSelectedCarOption(userCars[0].id);
        } else {
            setSelectedCarOption('custom');
        }
    };
    fetchUserCars();
  }, [user]);
  
  const timeOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        const date = new Date();
        date.setHours(h, m);
        const displayTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const valueTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        options.push({ value: valueTime, label: displayTime });
      }
    }
    return options;
  }, []);

  const filteredTimeOptions = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    if (departureDate !== todayISO) {
      return timeOptions;
    }
    
    const now = new Date();
    // Round up to the next 5-minute interval for comparison
    const roundedMinutes = Math.ceil(now.getMinutes() / 5) * 5;
    const roundedDate = new Date();
    roundedDate.setMinutes(roundedMinutes);
    
    const currentTime = `${roundedDate.getHours().toString().padStart(2, '0')}:${roundedDate.getMinutes().toString().padStart(2, '0')}`;

    return timeOptions.filter(option => option.value >= currentTime);
  }, [departureDate, timeOptions]);

  // Effect to handle time selection when date changes, ensuring an invalid time isn't kept.
  useEffect(() => {
    const isValidTimeSelected = filteredTimeOptions.some(option => option.value === departureTimeValue);
    if (!isValidTimeSelected) {
      // Auto-select the first available time, or clear if none are available
      setDepartureTimeValue(filteredTimeOptions.length > 0 ? filteredTimeOptions[0].value : '');
    }
  }, [departureDate, filteredTimeOptions]);

  const clearForm = () => {
    setFrom('');
    setTo('');
    setDepartureDate(new Date().toISOString().split('T')[0]);
    setDepartureTimeValue('');
    setSeatsAvailable(1);
    setPrice(10);
    setIsFree(false);
    setError('');
    // Don't clear car selection, user might want to post another ride with same car
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setError('');
    setSuccess('');

    if (!from || !to || !departureDate || !departureTimeValue) {
        setError('Please fill out all trip details.');
        return;
    }
    if (from === to) {
        setError('Start and end locations cannot be the same.');
        return;
    }

    let carInfo: CarInfo | undefined;
    if (selectedCarOption === 'custom') {
        const { make, model, license_plate } = customCar;
        if (!make || !model || !license_plate) {
            setError('Please fill out all required (*) vehicle details.');
            return;
        }
        carInfo = {
            ...customCar,
            year: customCar.year && !isNaN(customCar.year) ? customCar.year : undefined,
            color: customCar.color || undefined
        };
    } else {
        const selectedCar = cars.find(c => c.id === selectedCarOption);
        if (!selectedCar) {
            setError('Please select a vehicle for this ride.');
            return;
        }
        carInfo = selectedCar;
    }

    setIsLoading(true);

    const ridePosted = await onPostRide({
      from,
      to,
      departureTime: new Date(`${departureDate}T${departureTimeValue}`),
      seatsAvailable,
      price,
      car: carInfo,
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
  
  // FIX: Updated to handle checkbox inputs for the 'is_insured' field.
  const handleCustomCarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCustomCar(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : name === 'year' ? parseInt(value, 10) : value }));
  };

  const inputBaseClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-50 border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg disabled:bg-slate-200 disabled:cursor-not-allowed";

  const renderCarFields = () => (
    <div className="p-4 bg-slate-50/80 rounded-lg mt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-slate-500">Make <span className="text-red-500">*</span></label><input type="text" name="make" value={customCar.make} onChange={handleCustomCarChange} className={inputBaseClasses} required /></div>
            <div><label className="block text-xs font-medium text-slate-500">Model <span className="text-red-500">*</span></label><input type="text" name="model" value={customCar.model} onChange={handleCustomCarChange} className={inputBaseClasses} required /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-slate-500">Year</label><input type="number" name="year" value={customCar.year} onChange={handleCustomCarChange} className={inputBaseClasses} /></div>
            <div><label className="block text-xs font-medium text-slate-500">Color</label><input type="text" name="color" value={customCar.color} onChange={handleCustomCarChange} className={inputBaseClasses} /></div>
            <div><label className="block text-xs font-medium text-slate-500">License Plate <span className="text-red-500">*</span></label><input type="text" name="license_plate" value={customCar.license_plate} onChange={handleCustomCarChange} className={inputBaseClasses} required /></div>
        </div>
        {/* FIX: Added an 'is_insured' checkbox to the custom car form. */}
        <div className="flex items-center">
            <input
                id="custom_car_is_insured"
                name="is_insured"
                type="checkbox"
                checked={customCar.is_insured}
                onChange={handleCustomCarChange}
                className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="custom_car_is_insured" className="ml-3 block text-sm font-medium text-slate-700">
                Is this car insured?
            </label>
        </div>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Post a Ride</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ride Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="post-from" className="block text-sm font-medium text-slate-600">From</label>
            <select id="post-from" value={from} onChange={(e) => setFrom(e.target.value)} className={inputBaseClasses} required>
              <option value="" disabled>Select a location</option>
              {LOCATIONS.map(loc => <option key={`from-${loc}`} value={loc} disabled={loc === to}>{loc}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="post-to" className="block text-sm font-medium text-slate-600">To</label>
            <select id="post-to" value={to} onChange={(e) => setTo(e.target.value)} className={inputBaseClasses} required>
              <option value="" disabled>Select a location</option>
              {LOCATIONS.map(loc => <option key={`to-${loc}`} value={loc} disabled={loc === from}>{loc}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
          <div className="col-span-1">
            <label htmlFor="departure-date" className="block text-sm font-medium text-slate-600">Date</label>
            <input type="date" id="departure-date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className={`${inputBaseClasses} py-[7px]`} min={new Date().toISOString().split('T')[0]} required />
          </div>
          <div className="col-span-1">
            <label htmlFor="departure-time-select" className="block text-sm font-medium text-slate-600">Time</label>
            <select id="departure-time-select" value={departureTimeValue} onChange={(e) => setDepartureTimeValue(e.target.value)} className={inputBaseClasses} required>
              <option value="" disabled>Select time</option>
              {filteredTimeOptions.length > 0 ? (
                filteredTimeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
              ) : (
                <option value="" disabled>No times available today</option>
              )}
            </select>
          </div>
          <div className="col-span-1">
            <label htmlFor="seats" className="block text-sm font-medium text-slate-600">Seats</label>
            <input type="number" id="seats" value={seatsAvailable} onChange={(e) => setSeatsAvailable(Math.max(1, parseInt(e.target.value, 10)))} min="1" max="8" className={`${inputBaseClasses} py-[7px]`} />
          </div>
          <div className="col-span-1">
             <div className="flex justify-between items-center">
              <label htmlFor="price" className="block text-sm font-medium text-slate-600">Est. Price per Seat ($)</label>
              <div className="flex items-center">
                <input id="is-free" name="is-free" type="checkbox" checked={isFree} onChange={handleFreeChange} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <label htmlFor="is-free" className="ml-2 block text-sm font-medium text-slate-700">Free</label>
              </div>
            </div>
            <input type="number" id="price" value={price} onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value, 10)))} min="0" disabled={isFree} className={`${inputBaseClasses} py-[7px]`} />
          </div>
        </div>

        {/* Vehicle Details */}
        <div>
            <label htmlFor="car-select" className="block text-sm font-medium text-slate-600">Vehicle</label>
            {cars.length > 0 ? (
                <select id="car-select" value={selectedCarOption} onChange={(e) => setSelectedCarOption(e.target.value)} className={inputBaseClasses}>
                    {cars.map(car => <option key={car.id} value={car.id}>{car.year} {car.make} {car.model} ({car.license_plate})</option>)}
                    <option value="custom">Use a different car...</option>
                </select>
            ) : <p className="text-sm text-slate-500 mt-1">Add vehicle details for this ride below.</p>}
            
            {selectedCarOption === 'custom' && renderCarFields()}
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