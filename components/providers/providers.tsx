'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from 'next-themes';
import { AuthProvider, useAuth } from './auth-provider';
import { SoundProvider } from './sound-provider';
import { Toaster } from './toaster';

/** Applies the signed-in user's accessibility + theme settings. */
function SettingsBridge({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const { setTheme } = useTheme();
  const reduced = me?.settings.reducedMotion ?? false;

  useEffect(() => {
    if (!me) return;
    document.documentElement.classList.toggle('high-contrast', me.settings.highContrast);
    document.documentElement.classList.toggle('reduce-motion', me.settings.reducedMotion);
    setTheme(me.settings.theme);
  }, [me, setTheme]);

  return <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>{children}</MotionConfig>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } }));
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <SoundProvider>
            <SettingsBridge>
              {children}
              <Toaster />
            </SettingsBridge>
          </SoundProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
