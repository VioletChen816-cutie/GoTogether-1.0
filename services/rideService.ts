import { supabase } from '../lib/supabaseClient';
import { Ride, Driver, Request, RequestStatus, Rating, CarInfo, PassengerRideRequest, FeedItem } from '../types';

const rideSelectQuery = `
  id,
  from,
  to,
  departure_time,
  seats_available,
  price,
  status,
  fulfilled_from_request_id,
  car_make,
  car_model,
  car_year,
  car_color,
  car_license_plate,
  car_is_insured,
  driver:driver_id (
    id,
    full_name,
    avatar_url,
    average_rating,
    rating_count,
    phone_number,
    payment_methods,
    is_verified_student,
    username,
    email
  ),
  requests!ride_id (
    status,
    passenger:passenger_id(id, full_name, avatar_url, average_rating, rating_count, phone_number, is_verified_student, username, email)
  ),
  ratings!ride_id (
    rater_id,
    ratee_id,
    rating
  )
`;

const mapDriverData = (profile: any): Driver => {
    if (!profile) {
        return { id: 'unknown', name: 'Unknown Driver', avatar_url: null, average_rating: 0, rating_count: 0, phone_number: null, payment_methods: null, is_verified_student: false };
    }
    return {
        id: profile.id,
        name: profile.full_name || profile.name || 'No Name',
        avatar_url: profile.avatar_url,
        average_rating: profile.average_rating || 0,
        rating_count: profile.rating_count || 0,
        phone_number: profile.phone_number,
        payment_methods: profile.payment_methods,
        is_verified_student: profile.is_verified_student || false,
        username: profile.username,
        email: profile.email,
    };
};

const mapRideData = (ride: any): Ride => {
  const acceptedPassengers = ride.requests
    ?.filter((req: any) => req.status === 'accepted' && req.passenger)
    .map((req: any) => mapDriverData(req.passenger)) || [];
    
  const pendingPassengers = ride.requests
    ?.filter((req: any) => req.status === 'pending-passenger-approval' && req.passenger)
    .map((req: any) => mapDriverData(req.passenger)) || [];

  const carData: CarInfo | undefined = ride.car_make ? {
    make: ride.car_make,
    model: ride.car_model,
    year: ride.car_year,
    color: ride.car_color,
    license_plate: ride.car_license_plate,
    is_insured: ride.car_is_insured,
  } : undefined;

  return {
    itemType: 'offer',
    id: ride.id,
    from: ride.from,
    to: ride.to,
    departureTime: new Date(ride.departure_time),
    seatsAvailable: ride.seats_available,
    price: ride.price,
    driver: mapDriverData(ride.driver),
    passengers: acceptedPassengers,
    pendingPassengers,
    status: ride.status,
    ratings: ride.ratings as Rating[],
    car: carData,
    fulfilledFromRequestId: ride.fulfilled_from_request_id,
  };
};

const getRides = async (): Promise<Ride[]> => {
  if (!supabase) throw new Error('Supabase client is not initialized');

  const { data, error } = await supabase
    .from('rides')
    .select(rideSelectQuery)
    .in('status', ['active', 'cancelled', 'completed'])
    .order('departure_time', { ascending: false });

  if (error) {
    console.error('Error fetching rides:', error.message || error);
    throw error;
  }
  
  if (!data) return [];

  return data.map(mapRideData);
};

