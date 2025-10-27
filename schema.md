# GoTogether Rideshare - Supabase Schema

This is an updated script that will first **reset your database schema** by deleting any existing tables (`profiles`, `rides`, `requests`) and then create them again from scratch. This ensures a clean setup and prevents errors if you've run the script before.

**Instructions:** Copy and paste the entire script into a new query in the Supabase SQL Editor and run it.

```sql
-- ========= RESET SCRIPT =========
-- Drop existing objects to ensure a clean slate.
-- The "IF EXISTS" clause prevents errors if the objects don't exist.

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars." ON storage.objects;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_request_update(uuid, request_status);
DROP FUNCTION IF EXISTS public.cancel_ride(uuid);
DROP TABLE IF EXISTS public.requests;
DROP TABLE IF EXISTS public.rides;
DROP TABLE IF EXISTS public.profiles;
DROP TYPE IF EXISTS public.request_status;


-- ========= CREATE SCRIPT =========

-- 1. Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  phone_number text
);

-- 2. Set up Row Level Security (RLS) for profiles
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- 3. Set up Storage for Avatars
-- The 'on conflict do nothing' clause prevents errors if the bucket already exists.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Users can update their own avatars." on storage.objects
    for update with check (auth.uid() = owner);


-- 4. Create a trigger that automatically creates a profile for new users.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, phone_number)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', null);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 5. Create Request Status Enum Type
create type public.request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');


-- 6. Create Rides Table
create table rides (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    driver_id uuid not null references public.profiles(id) on delete cascade,
    "from" text not null,
    "to" text not null,
    departure_time timestamp with time zone not null,
    seats_available integer not null check (seats_available >= 0),
    price numeric not null check (price >= 0)
);

-- 7. Set up RLS for Rides Table
alter table rides
  enable row level security;

create policy "Authenticated users can view rides." on rides
  for select to authenticated using (true);

create policy "Users can create their own rides." on rides
  for insert to authenticated with check (auth.uid() = driver_id);

create policy "Drivers can update their own rides." on rides
  for update to authenticated using (auth.uid() = driver_id);

create policy "Drivers can delete their own rides." on rides
  for delete to authenticated using (auth.uid() = driver_id);


-- 8. Create Requests Table
create table requests (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    ride_id uuid not null references public.rides(id) on delete cascade,
    passenger_id uuid not null references public.profiles(id) on delete cascade,
    status public.request_status not null default 'pending'::public.request_status,
    -- Prevent a user from requesting the same ride multiple times
    unique(ride_id, passenger_id)
);

-- 9. Set up RLS for Requests Table
alter table requests
    enable row level security;

create policy "Passengers can see their own requests." on requests
    for select to authenticated using (auth.uid() = passenger_id);

create policy "Drivers can see requests for their rides." on requests
    for select to authenticated using (
        exists (
            select 1 from rides where rides.id = requests.ride_id and rides.driver_id = auth.uid()
        )
    );

create policy "Passengers can create requests for rides." on requests
    for insert to authenticated with check (
        auth.uid() = passenger_id
        -- Ensure passenger is not the driver of the ride
        and not exists (
            select 1 from rides where rides.id = requests.ride_id and rides.driver_id = auth.uid()
        )
    );

create policy "Drivers can update status of requests for their rides." on requests
    for update to authenticated using (
        exists (
            select 1 from rides where rides.id = requests.ride_id and rides.driver_id = auth.uid()
        )
    ) with check ( status in ('accepted', 'rejected', 'cancelled') );

create policy "Passengers can cancel their pending requests." on requests
    for update to authenticated using (auth.uid() = passenger_id)
    with check (status = 'cancelled');

-- 10. Create Function to Handle Request Updates and Seat Counts
create or replace function public.handle_request_update(request_id_arg uuid, new_status request_status)
returns void as $$
declare
  _ride_id uuid;
  _current_status request_status;
  _updated_ride_id uuid;
begin
  -- Get the current state of the request
  select ride_id, status into _ride_id, _current_status
  from public.requests
  where id = request_id_arg;

  -- If no request found, exit.
  if not found then
    return;
  end if;

  -- Scenario 1: A pending request is being accepted
  if _current_status = 'pending' and new_status = 'accepted' then
    -- Atomically decrement seats IF available, and return the id of the ride that was updated.
    update public.rides
    set seats_available = seats_available - 1
    where id = _ride_id and seats_available > 0
    returning id into _updated_ride_id;

    -- If the update returned a ride_id, it means a seat was available and was taken.
    if _updated_ride_id is not null then
      -- Now it's safe to accept the request.
      update public.requests
      set status = 'accepted'
      where id = request_id_arg;
      
      -- Check if the ride is now full.
      if (select seats_available from public.rides where id = _ride_id) = 0 then
        -- If full, reject all other pending requests for this ride.
        update public.requests
        set status = 'rejected'
        where ride_id = _ride_id and status = 'pending';
      end if;
    else
      -- No seats were available. The ride was not updated.
      -- Reject this request to prevent overbooking.
      update public.requests
      set status = 'rejected'
      where id = request_id_arg;
    end if;
    return;
  end if;

  -- Scenario 2: An accepted request is being cancelled (by the driver)
  if _current_status = 'accepted' and new_status = 'cancelled' then
    -- Increment the seat count on the ride
    update public.rides
    set seats_available = seats_available + 1
    where id = _ride_id;

    -- Update the request status
    update public.requests
    set status = 'cancelled'
    where id = request_id_arg;
    return;
  end if;

  -- Default case for other transitions (e.g., pending -> rejected, pending -> cancelled)
  -- that don't affect seat count.
  update public.requests
  set status = new_status
  where id = request_id_arg;

end;
$$ language plpgsql security definer;

-- 11. Create Function for Driver to Cancel a Ride
create or replace function public.cancel_ride(ride_id_arg uuid)
returns void as $$
begin
  -- Ensure the current user is the driver of the ride
  if not exists (select 1 from public.rides where id = ride_id_arg and driver_id = auth.uid()) then
    raise exception 'Only the driver can cancel this ride.';
  end if;

  -- "Notify" passengers by cancelling their requests
  update public.requests
  set status = 'cancelled'
  where ride_id = ride_id_arg and status in ('pending', 'accepted');

  -- Delete the ride
  delete from public.rides
  where id = ride_id_arg;
end;
$$ language plpgsql security definer;
```