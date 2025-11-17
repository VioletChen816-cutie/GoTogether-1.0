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

export const INITIAL_RIDES: Ride[] = [];
