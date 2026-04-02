export const visitStatuses = ['active', 'completed', 'cancelled'] as const;
export type VisitStatus = (typeof visitStatuses)[number];

export const visitSources = ['manual', 'prompted', 'recovered'] as const;
export type VisitSource = (typeof visitSources)[number];

export const visitConfidences = ['high', 'medium', 'low'] as const;
export type VisitConfidence = (typeof visitConfidences)[number];

export interface Visit {
  id: string;
  gymId: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  status: VisitStatus;
  source: VisitSource;
  confidence: VisitConfidence;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
