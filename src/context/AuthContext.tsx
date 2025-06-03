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
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session }>;
  signUp: (email: string, password: string, isAdmin?: boolean) => Promise<{ user: User; isAdmin: boolean }>;
  signOut: () => Promise<void>;
  directLogin: (accountType: AccountType) => Promise<{ user: User | null; session: Session | null }>;
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
      if (!user) return;
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          // If profile doesn't exist, create it
          if (profileError.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([{ id: user.id, email: user.email, is_admin: false }]);
              
            if (insertError) throw insertError;
            setIsAdmin(false);
          } else {
            throw profileError;
          }
        } else {
          setProfile(profileData);
          setIsAdmin(!!profileData?.is_admin);
        }
      } catch (error) {
        console.error('Error in fetchProfile:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      // The auth state change will be handled by the onAuthStateChange listener
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, isAdmin = false) => {
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;
      if (!data.user) throw new Error('User not created');

      // Create profile with is_admin flag
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          email,
          is_admin: isAdmin
        }
      ]);

      if (profileError) {
        // If profile already exists, update it
        if (profileError.code === '23505') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: isAdmin })
            .eq('email', email);
            
          if (updateError) throw updateError;
        } else {
          throw profileError;
        }
      }

      return { user: data.user, isAdmin };
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

  const directLogin = async (accountType: AccountType = 'user'): Promise<{ user: User | null; session: Session | null }> => {
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
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (signInError) {
        // If sign in fails, check if it's because the user doesn't exist
        if (signInError.message.includes('Invalid login credentials')) {
          // User doesn't exist, try to sign up
          console.log('Account not found, attempting sign up...');
          try {
            // Create the user and profile with is_admin flag
            const { data: signUpData } = await supabase.auth.signUp({
              email: account.email,
              password: account.password,
            });

            if (!signUpData.user) throw new Error('User creation failed');

            // Create profile with is_admin flag
            const { error: profileError } = await supabase.from('profiles').insert([
              {
                id: signUpData.user.id,
                email: account.email,
                is_admin: account.isAdmin
              }
            ]);

            if (profileError) throw profileError;

            // Sign in after successful sign up
            const { data } = await supabase.auth.signInWithPassword({
              email: account.email,
              password: account.password,
            });
            return data;
          } catch (signUpError: any) {
            // If sign up fails with unique constraint, it means the user exists in auth but not in profiles
            if (signUpError.code === '23505') {
              console.log('User exists in auth but not in profiles, creating profile...');
              // Create profile and sign in
              const { data: signInData } = await supabase.auth.signInWithPassword({
                email: account.email,
                password: account.password,
              });
              
              if (signInData.user) {
                await supabase.from('profiles').insert([
                  {
                    id: signInData.user.id,
                    email: account.email,
                    is_admin: account.isAdmin
                  }
                ]);
              }
              
              return signInData;
            } else {
              throw signUpError;
            }
          }
        } else {
          throw signInError;
        }
      }
      
      // If we get here, sign in was successful
      return signInData;
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