import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { getProfile, createProfile } from '../services/profileService';
import { Profile } from '../types';


interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fetchProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 500;
    let profileData: Profile | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        profileData = await getProfile(user.id);
        if (profileData) {
          setProfile(profileData);
          return; // Success, profile found.
        }
        // Profile not yet created, wait and retry.
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      } catch (error: any) {
        console.error(`Attempt ${attempt} to fetch profile failed:`, error.message || error);
        // Do not stop retrying on error, it might be a temporary network issue.
      }
    }

    // If profile is still not found after retries, it's likely the trigger failed.
    // Let's create a default profile for the user as a fallback.
    if (!profileData) {
      console.warn(`Profile for ${user.id} not found after retries. Attempting to create one.`);
      try {
        // Use the part of the email before the '@' as a default full_name.
        const defaultFullName = user.email?.split('@')[0] || 'New User';
        await createProfile({
          id: user.id,
          full_name: defaultFullName,
          avatar_url: null,
        });

        // Fetch the newly created profile
        const newProfile = await getProfile(user.id);
        if (newProfile) {
          setProfile(newProfile);
          console.log(`Successfully created and fetched profile for ${user.id}.`);
        } else {
          // This would be very unusual.
          console.error("Failed to fetch profile even after creating it.");
          setProfile(null);
        }
      } catch (createError: any) {
        console.error('Failed to create and fetch profile:', createError.message || createError);
        setProfile(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      await fetchProfile(session?.user ?? null);
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      await fetchProfile(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);
  
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    isAuthModalOpen,
    openAuthModal: () => setIsAuthModalOpen(true),
    closeAuthModal: () => setIsAuthModalOpen(false),
    signOut,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};