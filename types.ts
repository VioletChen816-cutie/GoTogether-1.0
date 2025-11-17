import { User } from '@supabase/supabase-js';

export enum UserRole {
  Passenger = 'Passenger',
  Driver = 'Driver',
}

export interface PaymentMethodInfo {
  method: 'venmo' | 'zelle' | 'cashapp';
  handle: string;
}

export interface Profile {
  id: string;
  updated_at: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  payment_methods: PaymentMethodInfo[] | null;
  average_rating: number;
  rating_count: number;
  is_verified_student: boolean;
  username?: string;
  email?: string;
}

export interface Driver {
  id: string;
  name: string;
  avatar_url: string | null;
  average_rating: number;
  rating_count: number;
  phone_number?: string | null;
  payment_methods?: PaymentMethodInfo[] | null;
  is_verified_student: boolean;
  username?: string;
  email?: string;
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
  itemType: 'offer';
  id: string;
  from: string;
  to: string;
  departureTime: Date;
  seatsAvailable: number;
  driver: Driver;
  price: number;
  passengers: Driver[];
  pendingPassengers?: Driver[];
  status: RideStatus;
  ratings: Rating[];
  car?: CarInfo;
  fulfilledFromRequestId?: string | null;
}

export interface PassengerRideRequest {
  itemType: 'request';
  id: string;
  createdAt: Date;
  passenger: Driver;
  from: string;
  to: string;
  departureDate: Date;
  flexibleTime: string;
  seatsNeeded: number;
  notes: string | null;
  status: 'open' | 'fulfilled' | 'cancelled' | 'pending-passenger-approval';
  willingToSplitFuel: boolean;
  fulfilled_by?: Driver;
}

export type FeedItem = Ride | PassengerRideRequest;

export enum RequestStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Cancelled = 'cancelled',
  PendingPassengerApproval = 'pending-passenger-approval',
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
  PassengerRequestAccepted = 'PASSENGER_REQUEST_ACCEPTED',
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