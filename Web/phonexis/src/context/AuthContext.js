import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(data?.session || null);
        setIsLoading(false);
      }
    };

    void restoreSession();

    const { data: authState } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession || null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authState?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading,
    signOut: () => supabase.auth.signOut(),
  }), [session, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return auth;
}
