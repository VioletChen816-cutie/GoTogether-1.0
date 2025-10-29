import { User } from '@supabase/supabase-js';

export enum UserRole {
  Passenger = 'Passenger',
  Driver = 'Driver',
}

export interface Profile {
  id: string;
  updated_at: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  average_rating: number;
  rating_count: number;
}

export interface Driver {
  id: string;
  name: string;
  avatar_url: string | null;
  average_rating: number;
  rating_count: number;
  phone_number?: string | null;
}

export enum RideStatus {
  Active = 'active',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

export interface Rating {
  rater_id: string;
  ratee_id: string;
  rating: number;
}

export interface CarInfo {
  make: string;
  model: string;
  year?: number;
  color?: string;
  license_plate: string;
  is_insured: boolean;
}

export interface Car extends CarInfo {
  id: string;
  owner_id: string;
  is_default: boolean;
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
  status: RideStatus;
  ratings: Rating[];
  car?: CarInfo;
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

export type NotificationType = {
  message: string;
  type: 'success' | 'info' | 'error';
};

export interface UserToRate {
  id: string;
  name: string;
  avatar_url: string | null;
}

export enum NotificationEnumType {
  NewRequest = 'NEW_REQUEST',
  RequestAccepted = 'REQUEST_ACCEPTED',
  RequestRejected = 'REQUEST_REJECTED',
  PassengerCancelled = 'PASSENGER_CANCELLED',
  DriverCancelledRide = 'DRIVER_CANCELLED_RIDE',
  BookingCancelled = 'BOOKING_CANCELLED',
}

export interface AppNotification {
  id: string;
  created_at: string;
  user_id: string;
  ride_id: string | null;
  request_id: string | null;
  type: NotificationEnumType;
  message: string;
  is_read: boolean;
  rides?: {
    from: string;
    to: string;
  }
}