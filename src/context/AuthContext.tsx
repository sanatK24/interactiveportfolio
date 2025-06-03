import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Session, User } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, isAdmin?: boolean) => Promise<{ user: User; role: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        if (!user?.id) {
          setLoading(false);
          return;
        }
    
        // 1. Try to fetch the profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();  // Changed from .single()
    
        if (profileError) throw profileError;
        
        // 2. If profile exists, update state
        if (profileData) {
          setProfile(profileData);
          setIsAdmin(profileData.is_admin === true);  // Changed from role to is_admin
          return;
        }
    
        // 3. If no profile exists, create one
        if (user?.email) {
          const { error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              is_admin: false,  // Default to non-admin
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
    
          if (createError) throw createError;
    
          // 4. Fetch the newly created profile
          const { data: newProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
    
          if (fetchError) throw fetchError;
    
          if (newProfile) {
            setProfile(newProfile);
            setIsAdmin(newProfile.is_admin === true);
          }
        }
      } catch (error) {
        console.error('Error in fetchProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, isAdmin = false) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;
      if (!user) throw new Error('User not created');

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          email,
          role: isAdmin ? 'admin' : 'user'
        }
      ]);

      if (profileError) throw profileError;

      return { user, role: isAdmin ? 'admin' : 'user' };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      isAdmin,
      signIn,
      signUp,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { supabase };