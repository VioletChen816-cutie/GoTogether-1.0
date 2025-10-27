import { Ride } from './types';

export const LOCATIONS: string[] = [
  'Downtown',
  'Airport',
  'University Campus',
  'North Suburbs',
  'South Suburbs',
  'West End',
  'East Plaza',
  'Tech Park',
];

export const INITIAL_RIDES: Ride[] = [
  {
    id: 'ride-1',
    from: 'Downtown',
    to: 'Airport',
    departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    seatsAvailable: 3,
    price: 25,
    driver: {
      // FIX: Property 'id' is missing in type '{ name: string; avatar: string; rating: number; }' but required in type 'Driver'.
      id: 'driver-1',
      name: 'John D.',
      avatar: 'https://picsum.photos/seed/john/100/100',
      rating: 4.9,
    },
  },
  {
    id: 'ride-2',
    from: 'University Campus',
    to: 'North Suburbs',
    departureTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
    seatsAvailable: 2,
    price: 15,
    driver: {
      // FIX: Property 'id' is missing in type '{ name: string; avatar: string; rating: number; }' but required in type 'Driver'.
      id: 'driver-2',
      name: 'Sarah K.',
      avatar: 'https://picsum.photos/seed/sarah/100/100',
      rating: 4.8,
    },
  },
  {
    id: 'ride-3',
    from: 'Tech Park',
    to: 'Downtown',
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    seatsAvailable: 4,
    price: 18,
    driver: {
      // FIX: Property 'id' is missing in type '{ name: string; avatar: string; rating: number; }' but required in type 'Driver'.
      id: 'driver-3',
      name: 'Mike L.',
      avatar: 'https://picsum.photos/seed/mike/100/100',
      rating: 5.0,
    },
  },
   {
    id: 'ride-4',
    from: 'South Suburbs',
    to: 'Airport',
    departureTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    seatsAvailable: 1,
    price: 30,
    driver: {
      // FIX: Property 'id' is missing in type '{ name: string; avatar: string; rating: number; }' but required in type 'Driver'.
      id: 'driver-4',
      name: 'Emily R.',
      avatar: 'https://picsum.photos/seed/emily/100/100',
      rating: 4.9,
    },
  },
];
