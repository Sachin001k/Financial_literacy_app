'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { playSound, type SoundName } from '@/lib/sound';
import { useAuth } from './auth-provider';

interface SoundContextValue {
  enabled: boolean;
  setEnabled: (on: boolean) => void;
  play: (name: SoundName) => void;
}

const SoundContext = createContext<SoundContextValue>({ enabled: true, setEnabled: () => {}, play: () => {} });

export function SoundProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    if (me) setEnabledState(me.settings.soundOn);
    else {
      try {
        setEnabledState(localStorage.getItem('finplay:sound') !== 'off');
      } catch {}
    }
  }, [me]);

  const setEnabled = useCallback((on: boolean) => {
    setEnabledState(on);
    try {
      localStorage.setItem('finplay:sound', on ? 'on' : 'off');
    } catch {}
  }, []);

  const play = useCallback((name: SoundName) => enabled && playSound(name), [enabled]);

  return <SoundContext.Provider value={{ enabled, setEnabled, play }}>{children}</SoundContext.Provider>;
}

export const useSound = () => useContext(SoundContext);
