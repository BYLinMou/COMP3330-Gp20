import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

type AuthCtx = { session: Session | null; loading: boolean };
const AuthContext = createContext<AuthCtx>({ session: null, loading: true });

// Create a mock session for demo mode
const createMockSession = (): Session => ({
  access_token: 'demo-token',
  refresh_token: 'demo-refresh',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: {
    id: 'demo-user-id',
    email: 'demo@aurapet.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
  },
} as Session);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start with mock session for demo mode to avoid redirects
  const [session, setSession] = useState<Session | null>(createMockSession());
  const [loading, setLoading] = useState(false); // Set to false for immediate demo mode

  useEffect(() => {
    // Try to get actual session in background
    supabase.auth.getSession()
      .then(({ data, error }: any) => {
        if (!error && data?.session) {
          // Only update if we got a real session
          setSession(data.session);
        }
        // Keep mock session if there's an error or no real session
        setLoading(false);
      })
      .catch(() => {
        // Keep mock session on error
        console.log('📱 Running in demo mode - using mock session');
        setLoading(false);
      });
    
    // 2) Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: any, s: any) => {
        if (s) {
          setSession(s);
        }
      });
      
      return () => subscription.unsubscribe();
    } catch (error) {
      // If onAuthStateChange fails, just return empty cleanup
      return () => {};
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
