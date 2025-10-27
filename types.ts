
export enum UserRole {
  Passenger = 'Passenger',
  Driver = 'Driver',
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
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
