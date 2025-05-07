import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
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
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Try to get the profile first
      const { data: profile, error: getError } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', userId)
        .single();

      if (getError) {
        // If we get a 406 error (Not Acceptable), it means the table exists but we don't have permission
        // This is expected behavior for RLS, so we can check if the user exists in auth.users
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser && authUser.user) {
          // If user exists in auth.users but not in profiles, create the profile
          const { error: createError } = await supabase
            .from('profiles')
            .insert({ 
              id: userId, 
              email: authUser.user.email, // Get email from auth user
              password: '', // We don't store actual password here, just a placeholder
              role: 'user' 
            })
            .select('role, email')
            .single();

          if (createError) {
            // If we get a 409 error (Conflict), it means the profile was created by another request
            if (createError.code === '23505') {
              // Try to get the profile again
              const { data: createdProfile, error: getCreatedError } = await supabase
                .from('profiles')
                .select('role, email')
                .eq('id', userId)
                .single();
              
              if (getCreatedError) {
                console.error('Error getting created profile:', getCreatedError);
                setProfile(null);
                return;
              }
              setProfile(createdProfile);
            } else {
              console.error('Error creating profile:', createError);
              setProfile(null);
              return;
            }
          } else {
            setProfile({ role: 'user', email: authUser.user.email });
          }
        } else {
          console.error('User not found in auth.users:', getError);
          setProfile(null);
        }
      } else {
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // After successful sign in, fetch the profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, isAdmin = false) => {
    try {
      // First create the user in Supabase Auth
      const { error: authError, data: { user } } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: isAdmin ? 'admin' : 'user'
          }
        }
      });

      if (authError) throw authError;
      if (!user) throw new Error('User not found after sign up');

      // Check if this is the first user
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      // If no users exist yet, make this user an admin
      const role = existingUsers?.length === 0 ? 'admin' : (isAdmin ? 'admin' : 'user');

      // Create the profile with user info
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          password: '', // We don't store actual password here, just a placeholder
          role: role
        })
        .select('role, email')
        .single();

      if (profileError) throw profileError;

      // Set the user's role in auth metadata
      await supabase.auth.updateUser({
        data: {
          role: role
        }
      });

      return { user, role };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile,
      isAdmin: profile?.role === 'admin',
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