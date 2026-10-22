'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { api, queryKeys } from '@/lib/api';

/** Marks the lesson IN_PROGRESS for signed-in readers. */
export function LessonTracker({ slug }: { slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    if (!user) return;
    api(`/learn/lessons/${slug}`)
      .then(() => qc.invalidateQueries({ queryKey: queryKeys.progress }))
      .catch(() => {});
  }, [user, slug, qc]);
  return null;
}
