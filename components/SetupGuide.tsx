import React, { useState } from 'react';

interface SetupGuideProps {
  onRetry: () => void;
  error: string | null;
}

const fullSchemaScript = `-- ========= EXTENSIONS & TYPES =========

-- Create custom enum types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ride_status') THEN
        CREATE TYPE public.ride_status AS ENUM ('active', 'cancelled', 'completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'pending-passenger-approval');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE public.notification_type AS ENUM (
            'NEW_REQUEST',
            'REQUEST_ACCEPTED',
            'REQUEST_REJECTED',
            'PASSENGER_CANCELLED',
            'DRIVER_CANCELLED_RIDE',
            'BOOKING_CANCELLED',
            'PASSENGER_REQUEST_ACCEPTED'
        );
    END IF;
END$$;


-- ========= TABLES =========

-- Profiles table to store public user data
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at timestamp with time zone,
    full_name text,
    avatar_url text,
    phone_number text,
    payment_methods jsonb,
    average_rating real NOT NULL DEFAULT 0,
    rating_count integer NOT NULL DEFAULT 0,
    is_verified_student boolean NOT NULL DEFAULT false,
    username text UNIQUE,
    email text UNIQUE
);
COMMENT ON TABLE public.profiles IS 'Public profile data for users.';

-- Cars table for drivers' vehicles
CREATE TABLE IF NOT EXISTS public.cars (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    make text NOT NULL,
    model text NOT NULL,
    year integer,
    color text,
    license_plate text NOT NULL,
    is_insured boolean NOT NULL DEFAULT false,
    is_default boolean NOT NULL DEFAULT false
);
COMMENT ON TABLE public.cars IS 'Stores vehicle information for drivers.';
CREATE INDEX IF NOT EXISTS cars_owner_id_idx ON public.cars(owner_id);

-- Passenger Ride Requests table
CREATE TABLE IF NOT EXISTS public.passenger_ride_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    passenger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    "from" text NOT NULL,
    "to" text NOT NULL,
    departure_date date NOT NULL,
    flexible_time text NOT NULL,
    seats_needed integer NOT NULL DEFAULT 1,
    notes text,
    status text NOT NULL DEFAULT 'open',
    willing_to_split_fuel boolean NOT NULL DEFAULT false,
    fulfilled_by_driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.passenger_ride_requests IS 'Requests posted by passengers looking for a ride.';

-- Rides table for drivers' ride offers
CREATE TABLE IF NOT EXISTS public.rides (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    "from" text NOT NULL,
    "to" text NOT NULL,
    departure_time timestamp with time zone NOT NULL,
    seats_available integer NOT NULL,
    price integer NOT NULL,
    status public.ride_status NOT NULL DEFAULT 'active',
    fulfilled_from_request_id uuid REFERENCES public.passenger_ride_requests(id) ON DELETE SET NULL,
    car_make text,
    car_model text,
    car_year integer,
    car_color text,
    car_license_plate text,
    car_is_insured boolean
);
COMMENT ON TABLE public.rides IS 'Ride offers posted by drivers.';

-- Requests table for passengers joining a ride
CREATE TABLE IF NOT EXISTS public.requests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    passenger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.request_status NOT NULL DEFAULT 'pending',
    CONSTRAINT unique_ride_passenger UNIQUE (ride_id, passenger_id)
);
COMMENT ON TABLE public.requests IS 'Linking table for passengers requesting to join a ride.';

-- Ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    rater_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ratee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    CONSTRAINT rater_ratee_ride_unique UNIQUE (rater_id, ratee_id, ride_id)
);
COMMENT ON TABLE public.ratings IS 'Stores ratings given by users to each other for rides.';

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ride_id uuid REFERENCES public.rides(id) ON DELETE SET NULL,
    request_id uuid REFERENCES public.requests(id) ON DELETE SET NULL,
    type public.notification_type NOT NULL,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false
);
COMMENT ON TABLE public.notifications IS 'Stores notifications for users.';

-- ========= STORAGE =========
-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 1048576, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;
CREATE POLICY "Anyone can update their own avatar."
ON storage.objects FOR UPDATE
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' );


-- ========= FUNCTIONS & TRIGGERS =========

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, is_verified_student, phone_number)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    (NEW.email ~* '\\\\.edu$'), -- Set is_verified_student if email ends with .edu
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- Function to update seats available on a ride
CREATE OR REPLACE FUNCTION public.update_seats_available()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  seats_to_adjust INT;
  _ride public.rides;
BEGIN
  -- Default to adjusting by 1 seat for regular ride requests (a single passenger joining a pre-existing ride)
  seats_to_adjust := 1;

  -- Find the associated ride to check if it was created to fulfill a multi-seat passenger request
  SELECT * INTO _ride FROM public.rides WHERE id = COALESCE(NEW.ride_id, OLD.ride_id);
  
  -- If the ride was created to fulfill a passenger request, get the actual seats needed from that original request
  IF _ride.fulfilled_from_request_id IS NOT NULL THEN
    SELECT seats_needed INTO seats_to_adjust FROM public.passenger_ride_requests WHERE id = _ride.fulfilled_from_request_id;
  END IF;

  -- Logic for adjusting seats based on request status change
  IF (TG_OP = 'INSERT' AND NEW.status = 'accepted') OR (TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted') THEN
    -- Decrement seats when a request is accepted
    UPDATE public.rides
    SET seats_available = seats_available - seats_to_adjust
    WHERE id = _ride.id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status <> 'accepted') OR (TG_OP = 'DELETE' AND OLD.status = 'accepted') THEN
    -- Increment seats when an accepted request is cancelled/rejected or deleted
    UPDATE public.rides
    SET seats_available = seats_available + seats_to_adjust
    WHERE id = _ride.id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for seats update
DROP TRIGGER IF EXISTS on_request_status_change ON public.requests;
CREATE TRIGGER on_request_status_change
  AFTER INSERT OR UPDATE OR DELETE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_seats_available();

-- Function to update a user's average rating
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    rating_count = (SELECT COUNT(*) FROM public.ratings WHERE ratee_id = NEW.ratee_id),
    average_rating = (SELECT AVG(rating) FROM public.ratings WHERE ratee_id = NEW.ratee_id)
  WHERE id = NEW.ratee_id;
  RETURN NEW;
END;
$$;

-- Trigger for rating update
DROP TRIGGER IF EXISTS on_new_rating ON public.ratings;
CREATE TRIGGER on_new_rating
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_rating();

-- Helper function to create notifications
DROP FUNCTION IF EXISTS public.create_notification(uuid, public.notification_type, text, uuid, uuid);
CREATE OR REPLACE FUNCTION public.create_notification(
    user_id_arg uuid,
    type_arg public.notification_type,
    message_arg text,
    ride_id_arg uuid DEFAULT NULL,
    request_id_arg uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, message, ride_id, request_id)
    VALUES (user_id_arg, type_arg, message_arg, ride_id_arg, request_id_arg);
END;
$$;


-- RPC for requesting a ride
CREATE OR REPLACE FUNCTION public.request_or_rerequest_ride(ride_id_arg uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  _passenger_id uuid := auth.uid();
  _ride public.rides;
  _existing_request public.requests;
BEGIN
  SELECT * INTO _ride FROM public.rides WHERE id = ride_id_arg;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ride not found.'; END IF;
  IF _ride.seats_available <= 0 THEN RAISE EXCEPTION 'This ride is full.'; END IF;
  IF _ride.driver_id = _passenger_id THEN RAISE EXCEPTION 'You cannot request to join your own ride.'; END IF;

  SELECT * INTO _existing_request FROM public.requests WHERE ride_id = ride_id_arg AND passenger_id = _passenger_id;

  IF _existing_request IS NULL THEN
    INSERT INTO public.requests (ride_id, passenger_id, status) VALUES (ride_id_arg, _passenger_id, 'pending');
  ELSE
    IF _existing_request.status IN ('pending', 'accepted') THEN
      RAISE EXCEPTION 'You already have an active request for this ride.';
    ELSE
      UPDATE public.requests SET status = 'pending' WHERE id = _existing_request.id;
    END IF;
  END IF;
END;
$$;

-- RPC for handling request updates (driver accept/reject)
CREATE OR REPLACE FUNCTION public.handle_request_update(request_id_arg uuid, new_status public.request_status)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  _request public.requests;
  _ride public.rides;
BEGIN
  SELECT * INTO _request FROM public.requests WHERE id = request_id_arg;
  SELECT * INTO _ride FROM public.rides WHERE id = _request.ride_id;

  IF auth.uid() <> _ride.driver_id THEN RAISE EXCEPTION 'Only the driver can modify this request.'; END IF;
  IF new_status = 'accepted' AND _ride.seats_available <= 0 THEN RAISE EXCEPTION 'Cannot accept request, the ride is full.'; END IF;
  
  UPDATE public.requests SET status = new_status WHERE id = request_id_arg;
  
  IF new_status = 'accepted' THEN
    PERFORM create_notification(_request.passenger_id, 'REQUEST_ACCEPTED', (SELECT full_name FROM public.profiles WHERE id = _ride.driver_id) || ' accepted your request for the ride from ' || _ride."from" || ' to ' || _ride."to" || '.', _ride.id, _request.id);
  ELSIF new_status = 'rejected' THEN
     PERFORM create_notification(_request.passenger_id, 'REQUEST_REJECTED', (SELECT full_name FROM public.profiles WHERE id = _ride.driver_id) || ' rejected your request for the ride from ' || _ride."from" || ' to ' || _ride."to" || '.', _ride.id, _request.id);
  END IF;
END;
$$;

-- RPCs from migration script
CREATE OR REPLACE FUNCTION public.create_ride_from_request(request_id_arg uuid, departure_time_arg timestamptz, price_arg integer, car_id_arg uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  request_record public.passenger_ride_requests;
  _driver_name text;
  _new_ride_id uuid;
  _new_request_id uuid;
  _car record;
BEGIN
  SELECT * INTO request_record FROM public.passenger_ride_requests WHERE id = request_id_arg AND status = 'open' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found, already fulfilled, or does not exist.'; END IF;
  IF auth.uid() = request_record.passenger_id THEN RAISE EXCEPTION 'You cannot fulfill your own ride request.'; END IF;
  SELECT * INTO _car FROM public.cars WHERE id = car_id_arg AND owner_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Car not found or you are not the owner.'; END IF;
  UPDATE public.passenger_ride_requests SET status = 'pending-passenger-approval', fulfilled_by_driver_id = auth.uid() WHERE id = request_id_arg;
  INSERT INTO public.rides (driver_id, "from", "to", departure_time, seats_available, price, status, fulfilled_from_request_id, car_make, car_model, car_year, car_color, car_license_plate, car_is_insured)
  VALUES (auth.uid(), request_record."from", request_record."to", departure_time_arg, request_record.seats_needed, price_arg, 'active', request_id_arg, _car.make, _car.model, _car.year, _car.color, _car.license_plate, _car.is_insured)
  RETURNING id INTO _new_ride_id;
  INSERT INTO public.requests (ride_id, passenger_id, status) VALUES (_new_ride_id, request_record.passenger_id, 'pending-passenger-approval') RETURNING id INTO _new_request_id;
  SELECT full_name INTO _driver_name FROM public.profiles WHERE id = auth.uid();
  PERFORM create_notification(request_record.passenger_id, 'PASSENGER_REQUEST_ACCEPTED', COALESCE(_driver_name, 'A driver') || ' has made an offer for your ride request from ' || request_record."from" || ' to ' || request_record."to" || '. Please review and respond.', _new_ride_id, _new_request_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.passenger_respond_to_offer(request_id_arg uuid, response_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    _request public.requests; _ride public.rides; _passenger_ride_request public.passenger_ride_requests;
BEGIN
    SELECT * INTO _request FROM public.requests WHERE id = request_id_arg AND passenger_id = auth.uid() FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Request not found or you are not the passenger.'; END IF;
    IF _request.status <> 'pending-passenger-approval' THEN RAISE EXCEPTION 'This offer is not awaiting your approval.'; END IF;
    SELECT * INTO _ride FROM public.rides WHERE id = _request.ride_id;
    IF _ride.fulfilled_from_request_id IS NOT NULL THEN
        SELECT * INTO _passenger_ride_request FROM public.passenger_ride_requests WHERE id = _ride.fulfilled_from_request_id;
    END IF;
    IF response_status = 'accepted' THEN
        UPDATE public.requests SET status = 'accepted' WHERE id = request_id_arg;
        IF _passenger_ride_request.id IS NOT NULL THEN UPDATE public.passenger_ride_requests SET status = 'fulfilled' WHERE id = _passenger_ride_request.id; END IF;
        PERFORM create_notification(_ride.driver_id, 'REQUEST_ACCEPTED', (SELECT full_name FROM profiles WHERE id = auth.uid()) || ' accepted your offer for the ride from ' || _ride."from" || ' to ' || _ride."to" || '.', _ride.id, _request.id);
    ELSIF response_status = 'rejected' THEN
        UPDATE public.requests SET status = 'rejected' WHERE id = request_id_arg;
        IF _passenger_ride_request.id IS NOT NULL THEN UPDATE public.passenger_ride_requests SET status = 'open', fulfilled_by_driver_id = NULL WHERE id = _passenger_ride_request.id; END IF;
        UPDATE public.rides SET status = 'cancelled' WHERE id = _ride.id;
        PERFORM create_notification(_ride.driver_id, 'REQUEST_REJECTED', (SELECT full_name FROM profiles WHERE id = auth.uid()) || ' rejected your offer for the ride from ' || _ride."from" || ' to ' || _ride."to" || '.', _ride.id, _request.id);
    ELSE
        RAISE EXCEPTION 'Invalid response status. Must be ''accepted'' or ''rejected''.';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_default_car(car_id_arg uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.cars SET is_default = false WHERE owner_id = auth.uid() AND is_default = true;
  UPDATE public.cars SET is_default = true WHERE id = car_id_arg AND owner_id = auth.uid();
END;
$$;

-- ========= ROW LEVEL SECURITY (RLS) =========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cars are viewable by everyone." ON public.cars;
CREATE POLICY "Cars are viewable by everyone." ON public.cars FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own cars." ON public.cars;
CREATE POLICY "Users can manage their own cars." ON public.cars FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rides are viewable by everyone." ON public.rides;
CREATE POLICY "Rides are viewable by everyone." ON public.rides FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create rides." ON public.rides;
CREATE POLICY "Authenticated users can create rides." ON public.rides FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Drivers can update their own rides." ON public.rides;
CREATE POLICY "Drivers can update their own rides." ON public.rides FOR UPDATE USING (auth.uid() = driver_id);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view requests related to them." ON public.requests;
CREATE POLICY "Users can view requests related to them." ON public.requests FOR SELECT USING (auth.uid() = passenger_id OR auth.uid() = (SELECT driver_id FROM public.rides WHERE id = ride_id));
DROP POLICY IF EXISTS "Authenticated users can create requests." ON public.requests;
CREATE POLICY "Authenticated users can create requests." ON public.requests FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND passenger_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own requests." ON public.requests;
CREATE POLICY "Users can update their own requests." ON public.requests FOR UPDATE USING (auth.uid() = passenger_id);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ratings are viewable by everyone." ON public.ratings;
CREATE POLICY "Ratings are viewable by everyone." ON public.ratings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can submit ratings." ON public.ratings;
CREATE POLICY "Authenticated users can submit ratings." ON public.ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and manage their own notifications." ON public.notifications;
CREATE POLICY "Users can view and manage their own notifications." ON public.notifications FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.passenger_ride_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Passenger requests are viewable by everyone." ON public.passenger_ride_requests;
CREATE POLICY "Passenger requests are viewable by everyone." ON public.passenger_ride_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create their own passenger requests." ON public.passenger_ride_requests;
CREATE POLICY "Users can create their own passenger requests." ON public.passenger_ride_requests FOR INSERT WITH CHECK (auth.uid() = passenger_id);
DROP POLICY IF EXISTS "Users can update their own requests." ON public.passenger_ride_requests;
CREATE POLICY "Users can update their own requests." ON public.passenger_ride_requests FOR UPDATE USING (auth.uid() = passenger_id);
DROP POLICY IF EXISTS "Drivers can fulfill passenger ride requests." ON public.passenger_ride_requests;
CREATE POLICY "Drivers can fulfill passenger ride requests." ON public.passenger_ride_requests FOR UPDATE USING (auth.uid() <> passenger_id);
`;

const DatabaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const ClipboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const Step: React.FC<{ number: number; title: string; children: React.ReactNode; icon: React.ReactElement; }> = ({ number, title, children, icon }) => (
    <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ring-4 bg-blue-500 ring-blue-100">
                {number}
            </div>
            <div className="mt-2 text-blue-500">{icon}</div>
        </div>
        <div>
            <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
            <div className="text-slate-600 space-y-2">{children}</div>
        </div>
    </div>
);


const SetupGuide: React.FC<SetupGuideProps> = ({ onRetry, error }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSchemaScript).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center">
            <span className="inline-block p-3 bg-red-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </span>
            <h1 className="text-2xl font-bold text-slate-800 mt-4">Database Setup Required</h1>
            {error && <p className="mt-2 text-red-600">{error}</p>}
        </div>

        <div className="mt-8 text-left text-slate-700 space-y-8">
            <Step number={1} title="Run the Database Script" icon={<CodeIcon />}>
                <p>Go to the <strong>SQL Editor</strong> in your Supabase project, create a <strong>"+ New query"</strong>, and run the script below to create the tables.</p>
                 <button 
                    onClick={handleCopy}
                    className={`mt-2 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isCopied 
                        ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500' 
                        : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                    }`}
                >
                    {isCopied ? <><CheckIcon /> Copied!</> : <><ClipboardIcon /> Copy Script</>}
                </button>
            </Step>
            
            <Step number={2} title="Finish Setup" icon={<PlayIcon />}>
                <p>After the script has successfully run, click the button below to start the app.</p>
                <button
                    onClick={onRetry}
                    className="mt-2 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    I've run the script, launch app!
                </button>
            </Step>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;