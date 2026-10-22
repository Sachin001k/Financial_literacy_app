'use client';

import { useQuery } from '@tanstack/react-query';
import { api, queryKeys } from '@/lib/api';

export interface AssessmentRow {
  id: string;
  type: string;
  score: number;
  breakdown: Record<string, number>;
  taken_at: string;
}

export function useAssessments() {
  return useQuery({ queryKey: queryKeys.assessments, queryFn: () => api<{ assessments: AssessmentRow[] }>('/me/assessments') });
}
