'use client';

import { useEffect, useState } from 'react';
import { useReducedMotionConfig } from 'framer-motion';

/**
 * Reduced-motion preference that honours both the OS setting and the in-app
 * setting (MotionConfig reducedMotion="always" from SettingsBridge).
 * Returns false until mounted so server and first client render match.
 */
export function useReducedMotionSafe(): boolean {
  const reduce = useReducedMotionConfig();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(reduce);
}
