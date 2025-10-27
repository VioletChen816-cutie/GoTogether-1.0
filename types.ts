import { User } from '@supabase/supabase-js';

export enum UserRole {
  Passenger = 'Passenger',
  Driver = 'Driver',
}

// FIX: Removed the 'user' property from the Profile interface.
// The getProfile service does not return a 'user' object, which was causing
// a type mismatch. The 'User' import from '@supabase/supabase-js' is now unused
// and should be removed by a linter, but is kept here to avoid breaking other potential usages if any.
export interface Profile {
  id: string;
  updated_at: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
}

export interface Driver {
  id: string;
  name: string;
  avatar_url: string | null;
  rating: number;
}

export interface Ride {
  id: string;
  from: string;
  to: string;
  departureTime: Date;
  seatsAvailable: number;
  driver: Driver;
  price: number;
  passengers: Driver[];
}

export enum RequestStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Cancelled = 'cancelled',
}

export interface Request {
  id: string;
  createdAt: Date;
  ride: Ride;
  passenger: Driver; // Re-using Driver type for public profile info
  status: RequestStatus;
}