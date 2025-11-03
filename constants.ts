import { Ride, RideStatus } from './types';

export const LOCATIONS: string[] = [
  'Collegetown Ithaca',
  'Downtown Ithaca',
  'Syracuse Airport',
  'JFK Airport',
  'Manhattan',
  'Weill Cornell Medical College',
  'Cornell Tech campus',
];

export const DEFAULT_AVATARS: { name: string; url: string }[] = [
  {
    name: 'Otter',
    url: 'https://static.vecteezy.com/system/resources/previews/027/293/260/original/sea-otter-with-a-blue-background-ai-generated-png.png'
  },
  {
    name: 'Fox',
    url: 'https://static.vecteezy.com/system/resources/previews/024/709/018/original/cute-fox-cartoon-illustration-png.png'
  },
  {
    name: 'Red Panda',
    url: 'https://static.vecteezy.com/system/resources/previews/024/953/194/original/a-red-panda-with-curled-tail-on-a-transparent-background-png.png'
  },
  {
    name: 'Sheep',
    url: 'https://static.vecteezy.com/system/resources/previews/025/104/249/original/cute-sheep-transparent-background-png.png'
  }
];

export const DEFAULT_AVATAR_URL = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

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
      // FIX: Property 'is_verified_student' is missing in type '{ id: string; name: string; avatar_url: string; average_rating: number; rating_count: number; }' but required in type 'Driver'.
      is_verified_student: true,
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
      // FIX: Property 'is_verified_student' is missing in type '{ id: string; name: string; avatar_url: string; average_rating: number; rating_count: number; }' but required in type 'Driver'.
      is_verified_student: true,
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
      // FIX: Property 'is_verified_student' is missing in type '{ id: string; name: string; avatar_url: string; average_rating: number; rating_count: number; }' but required in type 'Driver'.
      is_verified_student: false,
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
      // FIX: Property 'is_verified_student' is missing in type '{ id: string; name: string; avatar_url: string; average_rating: number; rating_count: number; }' but required in type 'Driver'.
      is_verified_student: true,
    },
    passengers: [],
    status: RideStatus.Active,
    ratings: [],
  },
];