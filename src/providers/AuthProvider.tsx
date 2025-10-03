import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

type AuthCtx = { session: Session | null; loading: boolean };
const AuthContext = createContext<AuthCtx>({ session: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) 启动时获取现有会话（持久化生效）
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
      setLoading(false);
    });
    // 2) 监听会话变化（登录/登出/刷新）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
