import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useAdmin() {
  const supabase = useSupabaseClient();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);

  const checkAdminStatus = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAdmin(false);
        setInitialCheckDone(true);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single<Profile>();

      if (error) {
        console.error('Error fetching profile:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!profile?.is_admin);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  };

  useEffect(() => {
    checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          await checkAdminStatus();
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { 
    isAdmin, 
    loading: loading || !initialCheckDone 
  };
}