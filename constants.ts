import { Ride, RideStatus } from './types';

export const LOCATIONS: string[] = [
  'Collegetown Ithaca',
  'Downtown Ithaca',
  'Syracuse Airport',
  'JFK Airport',
  'Manhattan',
];

export const INITIAL_RIDES: Ride[] = [
  {
    id: 'ride-1',
    from: 'Collegetown Ithaca',
    to: 'Syracuse Airport',
    departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    seatsAvailable: 3,
    price: 35,
    driver: {
      id: 'driver-1',
      name: 'John D.',
      avatar_url: 'https://picsum.photos/seed/john/100/100',
      // FIX: 'rating' does not exist on type 'Driver'. Changed to 'average_rating' and added 'rating_count' to conform to the type.
      average_rating: 4.9,
      rating_count: 25,
    },
    passengers: [],
    status: RideStatus.Active,
    ratings: [],
  },
  {
    id: 'ride-2',
    from: 'Downtown Ithaca',
    to: 'JFK Airport',
    departureTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
    seatsAvailable: 2,
    price: 80,
    driver: {
      id: 'driver-2',
      name: 'Sarah K.',
      avatar_url: 'https://picsum.photos/seed/sarah/100/100',
      // FIX: 'rating' does not exist on type 'Driver'. Changed to 'average_rating' and added 'rating_count' to conform to the type.
      average_rating: 4.8,
      rating_count: 61,
    },
    passengers: [],
    status: RideStatus.Active,
    ratings: [],
  },
  {
    id: 'ride-3',
    from: 'Manhattan',
    to: 'Collegetown Ithaca',
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    seatsAvailable: 4,
    price: 75,
    driver: {
      id: 'driver-3',
      name: 'Mike L.',
      avatar_url: 'https://picsum.photos/seed/mike/100/100',
      // FIX: 'rating' does not exist on type 'Driver'. Changed to 'average_rating' and added 'rating_count' to conform to the type.
      average_rating: 5.0,
      rating_count: 12,
    },
    passengers: [],
    status: RideStatus.Active,
    ratings: [],
  },
   {
    id: 'ride-4',
    from: 'Syracuse Airport',
    to: 'Downtown Ithaca',
    departureTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    seatsAvailable: 1,
    price: 40,
    driver: {
      id: 'driver-4',
      name: 'Emily R.',
      avatar_url: 'https://picsum.photos/seed/emily/100/100',
      // FIX: 'rating' does not exist on type 'Driver'. Changed to 'average_rating' and added 'rating_count' to conform to the type.
      average_rating: 4.9,
      rating_count: 48,
    },
    passengers: [],
    status: RideStatus.Active,
    ratings: [],
  },
];
