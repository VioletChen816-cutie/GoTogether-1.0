import { supabase } from '../lib/supabaseClient';
import { Profile, Car, CarInfo } from '../types';

export const getProfile = async (userId: string): Promise<Profile | null> => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, updated_at, full_name, avatar_url, phone_number, average_rating, rating_count')
    .eq('id', userId)
    .single();

  // If the error is PGRST116, it means no profile was found. This is an expected
  // state for a new user, so we return null instead of throwing an error.
  if (error && error.code === 'PGRST116') {
    return null;
  }
  
  if (error) {
    console.error('Error fetching profile:', error.message);
    throw error;
  }

  return data;
};

export const updateProfile = async (userId: string, updates: { full_name: string; avatar_url: string | null; phone_number: string | null; }) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.from('profiles').update({
        full_name: updates.full_name,
        avatar_url: updates.avatar_url,
        phone_number: updates.phone_number,
        updated_at: new Date().toISOString(),
    }).eq('id', userId);

    if (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

export const createProfile = async (profileData: { id: string; full_name: string; avatar_url: string | null; }) => {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase.from('profiles').insert({
    id: profileData.id,
    full_name: profileData.full_name,
    avatar_url: profileData.avatar_url,
    phone_number: null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    // It might fail if the trigger finally ran and created the profile (race condition).
    // A '23505' (unique_violation) error is expected in this case. We can safely ignore it,
    // as it means the profile exists, which was our goal.
    if (error.code !== '23505') {
      console.error('Error creating profile:', error);
      throw error;
    } else {
        console.warn("Attempted to create a profile that already exists. Continuing...");
    }
  }
};


export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    if (!supabase) throw new Error('Supabase client not initialized');

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading avatar', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

// --- Car Management ---

const handleSupabaseError = (error: any, context: string) => {
    if (!error) return;
    console.error(`Error ${context}:`, error);
    let message = 'An unknown database error occurred.';
    if (typeof error.message === 'string' && error.message) {
        message = error.message;
    } else if (typeof error.details === 'string' && error.details) {
        message = error.details; // Fallback to details if message is not helpful
    }
    throw new Error(message);
};

export const getCarsForUser = async (userId: string): Promise<Car[]> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('owner_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching cars:', error);
        throw error;
    }
    return data || [];
};

export const addCar = async (carData: Omit<Car, 'id' | 'owner_id' | 'is_default'>): Promise<Car> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in');

    const { data, error } = await supabase
        .from('cars')
        .insert({ ...carData, owner_id: user.id })
        .select()
        .single();
    
    if (error) {
        handleSupabaseError(error, 'adding car');
    }
    return data;
};

export const updateCar = async (carId: string, carData: CarInfo): Promise<Car> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase
        .from('cars')
        .update(carData)
        .eq('id', carId)
        .select()
        .single();
    
    if (error) {
        handleSupabaseError(error, 'updating car');
    }
    return data;
};

export const deleteCar = async (carId: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

    if (error) {
        handleSupabaseError(error, 'deleting car');
    }
};

export const setDefaultCar = async (carId: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.rpc('set_default_car', { car_id_arg: carId });

    if (error) {
        handleSupabaseError(error, 'setting default car');
    }
};