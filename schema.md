# GoTogether Rideshare - Supabase Schema

This is an updated script that will first **reset your database schema** by deleting any existing tables and functions, then create them again from scratch. This ensures a clean setup and prevents errors if you've run the script before.

**Instructions:** Copy and paste the entire script into a new query in the Supabase SQL Editor and run it.

```sql
-- ========= RESET SCRIPT =========
-- This script is reordered to be more robust. It drops the main tables first,
-- allowing CASCADE to handle most dependencies (like policies and triggers on those tables),
-- which prevents errors if a table didn't exist from a previous failed run.

-- Step 1: Drop all tables in the public schema.
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.requests CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.rides CASCADE;
DROP TABLE IF EXISTS public.cars CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Drop the trigger from the auth.users table.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Drop all functions.
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_request_update(uuid, request_status);
DROP FUNCTION IF EXISTS public.cancel_ride(uuid);
DROP FUNCTION IF EXISTS public.request_or_rerequest_ride(uuid);
DROP FUNCTION IF EXISTS public.complete_ride(uuid);
DROP FUNCTION IF EXISTS public.update_profile_rating();
DROP FUNCTION IF EXISTS public.set_default_car(uuid);
DROP FUNCTION IF EXISTS public.create_notification(uuid, public.notification_type, text, uuid, uuid);


-- Step 4: Drop types. The tables that used them have been dropped.
DROP TYPE IF EXISTS public.notification_type;
DROP TYPE IF EXISTS public.request_status;
DROP TYPE IF EXISTS public.ride_status;

-- Step 5: Drop storage policies.
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars." ON storage.objects;


-- ========= CREATE SCRIPT =========

-- 1. Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  phone_number text,
  payment_methods jsonb,
  average_rating numeric(2,1) not null default 0.0,
  rating_count integer not null default 0,
  is_verified_student boolean not null default false,
  username text,
  email text
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

create policy "Authenticated users can upload an avatar." on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

create policy "Users can update their own avatars." on storage.objects
    for update using (auth.uid() = owner) with check (auth.uid() = owner);

create policy "Users can delete their own avatars." on storage.objects
    for delete using (auth.uid() = owner);


-- 4. Create a trigger that automatically creates a profile for new users.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, phone_number, is_verified_student, username, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone_number',
    (new.email like '%.edu'), -- Sets to true if email ends with .edu
    split_part(new.email, '@', 1),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 5. Create Enum Types
create type public.request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
create type public.ride_status as enum ('active', 'cancelled', 'completed');
create type public.notification_type as enum (
  'NEW_REQUEST',
  'REQUEST_ACCEPTED',
  'REQUEST_REJECTED',
  'PASSENGER_CANCELLED',
  'DRIVER_CANCELLED_RIDE',
  'BOOKING_CANCELLED'
);


-- 6. Create Cars Table
create table cars (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    owner_id uuid not null references public.profiles(id) on delete cascade,
    make text not null,
    model text not null,
    year integer,
    color text,
    license_plate text not null,
    is_default boolean not null default false,
    is_insured boolean not null default false
);

-- 7. Set up RLS for Cars Table
alter table cars
  enable row level security;

create policy "Users can view their own cars." on cars
  for select using (auth.uid() = owner_id);
  
create policy "Users can add their own cars." on cars
  for insert with check (auth.uid() = owner_id);

create policy "Users can update their own cars." on cars
  for update using (auth.uid() = owner_id);

create policy "Users can delete their own cars." on cars
  for delete using (auth.uid() = owner_id);
  
-- 8. Create Function to set a default car
create or replace function public.set_default_car(car_id_arg uuid)
returns void as $$
begin
  if not exists (select 1 from public.cars where id = car_id_arg and owner_id = auth.uid()) then
    raise exception 'Cannot set a car you do not own as default.';
  end if;
  
  update public.cars
  set is_default = false
  where owner_id = auth.uid() and is_default = true;
  
  update public.cars
  set is_default = true
  where id = car_id_arg;
end;
$$ language plpgsql security definer;


-- 9. Create Rides Table
create table rides (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    driver_id uuid not null references public.profiles(id) on delete cascade,
    "from" text not null,
    "to" text not null,
    departure_time timestamp with time zone not null,
    seats_available integer not null check (seats_available >= 0),
    price numeric not null check (price >= 0),
    status public.ride_status not null default 'active',
    car_make text,
    car_model text,
    car_year integer,
    car_color text,
    car_license_plate text,
    car_is_insured boolean not null default false
);

-- 10. Set up RLS for Rides Table
alter table rides
  enable row level security;

create policy "Rides are viewable by everyone." on rides
  for select using (true);

create policy "Users can create their own rides." on rides
  for insert to authenticated with check (auth.uid() = driver_id);

create policy "Drivers can update their own rides." on rides
  for update to authenticated using (auth.uid() = driver_id);

create policy "Drivers can delete their own rides." on rides
  for delete to authenticated using (auth.uid() = driver_id);


-- 11. Create Requests Table
create table requests (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    ride_id uuid not null references public.rides(id) on delete cascade,
    passenger_id uuid not null references public.profiles(id) on delete cascade,
    status public.request_status not null default 'pending'::public.request_status,
    unique(ride_id, passenger_id)
);

-- 12. Set up RLS for Requests Table
alter table requests
    enable row level security;

create policy "Users can view relevant requests." on requests
  for select using (
    (auth.role() = 'authenticated' AND auth.uid() = passenger_id) OR
    (auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM rides WHERE rides.id = requests.ride_id AND rides.driver_id = auth.uid()
    ))
  );

create policy "Passengers can create requests for rides." on requests
    for insert to authenticated with check (auth.uid() = passenger_id);

create policy "Users can update the status of their requests." on requests
    for update to authenticated using (
      (auth.uid() = passenger_id) OR -- Passenger can cancel
      (exists ( -- Driver can accept/reject/cancel booking
            select 1 from rides where rides.id = requests.ride_id and rides.driver_id = auth.uid()
      ))
    );


-- 13. Create Notifications Table
create table notifications (
  id uuid not null default gen_random_uuid() primary key,
  created_at timestamp with time zone not null default now(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ride_id uuid references public.rides(id) on delete cascade,
  request_id uuid references public.requests(id) on delete cascade,
  type public.notification_type not null,
  message text not null,
  is_read boolean not null default false
);

-- 14. Set up RLS for Notifications
alter table notifications enable row level security;

create policy "Users can view their own notifications." on notifications
  for select using (auth.uid() = user_id);

create policy "Users can update the read status of their own notifications." on notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 15. Create Notification Helper Function
create or replace function public.create_notification(
  target_user_id uuid,
  notification_type public.notification_type,
  notification_message text,
  associated_ride_id uuid default null,
  associated_request_id uuid default null
)
returns void as $$
begin
  insert into public.notifications (user_id, type, message, ride_id, request_id)
  values (target_user_id, notification_type, notification_message, associated_ride_id, associated_request_id);
end;
$$ language plpgsql; -- SECURITY INVOKER because we want it to run as the calling user

-- 16. Create Function to Handle Request Updates (with Notifications)
create or replace function public.handle_request_update(request_id_arg uuid, new_status request_status)
returns void as $$
declare
  _ride_id uuid;
  _current_status request_status;
  _updated_ride_id uuid;
  _passenger_id uuid;
  _driver_id uuid;
  _passenger_name text;
  _driver_name text;
  _ride_from text;
  _ride_to text;
begin
  select
    r.ride_id, r.status, r.passenger_id,
    rd.driver_id, p_pass.full_name, p_driver.full_name,
    rd."from", rd."to"
  into _ride_id, _current_status, _passenger_id, _driver_id, _passenger_name, _driver_name, _ride_from, _ride_to
  from public.requests r
  join public.rides rd on r.ride_id = rd.id
  join public.profiles p_pass on r.passenger_id = p_pass.id
  join public.profiles p_driver on rd.driver_id = p_driver.id
  where r.id = request_id_arg;

  if not found then return; end if;

  -- Actor is Passenger
  if auth.uid() = _passenger_id then
    if new_status = 'cancelled' then
      -- Mark previous 'NEW_REQUEST' notification as read to avoid confusion for the driver.
      update public.notifications
      set is_read = true
      where request_id = request_id_arg
      and user_id = _driver_id
      and type = 'NEW_REQUEST'
      and is_read = false;

      update public.requests set status = new_status where id = request_id_arg;
      if _current_status = 'accepted' then
        update public.rides set seats_available = seats_available + 1 where id = _ride_id;
      end if;
      perform create_notification(_driver_id, 'PASSENGER_CANCELLED', _passenger_name || ' cancelled their request for your ride from ' || _ride_from || ' to ' || _ride_to || '.', _ride_id, request_id_arg);
    end if;
    return;
  end if;

  -- Actor is Driver
  if auth.uid() = _driver_id then
    -- Accept
    if _current_status = 'pending' and new_status = 'accepted' then
      update public.rides set seats_available = seats_available - 1 where id = _ride_id and seats_available > 0 returning id into _updated_ride_id;
      if _updated_ride_id is not null then
        update public.requests set status = 'accepted' where id = request_id_arg;
        perform create_notification(_passenger_id, 'REQUEST_ACCEPTED', 'Your request for the ride from ' || _ride_from || ' to ' || _ride_to || ' was accepted!', _ride_id, request_id_arg);
        if (select seats_available from public.rides where id = _ride_id) = 0 then
          update public.requests set status = 'rejected' where ride_id = _ride_id and status = 'pending';
        end if;
      else
        update public.requests set status = 'rejected' where id = request_id_arg;
        perform create_notification(_passenger_id, 'REQUEST_REJECTED', 'Your request for the ride from ' || _ride_from || ' to ' || _ride_to || ' was rejected as the ride is now full.', _ride_id, request_id_arg);
      end if;
    -- Reject
    elsif _current_status = 'pending' and new_status = 'rejected' then
      update public.requests set status = 'rejected' where id = request_id_arg;
      perform create_notification(_passenger_id, 'REQUEST_REJECTED', 'Your request for the ride from ' || _ride_from || ' to ' || _ride_to || ' was rejected by the driver.', _ride_id, request_id_arg);
    -- Cancel Booking
    elsif _current_status = 'accepted' and new_status = 'cancelled' then
      update public.rides set seats_available = seats_available + 1 where id = _ride_id;
      update public.requests set status = 'cancelled' where id = request_id_arg;
      perform create_notification(_passenger_id, 'BOOKING_CANCELLED', _driver_name || ' cancelled your booking for the ride from ' || _ride_from || ' to ' || _ride_to || '.', _ride_id, request_id_arg);
    end if;
  end if;
end;
$$ language plpgsql security definer;

-- 17. Create Function for Driver to Cancel a Ride (with Notifications)
create or replace function public.cancel_ride(ride_id_arg uuid)
returns void as $$
declare
  passenger_record record;
  _ride_from text;
  _ride_to text;
begin
  if not exists (select 1 from public.rides where id = ride_id_arg and driver_id = auth.uid()) then
    raise exception 'Only the driver can cancel this ride.';
  end if;

  select "from", "to" into _ride_from, _ride_to from public.rides where id = ride_id_arg;

  for passenger_record in select passenger_id from public.requests where ride_id = ride_id_arg and status in ('pending', 'accepted') loop
    perform create_notification(
      passenger_record.passenger_id,
      'DRIVER_CANCELLED_RIDE',
      'The ride from ' || _ride_from || ' to ' || _ride_to || ' has been cancelled by the driver.',
      ride_id_arg
    );
  end loop;

  update public.requests set status = 'cancelled' where ride_id = ride_id_arg and status in ('pending', 'accepted');
  update public.rides set status = 'cancelled' where id = ride_id_arg;
end;
$$ language plpgsql security definer;

-- 18. Create Function to Request or Re-request a ride (with Notifications)
create or replace function public.request_or_rerequest_ride(ride_id_arg uuid)
returns setof requests as $$
declare
  _request_id uuid;
  _current_status request_status;
  _driver_id uuid;
  _passenger_name text;
  _ride_from text;
  _ride_to text;
begin
  select driver_id, "from", "to" into _driver_id, _ride_from, _ride_to from public.rides where id = ride_id_arg;
  select full_name into _passenger_name from public.profiles where id = auth.uid();

  select id, status into _request_id, _current_status from public.requests where ride_id = ride_id_arg and passenger_id = auth.uid();
  
  if found then
    if _current_status in ('cancelled', 'rejected') then
      -- Mark previous related notifications (like 'PASSENGER_CANCELLED' or 'REQUEST_REJECTED') as read.
      update public.notifications
      set is_read = true
      where request_id = _request_id
      and user_id = _driver_id
      and type in ('PASSENGER_CANCELLED', 'REQUEST_REJECTED') -- Target specific notifications
      and is_read = false;

      update public.requests set status = 'pending', created_at = now() where id = _request_id;
      perform create_notification(_driver_id, 'NEW_REQUEST', _passenger_name || ' re-submitted a request for your ride from ' || _ride_from || ' to ' || _ride_to || '.', ride_id_arg, _request_id);
    else
      raise exception 'You already have an active request for this ride.';
    end if;
  else
    if _driver_id = auth.uid() then raise exception 'You cannot request to join your own ride.'; end if;
    insert into public.requests (ride_id, passenger_id, status) values (ride_id_arg, auth.uid(), 'pending') returning id into _request_id;
    perform create_notification(_driver_id, 'NEW_REQUEST', _passenger_name || ' wants to join your ride from ' || _ride_from || ' to ' || _ride_to || '.', ride_id_arg, _request_id);
  end if;
  
  return query select * from public.requests where id = _request_id;
end;
$$ language plpgsql security definer;

-- 19. Create Ratings Table
create table ratings (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamp with time zone not null default now(),
    ride_id uuid not null references public.rides(id) on delete cascade,
    rater_id uuid not null references public.profiles(id) on delete cascade,
    ratee_id uuid not null references public.profiles(id) on delete cascade,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    unique(ride_id, rater_id, ratee_id)
);

-- 20. Set up RLS for Ratings
alter table ratings enable row level security;
create policy "Users can create their own ratings." on ratings for insert to authenticated with check (auth.uid() = rater_id);
create policy "Ratings are viewable by everyone." on ratings for select using (true);

-- 21. Create Trigger function to update profile ratings
create or replace function public.update_profile_rating()
returns trigger as $$
begin
  update public.profiles set
    average_rating = (select avg(rating) from public.ratings where ratee_id = new.ratee_id),
    rating_count = (select count(id) from public.ratings where ratee_id = new.ratee_id)
  where id = new.ratee_id;
  return new;
end;
$$ language plpgsql security definer;

-- 22. Create Trigger to execute the function after a new rating is inserted
create trigger on_rating_created
  after insert on public.ratings
  for each row execute procedure public.update_profile_rating();
  
-- 23. Create Function for driver to complete a ride
create or replace function public.complete_ride(ride_id_arg uuid)
returns void as $$
begin
  if not exists (select 1 from public.rides where id = ride_id_arg and driver_id = auth.uid()) then
    raise exception 'Only the driver can complete this ride.';
  end if;
  
  if (select departure_time from public.rides where id = ride_id_arg) > now() then
    raise exception 'Cannot complete a ride that has not happened yet.';
  end if;

  update public.rides set status = 'completed' where id = ride_id_arg and status = 'active';
end;
$$ language plpgsql security definer;

-- ========= DATA MIGRATION (RUN ONCE) =========
-- This script backfills the `email` column for existing users in the `profiles` table.
-- When the `email` column was added, it was NULL for all existing users.
-- This script copies the email from the `auth.users` table to the `public.profiles` table.
-- It's safe to run this multiple times; it will only update profiles where the email is currently missing.

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
```