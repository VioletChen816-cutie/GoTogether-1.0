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
    name:full_name,
    avatar_url
  )
`;

const mapDriverData = (profile: any): Driver => {
    if (!profile) {
        return { id: 'unknown', name: 'Unknown Driver', avatar_url: null, rating: 0 };
    }
    return {
        id: profile.id,
        name: profile.name || 'No Name',
        avatar_url: profile.avatar_url,
        rating: 4.8, // placeholder
    };
};

const mapRideData = (ride: any): Ride => {
  return {
    id: ride.id,
    from: ride.from,
    to: ride.to,
    departureTime: new Date(ride.departure_time),
    seatsAvailable: ride.seats_available,
    price: ride.price,
    driver: mapDriverData(ride.driver),
  };
};

export const getRides = async (): Promise<Ride[]> => {
  if (!supabase) throw new Error('Supabase client is not initialized');

  const { data, error } = await supabase
    .from('rides')
    .select(rideSelectQuery)
    .gt('departure_time', new Date().toISOString())
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
    name: req.profiles.full_name || 'No Name',
    avatar_url: req.profiles.avatar_url,
    rating: 4.8,
  },
});

export const getPassengerRequests = async (): Promise<Request[]> => {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // FIX: The join on `profiles` was ambiguous. Added the `!passenger_id` hint
    // to explicitly tell Supabase to join using the passenger_id foreign key,
    // ensuring the correct passenger profile is fetched for the request.
    const { data, error } = await supabase
        .from('requests')
        .select(`
            id, created_at, status,
            rides ( ${rideSelectQuery} ),
            profiles!passenger_id (id, full_name, avatar_url)
        `)
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching passenger requests:', error.message);
        throw error;
    }
    // Filter out requests where the associated ride or profile has been deleted.
    return data.filter(req => req.rides && req.profiles).map(mapRequestData);
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
    
    // The previous query used a hint with the FK constraint name, which was incorrect and caused the passenger profile join to fail.
    // The correct way to disambiguate a join in Supabase is to use the foreign key COLUMN name in the hint.
    // The query is updated to use `profiles!passenger_id(...)` to correctly fetch the passenger's profile for each request.
    const { data, error } = await supabase
        .from('requests')
        .select(`
            id, created_at, status,
            rides ( ${rideSelectQuery} ),
            profiles!passenger_id (id, full_name, avatar_url)
        `)
        .in('ride_id', rideIds.map(r => r.id))
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching driver requests:', error.message);
        throw error;
    }
    
    // Filter out requests where the associated ride or passenger profile has been deleted.
    // With the corrected query, the passenger profile is returned under the `profiles` key.
    const validData = data.filter(req => req.rides && req.profiles);
    
    // The data is now in the correct shape for mapRequestData, no renaming needed.
    return validData.map(mapRequestData);
};


export const updateRequestStatus = async (requestId: string, status: RequestStatus): Promise<any> => {
    if (!supabase) throw new Error('Supabase client is not initialized');
    
    // Call the PostgreSQL function to handle status update and seat decrement atomically.
    const { error } = await supabase.rpc('handle_request_update', {
        request_id_arg: requestId,
        new_status: status,
    });

    if (error) {
        console.error('Error updating request status:', error.message);
        throw error;
    }
    // The RPC function doesn't return a value, so we just return a success indicator.
    // The UI will refresh data separately.
    return { success: true };
};