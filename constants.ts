import { Ride } from './types';

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
      // FIX: Object literal may only specify known properties, and 'avatar' does not exist in type 'Driver'.
      avatar_url: 'https://picsum.photos/seed/john/100/100',
      rating: 4.9,
    },
    // FIX: Property 'passengers' is missing in type '{ id: string; from: string; to: string; departureTime: Date; seatsAvailable: number; price: number; driver: { id: string; name: string; avatar_url: string; rating: number; }; }' but required in type 'Ride'.
    passengers: [],
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
      // FIX: Object literal may only specify known properties, and 'avatar' does not exist in type 'Driver'.
      avatar_url: 'https://picsum.photos/seed/sarah/100/100',
      rating: 4.8,
    },
    // FIX: Property 'passengers' is missing in type '{ id: string; from: string; to: string; departureTime: Date; seatsAvailable: number; price: number; driver: { id: string; name: string; avatar_url: string; rating: number; }; }' but required in type 'Ride'.
    passengers: [],
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
      // FIX: Object literal may only specify known properties, and 'avatar' does not exist in type 'Driver'.
      avatar_url: 'https://picsum.photos/seed/mike/100/100',
      rating: 5.0,
    },
    // FIX: Property 'passengers' is missing in type '{ id: string; from: string; to: string; departureTime: Date; seatsAvailable: number; price: number; driver: { id: string; name: string; avatar_url: string; rating: number; }; }' but required in type 'Ride'.
    passengers: [],
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
      // FIX: Object literal may only specify known properties, and 'avatar' does not exist in type 'Driver'.
      avatar_url: 'https://picsum.photos/seed/emily/100/100',
      rating: 4.9,
    },
    // FIX: Property 'passengers' is missing in type '{ id: string; from: string; to: string; departureTime: Date; seatsAvailable: number; price: number; driver: { id: string; name: string; avatar_url: string; rating: number; }; }' but required in type 'Ride'.
    passengers: [],
  },
];