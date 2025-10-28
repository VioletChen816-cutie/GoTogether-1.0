import { supabase } from '../lib/supabaseClient';
import { Ride, Driver, Request, RequestStatus, Rating, CarInfo } from '../types';

const rideSelectQuery = `
  id,
  from,
  to,
  departure_time,
  seats_available,
  price,
  status,
  car_make,
  car_model,
  car_year,
  car_color,
  car_license_plate,
  driver:driver_id (
    id,
    full_name,
    avatar_url,
    average_rating,
    rating_count
  ),
  requests (
    status,
    passenger:passenger_id(id, full_name, avatar_url, average_rating, rating_count)
  ),
  ratings (
    rater_id,
    ratee_id,
    rating
  )
`;

const rideSelectQueryForRequest = `
  id,
  from,
  to,
  departure_time,
  seats_available,
  price,
  status,
  car_make,
  car_model,
  car_year,
  car_color,
  car_license_plate,
  driver:driver_id (
    id,
    full_name,
    avatar_url,
    average_rating,
    rating_count
  ),
  ratings (
    rater_id,
    ratee_id,
    rating
  )
`;

const mapDriverData = (profile: any): Driver => {
    if (!profile) {
        return { id: 'unknown', name: 'Unknown Driver', avatar_url: null, average_rating: 0, rating_count: 0 };
    }
    return {
        id: profile.id,
        name: profile.full_name || profile.name || 'No Name',
        avatar_url: profile.avatar_url,
        average_rating: profile.average_rating || 0,
        rating_count: profile.rating_count || 0,
    };
};

const mapRideData = (ride: any): Ride => {
  const acceptedPassengers = ride.requests
    ?.filter((req: any) => req.status === 'accepted' && req.passenger)
    .map((req: any) => mapDriverData(req.passenger)) || [];
    
  const carData: CarInfo | undefined = ride.car_make ? {
    make: ride.car_make,
    model: ride.car_model,
    year: ride.car_year,
    color: ride.car_color,
    license_plate: ride.car_license_plate,
  } : undefined;

  return {
    id: ride.id,
    from: ride.from,
    to: ride.to,
    departureTime: new Date(ride.departure_time),
    seatsAvailable: ride.seats_available,
    price: ride.price,
    driver: mapDriverData(ride.driver),
    passengers: acceptedPassengers,
    status: ride.status,
    ratings: ride.ratings as Rating[],
    car: carData,
  };
};

export const getRides = async (): Promise<Ride[]> => {
  if (!supabase) throw new Error('Supabase client is not initialized');

  const { data, error } = await supabase
    .from('rides')
    .select(rideSelectQuery)
    .gt('departure_time', new Date().toISOString())
    .in('status', ['active', 'cancelled'])
    .order('departure_time', { ascending: true });

  if (error) {
    console.error('Error fetching rides:', error.message || error);
    throw error;
  }
  
  if (!data) return [];

  return data.map(mapRideData);
};

export const addRide = async (newRide: Omit<Ride, 'id' | 'driver' | 'passengers' | 'status' | 'ratings'>): Promise<any> => {
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
    car_make: newRide.car?.make,
    car_model: newRide.car?.model,
    car_year: newRide.car?.year,
    car_color: newRide.car?.color,
    car_license_plate: newRide.car?.license_plate,
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

export const getDriverRides = async (): Promise<Ride[]> => {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('rides')
        .select(rideSelectQuery)
        .eq('driver_id', user.id)
        .order('departure_time', { ascending: false });
    
    if (error) {
        console.error('Error fetching driver rides:', error.message);
        throw error;
    }

    if (!data) return [];
    return data.map(mapRideData);
};


// --- Request Management ---

export const requestRide = async (rideId: string): Promise<any> => {
  if (!supabase) throw new Error('Supabase client is not initialized');
  
  // The RPC function will handle user authentication and logic internally.
  const { data, error } = await supabase.rpc('request_or_rerequest_ride', {
    ride_id_arg: rideId
  });

  if (error) {
    console.error('Error creating request:', error.message || error);
    // The RPC throws a specific exception for active requests.
    if (error.message.includes('You already have an active request for this ride.')) {
        throw new Error("You already have an active request for this ride.");
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
  passenger: mapDriverData(req.profiles),
});

export const getPassengerRequests = async (): Promise<Request[]> => {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('requests')
        .select(`
            id, created_at, status,
            rides ( ${rideSelectQueryForRequest} ),
            profiles!passenger_id (id, full_name, avatar_url, average_rating, rating_count)
        `)
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching passenger requests:', error.message);
        throw error;
    }
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
    
    const { data, error } = await supabase
        .from('requests')
        .select(`
            id, created_at, status,
            rides ( ${rideSelectQueryForRequest} ),
            profiles!passenger_id (id, full_name, avatar_url, average_rating, rating_count)
        `)
        .in('ride_id', rideIds.map(r => r.id))
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching driver requests:', error.message);
        throw error;
    }
    
    const validData = data.filter(req => req.rides && req.profiles);
    return validData.map(mapRequestData);
};


export const updateRequestStatus = async (requestId: string, status: RequestStatus): Promise<any> => {
    if (!supabase) throw new Error('Supabase client is not initialized');
    
    const { error } = await supabase.rpc('handle_request_update', {
        request_id_arg: requestId,
        new_status: status,
    });

    if (error) {
        console.error('Error updating request status:', error.message);
        throw error;
    }
    return { success: true };
};

export const cancelRide = async (rideId: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { error } = await supabase.rpc('cancel_ride', {
        ride_id_arg: rideId
    });
    if (error) {
        console.error('Error cancelling ride:', error.message);
        throw error;
    }
};

// --- Rating System ---

export const completeRide = async (rideId: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { error } = await supabase.rpc('complete_ride', {
        ride_id_arg: rideId
    });
    if (error) {
        console.error('Error completing ride:', error.message);
        throw error;
    }
};

export const submitRating = async (ratingData: { rideId: string; rateeId: string; rating: number; comment?: string; }) => {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in to submit a rating');

    const { error } = await supabase.from('ratings').insert({
        ride_id: ratingData.rideId,
        rater_id: user.id,
        ratee_id: ratingData.rateeId,
        rating: ratingData.rating,
        comment: ratingData.comment
    });

    if (error) {
        console.error('Error submitting rating:', error);
        throw error;
    }
};