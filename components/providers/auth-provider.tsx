'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { api, queryKeys } from '@/lib/api';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import type { MeSummary } from '@/lib/server/me';

type GateMode = 'signup' | 'login';

interface AuthContextValue {
  user: User | null;
  me: MeSummary | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
  gate: { open: boolean; mode: GateMode; reason?: string };
  openGate: (mode?: GateMode, reason?: string) => void;
  closeGate: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [gate, setGate] = useState<AuthContextValue['gate']>({ open: false, mode: 'signup' });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      qc.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const meQuery = useQuery({
    queryKey: [...queryKeys.me, user?.id],
    queryFn: () => api<MeSummary>('/me'),
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const refreshMe = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: queryKeys.me });
  }, [qc]);

  const signOut = useCallback(async () => {
    await getSupabaseBrowser().auth.signOut();
    setUser(null);
    qc.clear();
    window.location.href = '/';
  }, [qc]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      me: user ? meQuery.data ?? null : null,
      loading: !ready || (Boolean(user) && meQuery.isLoading),
      refreshMe,
      signOut,
      gate,
      openGate: (mode = 'signup', reason) => setGate({ open: true, mode, reason }),
      closeGate: () => setGate((g) => ({ ...g, open: false })),
    }),
    [user, meQuery.data, meQuery.isLoading, ready, refreshMe, signOut, gate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
