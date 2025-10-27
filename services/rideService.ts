
import { supabase } from '../lib/supabaseClient';
import { Ride, Driver, Request, RequestStatus } from '../types';

const rideSelectQuery = `
  id,
  from: "from",
  to: "to",
  departure_time,
  seats_available,
  price,
  driver:profiles (
    id,
    name:full_name
  )
`;

const mapRideData = (ride: any): Ride => {
  const driverProfile = ride.driver;
  const driver: Driver = driverProfile 
    ? {
        id: driverProfile.id,
        name: driverProfile.name,
        avatar: `https://picsum.photos/seed/${driverProfile.id}/100/100`,
        rating: 4.8,
      }
    : { id: 'unknown', name: 'Unknown Driver', avatar: 'https://picsum.photos/seed/unknown/100/100', rating: 0 };
  
  return {
    id: ride.id,
    from: ride.from,
    to: ride.to,
    departureTime: new Date(ride.departure_time),
    seatsAvailable: ride.seats_available,
    price: ride.price,
    driver,
  };
};

export const getRides = async (): Promise<Ride[]> => {
  if (!supabase) throw new Error('Supabase client is not initialized');

  const { data, error } = await supabase
    .from('rides')
    .select(rideSelectQuery)
    .order('departure_time', { ascending: true });

  if (error) {
    console.error('Error fetching rides:', error.message || error);
    throw error;
  }
  
  if (!data) return [];

  return data.map(mapRideData);
};

export const addRide = async (newRide: Omit<Ride, 'id' | 'driver'>): Promise<any> => {
  if (!supabase) throw new Error('Supabase client is not initialized');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be logged in to post a ride');

  const rideData = {
    "from": newRide.from,
    "to": newRide.to,
    departure_time: newRide.departureTime.toISOString(),
    seats_available: newRide.seatsAvailable,
    price: newRide.price,
    driver_id: user.id,
  };

  const { data, error } = await supabase
    .from('rides')
    .insert(rideData)
    .select();

  if (error) {
    console.error('Error adding ride:', error.message || error);
    throw error;
  }

  return data;
};

// --- Request Management ---

export const requestRide = async (rideId: string): Promise<any> => {
  if (!supabase) throw new Error('Supabase client is not initialized');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be logged in to request a ride');

  const { data, error } = await supabase
    .from('requests')
    .insert({ ride_id: rideId, passenger_id: user.id })
    .select();
  
  if (error) {
    console.error('Error creating request:', error.message || error);
    if (error.code === '23505') { // Unique constraint violation
      throw new Error("You have already requested to join this ride.");
    }
    throw error;
  }
  return data;
};

const mapRequestData = (req: any): Request => ({
  id: req.id,
  createdAt: new Date(req.created_at),
  status: req.status,
  ride: mapRideData(req.rides),
  passenger: {
    id: req.profiles.id,
    name: req.profiles.full_name,
    avatar: `https://picsum.photos/seed/${req.profiles.id}/100/100`,
    rating: 4.8,
  },
});

export const getPassengerRequests = async (): Promise<Request[]> => {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('requests')
        .select(`
            id, created_at, status,
            rides ( ${rideSelectQuery} ),
            profiles (id, full_name)
        `)
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching passenger requests:', error);
        throw error;
    }
    return data.map(mapRequestData);
};

export const getDriverRequests = async (): Promise<Request[]> => {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: rideIds, error: rideIdError } = await supabase
      .from('rides')
      .select('id')
      .eq('driver_id', user.id);

    if (rideIdError || !rideIds || rideIds.length === 0) {
      return [];
    }
    
    const { data, error } = await supabase
        .from('requests')
        .select(`
            id, created_at, status,
            rides ( ${rideSelectQuery} ),
            profiles (id, full_name)
        `)
        .in('ride_id', rideIds.map(r => r.id))
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching driver requests:', error);
        throw error;
    }
    return data.map(mapRequestData);
};


export const updateRequestStatus = async (requestId: string, status: RequestStatus): Promise<any> => {
    if (!supabase) throw new Error('Supabase client is not initialized');
    
    const { data, error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId)
        .select();

    if (error) {
        console.error('Error updating request status:', error);
        throw error;
    }
    return data;
};