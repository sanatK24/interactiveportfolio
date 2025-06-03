import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Session, User } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Profile = Database['public']['Tables']['profiles']['Row'];

export type AccountType = 'admin' | 'user';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, isAdmin?: boolean) => Promise<{ user: User; role: string }>;
  signOut: () => Promise<void>;
  directLogin: (accountType: AccountType) => Promise<void>;
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
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
        setIsAdmin(profileData?.role === 'admin');
      } catch (error) {
        console.error('Error fetching profile:', error);
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
      setProfile(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const directLogin = async (accountType: AccountType = 'user'): Promise<void> => {
    const testAccounts = {
      admin: {
        email: 'admin@example.com',
        password: 'admin123',
        isAdmin: true
      },
      user: {
        email: 'user@example.com',
        password: 'user123',
        isAdmin: false
      }
    };

    const account = testAccounts[accountType];
    
    try {
      setLoading(true);
      console.log(`Attempting direct login as ${accountType}...`);

      // First try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (signInError) {
        // If sign in fails, check if it's because the user doesn't exist
        if (signInError.message.includes('Invalid login credentials')) {
          // User doesn't exist, try to sign up
          console.log('Account not found, attempting sign up...');
          try {
            await signUp(account.email, account.password, account.isAdmin);
          } catch (signUpError: any) {
            // If sign up fails with unique constraint, it means the user exists in auth but not in profiles
            if (signUpError.code === '23505') {
              console.log('User exists in auth but not in profiles, signing in...');
              // Just sign in again, the profile will be created by the auth state change listener
              await supabase.auth.signInWithPassword({
                email: account.email,
                password: account.password,
              });
            } else {
              throw signUpError;
            }
          }
        } else {
          throw signInError;
        }
      }
    } catch (error) {
      console.error(`Error in direct login as ${accountType}:`, error);
      throw error;
    } finally {
      setLoading(false);
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
      directLogin,
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