export const addRide = async (newRide: Omit<Ride, 'id' | 'driver' | 'passengers' | 'status' | 'ratings' | 'itemType'>): Promise<any> => {
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
    car_is_insured: newRide.car?.is_insured,
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

export const getPassengerRequests = async (): Promise<Request[]> => {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Step 1: Get the user's requests, including their profile info and the ID of the ride they requested.
    const { data: userRequests, error: reqError } = await supabase
        .from('requests')
        .select('id, created_at, status, ride_id, passenger:passenger_id(*)')
        .eq('passenger_id', user.id);

    if (reqError) {
        console.error('Error fetching passenger requests (step 1):', reqError.message);
        throw reqError;
    }
    if (!userRequests || userRequests.length === 0) return [];

    // Step 2: Collect all the unique ride IDs from the requests.
    const rideIds = [...new Set(userRequests.map(r => r.ride_id).filter(id => id))];
    if (rideIds.length === 0) return [];


    // Step 3: Fetch all the details for those rides in a single query. This is more efficient.
    const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select(rideSelectQuery)
        .in('id', rideIds);
    
    if (ridesError) {
        console.error('Error fetching ride data for requests (step 2):', ridesError.message);
        throw ridesError;
    }
    if (!ridesData) return [];

    // Step 4: Create a Map for quick lookup of ride details by ride ID.
    const ridesMap = new Map(ridesData.map(ride => [ride.id, mapRideData(ride)]));

    // Step 5: Combine the request data with the full ride data.
    const combinedRequests = userRequests
      .filter(req => ridesMap.has(req.ride_id) && req.passenger)
      .map(req => ({
        id: req.id,
        createdAt: new Date(req.created_at),
        status: req.status as RequestStatus,
        ride: ridesMap.get(req.ride_id)!,
        passenger: mapDriverData(req.passenger),
    }));

    return combinedRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getDriverRequests = async (): Promise<Request[]> => {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Step 1: Get the IDs of all rides posted by the current user.
    const { data: rideIdsData, error: rideIdError } = await supabase
      .from('rides')
      .select('id')
      .eq('driver_id', user.id);

    if (rideIdError) throw rideIdError;
    if (!rideIdsData || rideIdsData.length === 0) return [];
    const rideIds = rideIdsData.map(r => r.id);

    // Step 2: Fetch all requests associated with those ride IDs.
    const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select('id, created_at, status, ride_id, passenger:passenger_id(*)')
        .in('ride_id', rideIds);

    if (requestsError) throw requestsError;
    if (!requestsData || requestsData.length === 0) return [];

    // Step 3: Fetch all the details for the relevant rides in a single query.
    const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select(rideSelectQuery)
        .in('id', rideIds);

    if (ridesError) throw ridesError;
    if (!ridesData) return [];

    // Step 4: Create a Map for quick lookup of ride details.
    const ridesMap = new Map(ridesData.map(ride => [ride.id, mapRideData(ride)]));

    // Step 5: Combine the request data with the full ride data.
    const validRequests = requestsData
      .filter(req => ridesMap.has(req.ride_id) && req.passenger)
      .map(req => ({
        id: req.id,
        createdAt: new Date(req.created_at),
        status: req.status as RequestStatus,
        ride: ridesMap.get(req.ride_id)!,
        passenger: mapDriverData(req.passenger),
    }));
    
    // Sort requests by most recent.
    return validRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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

export const respondToDriverOffer = async (requestId: string, response: 'accepted' | 'rejected'): Promise<void> => {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { error } = await supabase.rpc('passenger_respond_to_offer', {
        request_id_arg: requestId,
        response_status: response,
    });

    if (error) {
        console.error('Error responding to driver offer:', error.message);
        throw error;
    }
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


// --- Passenger Ride Requests ---

const getPassengerRideRequests = async (): Promise<PassengerRideRequest[]> => {
  if (!supabase) throw new Error('Supabase client is not initialized');

  const { data, error } = await supabase
    .from('passenger_ride_requests')
    .select(`
      id,
      created_at,
      from,
      to,
      departure_date,
      flexible_time,
      seats_needed,
      notes,
      status,
      willing_to_split_fuel,
      passenger:passenger_id (
        id,
        full_name,
        avatar_url,
        average_rating,
        rating_count,
        is_verified_student,
        username,
        email
      )
    `)
    .in('status', ['open', 'fulfilled', 'pending-passenger-approval'])
    .order('departure_date', { ascending: true });

  if (error) {
    // FIX: Add a check for a missing table. This error commonly occurs if the database schema
    // hasn't been updated. By catching it here, we prevent the entire app from crashing and
    // allow other features to function. A warning is logged to guide the developer.
    if (error.message.includes("Could not find the table 'public.passenger_ride_requests'")) {
      console.warn("Warning: The 'passenger_ride_requests' table was not found. This feature will be disabled until the database schema is updated.");
      return [];
    }
    console.error('Error fetching passenger ride requests:', error.message);
    throw error;
  }
  if (!data) return [];
  
  return data.map((req: any) => ({
    itemType: 'request',
    id: req.id,
    createdAt: new Date(req.created_at),
    from: req.from,
    to: req.to,
    // FIX: Parse date string in local timezone to prevent off-by-one-day errors.
    // 'YYYY-MM-DD' is parsed as UTC, but 'YYYY/MM/DD' is parsed as local.
    departureDate: new Date(req.departure_date.replace(/-/g, '/')),
    flexibleTime: req.flexible_time,
    seatsNeeded: req.seats_needed,
    notes: req.notes,
    status: req.status,
    passenger: mapDriverData(req.passenger), // re-using this mapper for public profile data
    willingToSplitFuel: req.willing_to_split_fuel,
  }));
}

export const getMyPassengerRideRequests = async (): Promise<PassengerRideRequest[]> => {
  if (!supabase) throw new Error('Supabase client is not initialized');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('passenger_ride_requests')
    .select(`
      id, created_at, from, to, departure_date, flexible_time, seats_needed, notes, status, willing_to_split_fuel,
      passenger:passenger_id (
        id, full_name, avatar_url, average_rating, rating_count, is_verified_student, username, email
      ),
      fulfilled_by:fulfilled_by_driver_id (
        id, full_name, avatar_url, average_rating, rating_count, phone_number, payment_methods, is_verified_student, username, email
      )
    `)
    .eq('passenger_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my passenger ride requests:', error.message);
    throw error;
  }
  if (!data) return [];
  
  return data.map((req: any) => ({
    itemType: 'request',
    id: req.id,
    createdAt: new Date(req.created_at),
    from: req.from,
    to: req.to,
    // FIX: Parse date string in local timezone to prevent off-by-one-day errors.
    // 'YYYY-MM-DD' is parsed as UTC, but 'YYYY/MM/DD' is parsed as local.
    departureDate: new Date(req.departure_date.replace(/-/g, '/')),
    flexibleTime: req.flexible_time,
    seatsNeeded: req.seats_needed,
    notes: req.notes,
    status: req.status,
    passenger: mapDriverData(req.passenger),
    willingToSplitFuel: req.willing_to_split_fuel,
    fulfilled_by: req.fulfilled_by ? mapDriverData(req.fulfilled_by) : undefined,
  }));
}

export const addPassengerRideRequest = async (requestData: Omit<PassengerRideRequest, 'id' | 'createdAt' | 'passenger' | 'status' | 'itemType' | 'fulfilled_by'>) => {
    if (!supabase) throw new Error('Supabase client is not initialized');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in to post a ride request');

    const { error } = await supabase
        .from('passenger_ride_requests')
        .insert({
            passenger_id: user.id,
            from: requestData.from,
            to: requestData.to,
            departure_date: requestData.departureDate.toISOString().split('T')[0],
            flexible_time: requestData.flexibleTime,
            seats_needed: requestData.seatsNeeded,
            notes: requestData.notes,
            willing_to_split_fuel: requestData.willingToSplitFuel,
        });

    if (error) {
        console.error('Error adding passenger ride request:', error.message);
        if (error.message.includes("Could not find the table 'public.passenger_ride_requests'")) {
            throw new Error("Feature not available. Please update the database schema with the 'passenger_ride_requests' table from schema.md.");
        }
        throw error;
    }
};

export const createRideFromRequest = async (details: {
  requestId: string;
  departureTime: Date;
  price: number;
  carId: string;
}): Promise<void> => {
  if (!supabase) throw new Error('Supabase client is not initialized');
  const { error } = await supabase.rpc('create_ride_from_request', {
    request_id_arg: details.requestId,
    departure_time_arg: details.departureTime.toISOString(),
    price_arg: details.price,
    car_id_arg: details.carId
  });

  if (error) {
    console.error('Error creating ride from request:', error.message);
    throw error;
  }
};


// --- Combined Feed ---
export const getFeedItems = async (): Promise<FeedItem[]> => {
  const [rides, requests] = await Promise.all([
    getRides(),
    getPassengerRideRequests(),
  ]);

  const combined = [...rides, ...requests];

  // Sort by departure date, soonest first
  return combined.sort((a, b) => {
    const dateA = a.itemType === 'offer' ? a.departureTime : a.departureDate;
    const dateB = b.itemType === 'offer' ? b.departureTime : b.departureDate;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });
};
